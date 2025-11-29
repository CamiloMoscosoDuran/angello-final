# app.py (ACTUALIZADO) - integra carrito en session + conexión MySQL + auth y demás rutas
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import pymysql
import json
from decimal import Decimal
from datetime import datetime

app = Flask(__name__)

# ----------------------------------------------------------------------
# 🔐 CLAVE SECRETA Y CONFIG BD
# ----------------------------------------------------------------------
app.secret_key = 'TU_CLAVE_SECRETA_SUPER_LARGA_Y_COMPLEJA'

DB_HOST = 'angellovg.c0u8dgzrembt.us-east-1.rds.amazonaws.com'
DB_USER = 'admin'
DB_PASSWORD = 'CamiloTech'
DB_NAME = 'dbangello'

# ----------------------------------------------------------------------
# 🔹 FUNCIÓN DE CONEXIÓN A BD
# ----------------------------------------------------------------------
def get_db_connection():
    try:
        conexion = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=False
        )
        return conexion
    except Exception as e:
        print("❌ Error al conectar con la base de datos:", e)
        return None

# ------------------------------
# Util: estado de login
# ------------------------------
def loggedin():
    return session.get('loggedin', False)

# ------------------------------
# Helper: inicializar carrito en session
# ------------------------------
def ensure_cart():
    if 'cart' not in session:
        # Usamos dict con claves por id para accesos rápidos
        session['cart'] = {}
        session.modified = True

def cart_count():
    ensure_cart()
    return sum(int(i.get('cantidad', 1)) for i in session['cart'].values())
# Obtener (o crear) carrito abierto para un usuario
def get_or_create_open_cart(conn, usuario_id):
    with conn.cursor() as cursor:
        cursor.execute("SELECT idCarrito FROM Carrito WHERE idUsuario=%s AND estado='abierto' LIMIT 1", (usuario_id,))
        row = cursor.fetchone()
        if row:
            return row['idCarrito']
        # crear nuevo carrito
        cursor.execute("INSERT INTO Carrito (idUsuario) VALUES (%s)", (usuario_id,))
        conn.commit()
        return cursor.lastrowid

# Obtener conteo total de items y lista de items de carrito abierto
def get_cart_summary(conn, usuario_id):
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT c.idCarrito, cd.idDetalle, cd.idProducto, p.nombre, cd.cantidad, cd.precioUnitario, cd.subtotal
            FROM Carrito c
            JOIN CarritoDetalle cd ON c.idCarrito = cd.idCarrito
            JOIN Producto p ON cd.idProducto = p.idProducto
            WHERE c.idUsuario = %s AND c.estado = 'abierto'
        """, (usuario_id,))
        items = cursor.fetchall()
        total = sum([float(i['subtotal']) for i in items]) if items else 0.0
        count = sum([int(i['cantidad']) for i in items]) if items else 0
    return {'items': items, 'total': total, 'count': count}

def cart_total():
    ensure_cart()
    total = Decimal('0.00')
    for item in session['cart'].values():
        total += Decimal(str(item.get('precio', 0))) * int(item.get('cantidad', 1))
    # devolver float para JSON/templates
    return float(total)


# ------------------------------
# RUTAS DE AUTENTICACIÓN
# ------------------------------
@app.route('/registro', methods=['GET', 'POST'])
def registro():
    if request.method == 'POST':
        nombre = request.form.get('nombre')
        apellidos = request.form.get('apellidos')
        usuario = request.form.get('usuario')
        dni = request.form.get('dni')
        correo = request.form.get('correo')
        contrasena = request.form.get('contrasena')

        contrasena_hash = generate_password_hash(contrasena)

        conn = get_db_connection()
        if not conn:
            return render_template("registro.html", error="No se pudo conectar a la base de datos.")

        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO Registro (nombre, apellidos, usuario, dni, correo)
                    VALUES (%s, %s, %s, %s, %s)
                """, (nombre, apellidos, usuario, dni, correo))
                cursor.execute("""
                    INSERT INTO Usuarios (nombre, correo, contrasena_hash)
                    VALUES (%s, %s, %s)
                """, (nombre, correo, contrasena_hash))
                conn.commit()
                flash('¡Cuenta creada exitosamente! Ahora solo inicia sesión.', 'success')
                return redirect(url_for('inicio_secion'))
        except Exception as e:
            print("❌ ERROR REGISTRO:", e)
            conn.rollback()
            return render_template("registro.html", error="Hubo un error al registrarte. Verifica tus datos.")
        finally:
            conn.close()

    return render_template("registro.html")


