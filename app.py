# app.py (ACTUALIZADO) - integra carrito en session + conexión MySQL + auth y demás rutas
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import pymysql
import json
from decimal import Decimal

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
    # acepta JSON {id, nombre, precio, qty?}
    if not loggedin():
        # permitir agregar sin login también si prefieres; por ahora obligatorio
        return jsonify({"error": "login_required"}), 403

    data = request.get_json() or request.form
    prod_id = str(data.get('id'))
    nombre = data.get('nombre') or data.get('name') or data.get('nombre_producto')
    precio = float(data.get('precio') or data.get('price') or 0)
    qty = int(data.get('qty') or data.get('cantidad') or 1)
    img = data.get('imagen') or data.get('img') or ''

    ensure_cart()
    cart = session['cart']

    if prod_id in cart:
        cart[prod_id]['cantidad'] = int(cart[prod_id].get('cantidad', 1)) + qty
    else:
        cart[prod_id] = {
            'id': prod_id,
            'nombre': nombre,
            'precio': precio,
            'cantidad': qty,
            'img': img
        }

    session['cart'] = cart
    session.modified = True

    # preparar items list para respuesta
    items = list(cart.values())
    cantidad_total = cart_count()
    total = cart_total()

    return jsonify({"cantidad": cantidad_total, "items": items, "total": total})


@app.route('/eliminar_carrito', methods=['POST'])
def eliminar_carrito():
    data = request.get_json() or request.form
    prod_id = str(data.get('id'))
    ensure_cart()
    cart = session['cart']
    if prod_id in cart:
        cart.pop(prod_id)
    session['cart'] = cart
    session.modified = True
    return jsonify({"success": True, "cart_count": cart_count(), "total": cart_total()}), 200


@app.route('/actualizar_cantidad', methods=['POST'])
def actualizar_cantidad():
    data = request.get_json() or request.form
    prod_id = str(data.get('id'))
    cantidad = int(data.get('cantidad') or data.get('qty') or 1)
    ensure_cart()
    cart = session['cart']
    if prod_id in cart:
        if cantidad <= 0:
            cart.pop(prod_id)
        else:
            cart[prod_id]['cantidad'] = cantidad
    session['cart'] = cart
    session.modified = True
    return jsonify({"success": True, "cart_count": cart_count(), "total": cart_total()}), 200


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
    ensure_cart()
    # convertir a lista para template
    cart_items = []
    for it in session['cart'].values():
        subtotal = float(Decimal(str(it.get('precio', 0))) * int(it.get('cantidad', 1)))
        cart_items.append({
            'id': it.get('id'),
            'nombre': it.get('nombre'),
            'precio': it.get('precio'),
            'cantidad': it.get('cantidad'),
            'total': subtotal
        })
    return render_template('carrito.html',
                           carrito=cart_items,
                           total_general=cart_total(),
                           loggedin=loggedin(),
                           cart_count=cart_count(),
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