@app.route('/inicio_secion', methods=['GET', 'POST'])
def inicio_secion():
    success_message = request.args.get('success')

    if session.get('loggedin'):
        return redirect(url_for('inicio_premium'))

    if request.method == 'POST':
        correo = request.form['correo']
        contrasena = request.form['contrasena']

        conn = get_db_connection()
        if conn is None:
            flash('Error de conexión a la base de datos.', 'error')
            return render_template('inicio_secion.html', loggedin=False)

        try:
            with conn.cursor() as cursor:
                sql = "SELECT id, nombre, correo, contrasena_hash FROM Usuarios WHERE correo = %s"
                cursor.execute(sql, (correo,))
                user = cursor.fetchone()

                apodo = None
                if user:
                    cursor.execute("SELECT usuario FROM Registro WHERE correo = %s", (correo,))
                    reg = cursor.fetchone()
                    if reg:
                        apodo = reg['usuario']

            if user and check_password_hash(user['contrasena_hash'], contrasena):
                session['loggedin'] = True
                session['id'] = user['id']
                session['nombre'] = apodo if apodo else user['nombre']
                session['apodo'] = apodo if apodo else user['nombre']
                return redirect(url_for('inicio_premium'))
            else:
                flash('Correo o contraseña incorrectos.', 'error')
                return render_template('inicio_secion.html', loggedin=False)
        except Exception as e:
            print(f"❌ Error al iniciar sesión: {e}")
            flash('Error interno del servidor.', 'error')
            return render_template('inicio_secion.html', loggedin=False)
        finally:
            conn.close()

    return render_template('inicio_secion.html', success=success_message,
                           loggedin=session.get('loggedin', False), nombre=session.get('nombre'))


@app.route('/logout')
def logout():
    session.clear()
    flash('Sesión cerrada correctamente.', 'info')
    return redirect(url_for('inicio'))

# ----------------------------------------------------------------------
# RUTAS PRINCIPALES
# ----------------------------------------------------------------------
@app.route('/')
@app.route('/inicio')
def inicio():
    if session.get('loggedin'):
        return redirect(url_for('inicio_premium'))
    return render_template('inicio.html', loggedin=False, nombre=None)


@app.route('/inicio-premium')
def inicio_premium():
    if not session.get('loggedin'):
        flash('Debes iniciar sesión para acceder al contenido Premium.', 'error')
        return redirect(url_for('inicio_secion'))
    return render_template('inicio_premium.html', loggedin=True,
                           nombre=session.get('nombre'), success=request.args.get('success'))


@app.route('/promociones')
def promociones():
    if not session.get('loggedin'):
        flash('Esta sección es exclusiva para miembros.', 'error')
        return redirect(url_for('inicio_secion'))
    return render_template('promociones.html', loggedin=True, nombre=session.get('nombre'))


@app.route('/nuestra-historia')
def historia():
    return render_template('historia.html',
                           loggedin=session.get('loggedin', False),
                           nombre=session.get('nombre'))

# ----------------------------------------------------------------------
# RUTAS DE CARTAS
# ----------------------------------------------------------------------
@app.route('/nuestra-carta')
def cartas():
    logged = loggedin()
    nombre = session.get('nombre') if logged else None
    return render_template('cartas.html', loggedin=logged, nombre=nombre)

@app.route('/carta/pollos')
def carta_pollo():
    if not loggedin():
        flash('Debes iniciar sesión para ver el menú de Pollos.', 'error')
        return redirect(url_for('inicio_secion'))
    return render_template('carta_pollo.html', loggedin=True, nombre=session.get('nombre'))

@app.route('/carta/pizzas')
def carta_pizza():
    if not loggedin():
        flash('Debes iniciar sesión para ver el menú de Pizzas.', 'error')
        return redirect(url_for('inicio_secion'))
    return render_template('carta_pizza.html', loggedin=True, nombre=session.get('nombre'))

@app.route('/carta/pastas')
def carta_pasta():
    if not loggedin():
        flash('Debes iniciar sesión para ver el menú de Pastas.', 'error')
        return redirect(url_for('inicio_secion'))
    return render_template('carta_pasta.html', loggedin=True, nombre=session.get('nombre'))

@app.route('/carta/bebidas')
def carta_bebidas():
    if not loggedin():
        flash('Debes iniciar sesión para ver el menú de Bebidas.', 'error')
        return redirect(url_for('inicio_secion'))
    return render_template('carta_bebidas.html', loggedin=True, nombre=session.get('nombre'))

@app.route('/carta/entradas')
def carta_entradas():
    if not loggedin():
        flash('Debes iniciar sesión para ver el menú de Entradas.', 'error')
        return redirect(url_for('inicio_secion'))
    return render_template('carta_entradas.html', loggedin=True, nombre=session.get('nombre'))

@app.route('/carta/ensaladas')
def carta_ensaladas():
    if not loggedin():
        flash('Debes iniciar sesión para ver el menú de Ensaladas.', 'error')
        return redirect(url_for('inicio_secion'))
    return render_template('carta_ensaladas.html', loggedin=True, nombre=session.get('nombre'))


# RUTAS PARA COPIAS 'cc_'
@app.route('/cc/bebidas')
def cc_bebidas():
    if not loggedin():
        flash('Debes iniciar sesión para ver el menú de Bebidas.', 'error')
        return redirect(url_for('inicio_secion'))
    return render_template('cc_bebidas.html', loggedin=True, nombre=session.get('nombre'))


@app.route('/cc/pollos')
def cc_pollos():
    if not loggedin():
        flash('Debes iniciar sesión para ver el menú de Pollos.', 'error')
        return redirect(url_for('inicio_secion'))
    return render_template('cc_pollo.html', loggedin=True, nombre=session.get('nombre'))


@app.route('/cc/pizzas')
def cc_pizzas():
    if not loggedin():
        flash('Debes iniciar sesión para ver el menú de Pizzas.', 'error')
        return redirect(url_for('inicio_secion'))
    return render_template('cc_pizzas.html', loggedin=True, nombre=session.get('nombre'))


@app.route('/cc/entradas')
def cc_entradas():
    if not loggedin():
        flash('Debes iniciar sesión para ver el menú de Entradas.', 'error')
        return redirect(url_for('inicio_secion'))
    return render_template('cc_entradas.html', loggedin=True, nombre=session.get('nombre'))


@app.route('/cc/ensaladas')
def cc_ensaladas():
    if not loggedin():
        flash('Debes iniciar sesión para ver el menú de Ensaladas.', 'error')
        return redirect(url_for('inicio_secion'))
    return render_template('cc_ensaladas.html', loggedin=True, nombre=session.get('nombre'))


@app.route('/cc/pastas')
def cc_pastas():
    if not loggedin():
        flash('Debes iniciar sesión para ver el menú de Pastas.', 'error')
        return redirect(url_for('inicio_secion'))
    return render_template('cc_pastas.html', loggedin=True, nombre=session.get('nombre'))

# Delivery carta (puede obtener desde tabla 'platos' si existe)
@app.route('/delivery_carta')
def delivery_carta():
    conn = get_db_connection()
    platos = []
    if conn:
        try:
            with conn.cursor() as cursor:
                # Ajusta el nombre de la tabla/nombres si en tu BD difieren
                cursor.execute("SELECT id, nombre, precio, imagen FROM platos")
                platos = cursor.fetchall()
        except Exception as e:
            print("⚠️ no se pudo leer tabla platos, usando fallback:", e)
            platos = [
                {"id": 1, "nombre": "Inka Cola 500ml", "precio": 4.50, "imagen": "image/bebidas/inka500.png"},
                {"id": 2, "nombre": "Coca Cola 500ml", "precio": 4.50, "imagen": "image/bebidas/coca500.png"}
            ]
        finally:
            conn.close()
    else:
        platos = [
            {"id": 1, "nombre": "Inka Cola 500ml", "precio": 4.50, "imagen": "image/bebidas/inka500.png"},
            {"id": 2, "nombre": "Coca Cola 500ml", "precio": 4.50, "imagen": "image/bebidas/coca500.png"}
        ]

    return render_template('delivery_carta.html', productos=platos, loggedin=loggedin())

# ----------------------------------------------------------------------
# RUTAS DEL CARRITO (AJAX / SESSION)
# ----------------------------------------------------------------------
@app.route('/agregar_carrito', methods=['POST'])
def agregar_carrito():
    if not session.get('loggedin'):
        return jsonify({"error": "login_required"}), 403

    data = request.get_json() or {}
    # intentar obtener idProducto desde payload (recomendado)
    id_producto = data.get('id') or data.get('idProducto') or None
    nombre = data.get('nombre') or data.get('name') or None
    try:
        precio = float(data.get('precio') or data.get('price') or 0)
    except:
        precio = 0.0

    usuario_id = session.get('id')  # asumimos que tu login guarda Usuarios.id en session['id']

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "db_error"}), 500

    try:
        with conn.cursor() as cursor:
            # DEBUG: Agregar logs para identificar el problema
            print(f"🔍 Debug - Datos recibidos: id='{id_producto}', nombre='{nombre}', precio={precio}")
            
            # 1) Si no envían idProducto pero sí nombre: buscar idProducto por nombre
            if not id_producto and nombre:
                # Primero verificar si el producto existe exactamente como viene
                cursor.execute("SELECT idProducto, precio, nombre FROM Producto WHERE nombre = %s LIMIT 1", (nombre,))
                prod = cursor.fetchone()
                print(f"🔍 Debug - Consulta exacta: SELECT idProducto, precio, nombre FROM Producto WHERE nombre = '{nombre}'")
                print(f"🔍 Debug - Resultado BD: {prod}")
                
                if not prod:
                    # Si no existe exacto, buscar productos similares para debugging
                    print(f"❌ Error: Producto '{nombre}' no encontrado EXACTAMENTE")
                    cursor.execute("SELECT nombre, idProducto FROM Producto WHERE nombre LIKE %s LIMIT 10", (f"%{nombre}%",))
                    similares = cursor.fetchall()
                    print(f"🔍 Productos con nombre similar: {similares}")
                    
                    # También buscar por palabras clave
                    palabras = nombre.split()
                    if len(palabras) > 0:
                        cursor.execute("SELECT nombre, idProducto FROM Producto WHERE nombre LIKE %s LIMIT 10", (f"%{palabras[0]}%",))
                        por_palabra = cursor.fetchall()
                        print(f"🔍 Productos por primera palabra '{palabras[0]}': {por_palabra}")
                    
                    return jsonify({
                        "error": "product_not_found", 
                        "nombre_buscado": nombre,
                        "productos_similares": [p['nombre'] for p in similares]
                    }), 404
                else:
                    id_producto = prod['idProducto']
                    # si no te envían precio, usar el de la BD
                    if not precio:
                        precio = float(prod['precio'])
                    print(f"✅ Producto encontrado: ID={id_producto}, Precio={precio}")

            print(f"🔍 Debug - id_producto final: {id_producto}")
            
            if not id_producto:
                return jsonify({"error": "missing_product"}), 400

            # Verificar que el idProducto existe en la tabla Producto
            cursor.execute("SELECT idProducto, nombre, precio FROM Producto WHERE idProducto = %s", (id_producto,))
            producto_valido = cursor.fetchone()
            if not producto_valido:
                print(f"❌ Error: idProducto {id_producto} no existe en la tabla Producto")
                return jsonify({"error": "invalid_product_id", "id": id_producto}), 400

            print(f"✅ Producto válido confirmado: {producto_valido}")

            # 2) Obtener o crear carrito abierto
            id_carrito = get_or_create_open_cart(conn, usuario_id)
            print(f"🔍 Debug - id_carrito: {id_carrito}")

            # 3) Revisar si ya existe el producto en CarritoDetalle
            cursor.execute("SELECT idDetalle, cantidad FROM CarritoDetalle WHERE idCarrito=%s AND idProducto=%s LIMIT 1",
                           (id_carrito, id_producto))
            exist = cursor.fetchone()
            print(f"🔍 Debug - Producto existente en carrito: {exist}")
            
            if exist:
                # actualizar cantidad + subtotal
                nueva_cant = int(exist['cantidad']) + 1
                cursor.execute("UPDATE CarritoDetalle SET cantidad=%s, precioUnitario=%s WHERE idDetalle=%s",
                               (nueva_cant, precio, exist['idDetalle']))
                print(f"✅ Actualizada cantidad a {nueva_cant}")
            else:
                # insertar nuevo detalle; si precio 0 intenta tomar precio desde Producto
                if not precio or precio == 0:
                    precio = float(producto_valido['precio'])
                
                print(f"🔍 Debug - Insertando: idCarrito={id_carrito}, idProducto={id_producto}, cantidad=1, precio={precio}")
                cursor.execute("INSERT INTO CarritoDetalle (idCarrito, idProducto, cantidad, precioUnitario) VALUES (%s,%s,%s,%s)",
                               (id_carrito, id_producto, 1, precio))
                print("✅ Producto insertado en CarritoDetalle")

            conn.commit()

            # preparar respuesta: items + totals
            summary = get_cart_summary(conn, usuario_id)
            return jsonify({
                "mensaje": "Añadido al carrito",
                "cart_count": summary['count'],
                "total": summary['total'],
                "items": summary['items']
            }), 200

    except Exception as e:
        print("❌ Error agregar_carrito (BD):", e)
        print("❌ Tipo de error:", type(e).__name__)
        import traceback
        print("❌ Traceback completo:")
        traceback.print_exc()
        conn.rollback()
        return jsonify({"error": "db_error", "detail": str(e)}), 500
    finally:
        conn.close()


@app.route('/eliminar_carrito', methods=['POST'])
def eliminar_carrito():
    if not session.get('loggedin'):
        return jsonify({"error":"login_required"}), 403

    data = request.get_json() or request.form
    id_detalle = data.get('id') or data.get('idDetalle')

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM CarritoDetalle WHERE idDetalle = %s", (id_detalle,))
            conn.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        print("❌ Error eliminar_carrito:", e)
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        conn.close()

@app.route('/actualizar_cantidad', methods=['POST'])
def actualizar_cantidad():
    if not session.get('loggedin'):
        return jsonify({"error":"login_required"}), 403

    data = request.get_json() or request.form
    id_detalle = data.get('id')
    try:
        cantidad = int(data.get('cantidad') or 1)
    except:
        cantidad = 1

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            if cantidad <= 0:
                cursor.execute("DELETE FROM CarritoDetalle WHERE idDetalle = %s", (id_detalle,))
            else:
                cursor.execute("UPDATE CarritoDetalle SET cantidad = %s WHERE idDetalle = %s", (cantidad, id_detalle))
            conn.commit()

            # recalcular total para respuesta opcional
            # (puedes devolver nuevo total o recargar la página en el front)
        return jsonify({"success": True}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        conn.close()

@app.route('/pago')
def pago():
    # 🔹 Obtener conexión a la BD
    db = get_db_connection()
    if not db:
        return "Error al conectar con la base de datos", 500

    try:
        cursor = db.cursor()
        # Ejemplo: obtener productos del carrito (ajusta según tu tabla real)
        cursor.execute("SELECT * FROM datos_productos")  # ✅ vista creada en tu BD
        productos = cursor.fetchall()


        # Calcular total general si es necesario
        total_general = sum(Decimal(p['precio']) * p.get('cantidad', 1) for p in productos)

    finally:
        cursor.close()
        db.close()  # Cierra la conexión

    # 🔹 Renderizar el template y pasar datos
    return render_template("pago.html", carrito=productos, total_general=total_general)

@app.route("/pago_confirmado")
def pago_confirmado():
    metodo = request.args.get("metodo")
    direccion = request.args.get("direccion")
    # Puedes pasar estos datos al template si quieres mostrarlos
    return render_template("pago_confirmado.html", metodo=metodo, direccion=direccion)



@app.route('/api/cart', methods=['GET'])
def api_cart():
    ensure_cart()
    cart = session['cart']
    items = []
    total = 0.0
    for it in cart.values():
        subtotal = float(Decimal(str(it.get('precio', 0))) * int(it.get('cantidad', 1)))
        items.append({
            'id': it.get('id'),
            'nombre': it.get('nombre'),
            'precio': float(it.get('precio')),
            'cantidad': int(it.get('cantidad')),
            'subtotal': subtotal,
            'img': it.get('img', '')
        })
        total += subtotal
    return jsonify({'items': items, 'total': round(total,2), 'count': cart_count()}), 200

# Página del carrito (render)
@app.route('/carrito')
def carrito():
    if not session.get('loggedin'):
        flash('Debes iniciar sesión para ver tu carrito', 'error')
        return redirect(url_for('inicio_secion'))

    usuario_id = session.get('id')
    conn = get_db_connection()
    cart_items = []
    total_general = 0.0
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT cd.idDetalle AS id, cd.idProducto, p.nombre, cd.precioUnitario AS precio, cd.cantidad, cd.subtotal
                FROM Carrito c
                JOIN CarritoDetalle cd ON c.idCarrito = cd.idCarrito
                JOIN Producto p ON cd.idProducto = p.idProducto
                WHERE c.idUsuario = %s AND c.estado = 'abierto'
            """, (usuario_id,))
            rows = cursor.fetchall()
            for it in rows:
                cart_items.append({
                    "id": it.get('id'),
                    "idProducto": it.get('idProducto'),
                    "nombre": it.get('nombre'),
                    "precio": float(it.get('precio')),
                    "cantidad": int(it.get('cantidad')),
                    "total": float(it.get('subtotal'))
                })
                total_general += float(it.get('subtotal'))
    except Exception as e:
        print("❌ Error leyendo carrito:", e)
    finally:
        if conn:
            conn.close()

    return render_template('carrito.html',
                           carrito=cart_items,
                           total_general=total_general,
                           loggedin=loggedin(),
                           cart_count=sum([i['cantidad'] for i in cart_items]) if cart_items else 0,
                           nombre=session.get('nombre'))


# sincronizar carrito (front -> session)
@app.route("/sincronizar-carrito", methods=["POST"])
def sincronizar_carrito():
    data = request.get_json() or {}
    carrito = data.get("carrito", {})
    # recibir como lista o dict; normalizamos a dict por id
    normalized = {}
    if isinstance(carrito, list):
        for item in carrito:
            normalized[str(item.get('id'))] = {
                'id': str(item.get('id')),
                'nombre': item.get('nombre'),
                'precio': float(item.get('precio') or 0),
                'cantidad': int(item.get('cantidad') or 1),
                'img': item.get('img', '')
            }
    elif isinstance(carrito, dict):
        for k,v in carrito.items():
            normalized[str(k)] = v
    session['cart'] = normalized
    session.modified = True
    return jsonify({"ok": True, "cart_count": cart_count()}), 200

# ----------------------------------------------------------------------
# RUTAS PARA CARRITO FLOTANTE (API ENDPOINTS)
# ----------------------------------------------------------------------
@app.route('/obtener_carrito', methods=['GET'])
def obtener_carrito():
    """API endpoint para obtener productos del carrito para el carrito flotante"""
    print(f"🔍 obtener_carrito llamado - Usuario logueado: {session.get('loggedin')}")
    print(f"🔍 Usuario ID: {session.get('id')}")
    
    if not session.get('loggedin'):
        print("❌ Usuario no logueado")
        return jsonify({"error": "login_required", "productos": []}), 401

    usuario_id = session.get('id')
    conn = get_db_connection()
    
    if not conn:
        print("❌ Error de conexión a BD")
        return jsonify({"error": "db_error", "productos": []}), 500

    try:
        with conn.cursor() as cursor:
            print(f"🔍 Buscando carrito para usuario {usuario_id}")
            cursor.execute("""
                SELECT cd.idDetalle as id, cd.idProducto, p.nombre, cd.precioUnitario as precio, 
                       cd.cantidad, p.imagen, cd.subtotal
                FROM Carrito c
                JOIN CarritoDetalle cd ON c.idCarrito = cd.idCarrito
                JOIN Producto p ON cd.idProducto = p.idProducto
                WHERE c.idUsuario = %s AND c.estado = 'abierto'
                ORDER BY cd.idDetalle
            """, (usuario_id,))
            
            rows = cursor.fetchall()
            print(f"🔍 Productos encontrados en BD: {len(rows) if rows else 0}")
            
            productos = []
            
            for row in rows:
                producto = {
                    'id': row['id'],
                    'idProducto': row['idProducto'],
                    'nombre': row['nombre'],
                    'precio': float(row['precio']),
                    'cantidad': int(row['cantidad']),
                    'imagen': row['imagen'] or '/static/image/default-product.jpg',
                    'subtotal': float(row['subtotal'])
                }
                productos.append(producto)
                print(f"✅ Producto agregado: {producto['nombre']} x{producto['cantidad']}")
            
            result = {
                "productos": productos,
                "count": len(productos),
                "total": sum([p['subtotal'] for p in productos])
            }
            
            print(f"📊 Respuesta final: {result}")
            return jsonify(result), 200
            
    except Exception as e:
        print(f"❌ Error en obtener_carrito: {e}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        return jsonify({"error": "db_error", "productos": [], "detail": str(e)}), 500
    finally:
        conn.close()

@app.route('/actualizar_carrito', methods=['POST'])
def actualizar_carrito():
    """API endpoint para actualizar cantidad de producto en carrito flotante"""
    if not session.get('loggedin'):
        return jsonify({"error": "login_required"}), 401

    data = request.get_json() or {}
    producto_id = data.get('producto_id')
    cantidad = data.get('cantidad')
    
    if not producto_id or cantidad is None:
        return jsonify({"error": "missing_params"}), 400
    
    try:
        cantidad = int(cantidad)
        if cantidad < 0:
            return jsonify({"error": "invalid_quantity"}), 400
    except ValueError:
        return jsonify({"error": "invalid_quantity"}), 400

    usuario_id = session.get('id')
    conn = get_db_connection()
    
    if not conn:
        return jsonify({"error": "db_error"}), 500

    try:
        with conn.cursor() as cursor:
            # Obtener carrito del usuario
            id_carrito = get_or_create_open_cart(conn, usuario_id)
            
            # Buscar el detalle del carrito
            cursor.execute("""
                SELECT idDetalle FROM CarritoDetalle 
                WHERE idCarrito = %s AND idProducto = %s
            """, (id_carrito, producto_id))
            
            detalle = cursor.fetchone()
            if not detalle:
                return jsonify({"error": "product_not_in_cart"}), 404
            
            # Actualizar cantidad
            if cantidad == 0:
                cursor.execute("DELETE FROM CarritoDetalle WHERE idDetalle = %s", (detalle['idDetalle'],))
            else:
                # Obtener precio del producto
                cursor.execute("SELECT precio FROM Producto WHERE idProducto = %s", (producto_id,))
                producto = cursor.fetchone()
                precio = float(producto['precio'])
                
                cursor.execute("""
                    UPDATE CarritoDetalle 
                    SET cantidad = %s, precioUnitario = %s 
                    WHERE idDetalle = %s
                """, (cantidad, precio, detalle['idDetalle']))
            
            conn.commit()
            return jsonify({"success": True}), 200
            
    except Exception as e:
        print(f"❌ Error en actualizar_carrito: {e}")
        conn.rollback()
        return jsonify({"error": "db_error"}), 500
    finally:
        conn.close()

@app.route('/eliminar_del_carrito', methods=['POST'])
def eliminar_del_carrito():
    """API endpoint para eliminar producto del carrito flotante"""
    if not session.get('loggedin'):
        return jsonify({"error": "login_required"}), 401

    data = request.get_json() or {}
    producto_id = data.get('producto_id')
    
    if not producto_id:
        return jsonify({"error": "missing_params"}), 400

    usuario_id = session.get('id')
    conn = get_db_connection()
    
    if not conn:
        return jsonify({"error": "db_error"}), 500

    try:
        with conn.cursor() as cursor:
            # Obtener carrito del usuario
            id_carrito = get_or_create_open_cart(conn, usuario_id)
            
            # Eliminar producto del carrito
            cursor.execute("""
                DELETE FROM CarritoDetalle 
                WHERE idCarrito = %s AND idProducto = %s
            """, (id_carrito, producto_id))
            
            conn.commit()
            return jsonify({"success": True}), 200
            
    except Exception as e:
        print(f"❌ Error en eliminar_del_carrito: {e}")
        conn.rollback()
        return jsonify({"error": "db_error"}), 500
    finally:
        conn.close()

@app.route('/limpiar_carrito', methods=['POST'])
def limpiar_carrito():
    """API endpoint para limpiar todo el carrito flotante"""
    if not session.get('loggedin'):
        return jsonify({"error": "login_required"}), 401

    usuario_id = session.get('id')
    conn = get_db_connection()
    
    if not conn:
        return jsonify({"error": "db_error"}), 500

    try:
        with conn.cursor() as cursor:
            # Obtener carrito del usuario
            id_carrito = get_or_create_open_cart(conn, usuario_id)
            
            # Eliminar todos los productos del carrito
            cursor.execute("DELETE FROM CarritoDetalle WHERE idCarrito = %s", (id_carrito,))
            
            conn.commit()
            return jsonify({"success": True}), 200
            
    except Exception as e:
        print(f"❌ Error en limpiar_carrito: {e}")
        conn.rollback()
        return jsonify({"error": "db_error"}), 500
    finally:
        conn.close()

@app.route('/agregar_al_carrito', methods=['POST'])
def agregar_al_carrito():
    """API endpoint alternativo para el carrito flotante (compatible con función existente)"""
    return agregar_carrito()  # Reutilizar la función existente

@app.route('/debug_carrito', methods=['GET'])
def debug_carrito():
    """Endpoint de debugging para verificar el estado del carrito"""
    if not session.get('loggedin'):
        return jsonify({"error": "No logueado", "session": dict(session)}), 401
    
    usuario_id = session.get('id')
    conn = get_db_connection()
    
    if not conn:
        return jsonify({"error": "No se pudo conectar a la BD"}), 500
    
    try:
        with conn.cursor() as cursor:
            # Obtener carritos del usuario
            cursor.execute("SELECT * FROM Carrito WHERE idUsuario = %s", (usuario_id,))
            carritos = cursor.fetchall()
            
            # Obtener detalles de carrito abierto
            cursor.execute("""
                SELECT c.*, cd.*, p.nombre as producto_nombre 
                FROM Carrito c
                LEFT JOIN CarritoDetalle cd ON c.idCarrito = cd.idCarrito
                LEFT JOIN Producto p ON cd.idProducto = p.idProducto
                WHERE c.idUsuario = %s AND c.estado = 'abierto'
            """, (usuario_id,))
            detalles = cursor.fetchall()
            
            return jsonify({
                "usuario_id": usuario_id,
                "session": dict(session),
                "carritos": carritos,
                "detalles": detalles,
                "timestamp": str(datetime.now())
            }), 200
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# Fin rutas carrito flotante

@app.route("/cart_count", methods=["GET"])
def get_cart_count():
    if loggedin():
        # Para usuarios logueados, obtener del carrito de BD
        usuario_id = session.get('id')
        if usuario_id:
            conn = get_db_connection()
            if conn:
                try:
                    summary = get_cart_summary(conn, usuario_id)
                    return jsonify({"count": summary['count']}), 200
                except Exception as e:
                    print(f"Error obteniendo carrito BD: {e}")
                finally:
                    conn.close()
    
    # Fallback a carrito de sesión
    return jsonify({"count": cart_count()}), 200

@app.route("/cart_remove", methods=["POST"])
def cart_remove():
    data = request.get_json() or request.form
    product_name = data.get("nombre")
    ensure_cart()
    if product_name:
        session["cart"] = {k:v for k,v in session['cart'].items() if v.get("nombre") != product_name}
        session.modified = True
    return jsonify({"success": True})

@app.route("/fix-cart")
def fix_cart():
    session["cart"] = {}
    session.modified = True
    return "Carrito limpiado"

# ----------------------------------------------------------------------
# RUTAS DE PAGO / CONFIRMACIÓN
# ----------------------------------------------------------------------
@app.route('/confirmacion_pago', methods=['GET','POST'])
def confirmacion_pago():
    # GET: mostrar QR y datos
    if request.method == 'GET':
        ensure_cart()
        if not session.get('cart'):
            flash('Tu carrito está vacío.', 'error')
            return redirect(url_for('cartas'))
        return render_template('confirmacion_pago.html', total=cart_total(), cart=session['cart'], cart_count=cart_count(), loggedin=loggedin())

    # POST: recibir confirmación simulada desde el front (cuando pago real llegue)
    data = request.get_json() or request.form
    confirmed = data.get('confirm') in ['1','true', True, 'true']
    direccion = data.get('direccion', '')

    if not confirmed:
        return jsonify({"success": False, "message": "Pago no confirmado"}), 400

    # Guardar pedido en DB
    conn = get_db_connection()
    order_id = None
    try:
        with conn.cursor() as cursor:
            detalle = json.dumps(list(session.get('cart', {}).values()), ensure_ascii=False)
            sql = "INSERT INTO Pedidos (nombre_cliente, telefono, direccion, detalle_pedido) VALUES (%s, %s, %s, %s)"
            nombre_cliente = session.get('nombre') or data.get('nombre') or 'Cliente Delivery'
            telefono = data.get('telefono', '')
            cursor.execute(sql, (nombre_cliente, telefono, direccion, detalle))
            conn.commit()
            order_id = cursor.lastrowid
    except Exception as e:
        print("❌ Error al guardar pedido en confirmacion:", e)
        if conn:
            conn.rollback()
        return jsonify({"success": False, "message": "Error al guardar pedido"}), 500
    finally:
        if conn:
            conn.close()

    # vaciar carrito
    session['cart'] = {}
    session.modified = True

    return jsonify({"success": True, "order_id": order_id})

# Seguimiento
@app.route('/seguimiento')
def seguimiento():
    order_id = request.args.get('order_id')
    estado = "En preparación" if order_id else "Pedido no encontrado"
    return render_template('seguimiento.html', order_id=order_id, estado=estado, cart_count=cart_count(), loggedin=loggedin())


@app.route('/procesar_pago', methods=['POST'])
def procesar_pago():
    direccion = request.form['direccion']
    metodo = request.form['idMetodoPago']
    usuario_id = session['id_usuario']  # ya logueado

    cursor = db.cursor()

    cursor.execute("""
        INSERT INTO Pedido (idUsuario, direccion, idMetodoPago, total, estado)
        VALUES (%s, %s, %s, 0, 'Pendiente')
    """, (usuario_id, direccion, metodo))

    db.commit()

    return redirect(url_for('confirmacion'))

# ----------------------------------------------------------------------
# RUTA DELIVERY (tu formulario)
# ----------------------------------------------------------------------
@app.route('/delivery', methods=['GET', 'POST'])
def delivery():
    logged = loggedin()
    nombre = session.get('nombre') if logged else None

    if request.method == 'POST':
        nombre_cliente = request.form.get('nombre')
        telefono = request.form.get('telefono')
        direccion = request.form.get('direccion')
        pedido = request.form.get('pedido')

        conn = get_db_connection()
        if conn is None:
            flash('Error al conectar con la base de datos.', 'error')
            return render_template('delivery.html', loggedin=logged, nombre=nombre)

        try:
            with conn.cursor() as cursor:
                sql = """
                INSERT INTO Pedidos (nombre_cliente, telefono, direccion, detalle_pedido)
                VALUES (%s, %s, %s, %s)
                """
                cursor.execute(sql, (nombre_cliente, telefono, direccion, pedido))
                conn.commit()
                flash('✅ Pedido enviado con éxito. Te llamaremos pronto.', 'success')
        except Exception as e:
            print(f"❌ Error al guardar pedido: {e}")
            conn.rollback()
            flash('❌ Error interno al procesar tu pedido.', 'error')
        finally:
            conn.close()

    return render_template('delivery.html', loggedin=logged, nombre=nombre)



# ----------------------------------------------------------------------
# RUTA DE RESERVAS
# ----------------------------------------------------------------------
@app.route('/reserva', methods=['GET', 'POST'])
def reserva():
    logged = loggedin()
    nombre_usuario = session.get('nombre')
    message = None

    if request.method == 'POST':
        nombre = request.form.get('nombre')
        celular = request.form.get('celular')
        fecha = request.form.get('fecha')
        hora = request.form.get('hora')
        cantidad_personas = request.form.get('cantidad_personas')
        mensaje = request.form.get('mensaje')
        usuario_id = session.get('id', None)

        conn = get_db_connection()
        if conn is None:
            message = 'Error de conexión a la base de datos. Inténtalo más tarde.'
        else:
            try:
                with conn.cursor() as cursor:
                    sql = """
                    INSERT INTO Reservas (fecha, hora, nombre, celular, cantidad_personas, mensaje, usuario_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """
                    cursor.execute(sql, (fecha, hora, nombre, celular, cantidad_personas, mensaje, usuario_id))
                    conn.commit()
                    return redirect(url_for('reserva_confirmada', 
                                            nombre=nombre,
                                            fecha=fecha,
                                            hora=hora,
                                            cantidad_personas=cantidad_personas,
                                            mensaje=mensaje))
            except Exception as e:
                print(f"❌ Error al registrar la reserva: {e}")
                message = '❌ Error interno al procesar la reserva.'
            finally:
                conn.close()

    return render_template('reservadf.html',
                           message=message,
                           loggedin=logged,
                           nombre=nombre_usuario)

@app.route('/reserva_confirmada')
def reserva_confirmada():
    nombre = request.args.get('nombre')
    fecha = request.args.get('fecha')
    hora = request.args.get('hora')
    cantidad_personas = request.args.get('cantidad_personas')
    mensaje = request.args.get('mensaje')

    return render_template('reserva_confirmada.html',
                           nombre=nombre,
                           fecha=fecha,
                           hora=hora,
                           cantidad_personas=cantidad_personas,
                           mensaje=mensaje)

# ----------------------------------------------------------------------
# FORMULARIO DE SUSCRIPCIÓN
# ----------------------------------------------------------------------
@app.route('/formulario', methods=['GET', 'POST'])
def formulario():
    if request.method == 'POST':
        conn = get_db_connection()
        if conn is None:
            return "Error de conexión a la base de datos."

        try:
            nombre = request.form['nombre']
            apellidos = request.form['apellidos']
            dni = request.form['dni']
            correo = request.form['correo']
            telefono = request.form['telefono']

            with conn.cursor() as cursor:
                sql = """
                INSERT INTO Suscriptores (nombre, apellidos, dni, correo, telefono)
                VALUES (%s, %s, %s, %s, %s)
                """
                cursor.execute(sql, (nombre, apellidos, dni, correo, telefono))
                conn.commit()

            return redirect(url_for('registro', message='¡Suscripción exitosa! Crea tu cuenta para acceder a la experiencia completa.'))

        except Exception as e:
            print("❌ Error al guardar los datos:", e)
            return "Error al guardar en la base de datos."
        finally:
            conn.close()

    return render_template('formulario.html',
                           loggedin=session.get('loggedin', False),
                           nombre=session.get('nombre'))

def get_productos_categoria(categoria):
    conn = get_db_connection()
    if not conn:
        return []

    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT idProducto, nombre, descripcion, precio, categoria
                FROM Producto
                WHERE categoria = %s
            """, (categoria,))
            return cursor.fetchall()
    except Exception as e:
        print("❌ Error leyendo productos:", e)
        return []
    finally:
        conn.close()

@app.route('/carta_completa')
def carta_completa():
    return render_template(
        "carta_completa.html",
        pollo=get_productos_categoria("pollos"),
        pizza=get_productos_categoria("pizzas"),
        pasta=get_productos_categoria("pastas"),
        bebidas=get_productos_categoria("bebidas"),
        entradas=get_productos_categoria("entradas"),
        ensaladas=get_productos_categoria("ensaladas"),
        loggedin=loggedin(),
        nombre=session.get("nombre")
    )


# ----------------------------------------------------------------------
# TEST DE CONEXIÓN A BD
# ----------------------------------------------------------------------
@app.route('/test-db')
def test_db():
    conn = get_db_connection()
    if conn is None:
        return "❌ Error al conectar con la base: Revisa los logs."
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) AS total FROM Usuarios;")
            resultado = cursor.fetchone()
        return f"✅ Conexión exitosa. Usuarios registrados: {resultado['total']}"
    except Exception as e:
        return f"❌ Error al consultar la base: {e}"
    finally:
        conn.close()



# ----------------------------------------------------------------------
# EJECUTAR SERVIDOR
# ----------------------------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
