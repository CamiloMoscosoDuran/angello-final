-- ================================================================
-- 2. BASE DE DATOS DBANGELLO
-- ================================================================
CREATE DATABASE IF NOT EXISTS dbangello
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;

USE dbangello;

-- ================================================================
-- 3. TABLAS MAESTRAS
-- ================================================================

-- USUARIOS (LOGIN) - TABLA ORIGINAL SIN CAMBIOS
CREATE TABLE Usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena_hash VARCHAR(255) NOT NULL,
    fecha_registro DATE DEFAULT (CURRENT_DATE())
);

-- NUEVA TABLA: ADMINISTRADORES (SOLO PERSONAL AUTORIZADO)
CREATE TABLE Administradores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(100) NOT NULL,
    rol VARCHAR(20) DEFAULT 'admin' CHECK (rol IN ('admin', 'encargado')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

-- REGISTRO DETALLADO DEL CLIENTE (FORMULARIO)
CREATE TABLE Registro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(120) NOT NULL,
    usuario VARCHAR(100) NOT NULL UNIQUE,
    dni CHAR(8) NOT NULL UNIQUE,
    correo VARCHAR(120) NOT NULL UNIQUE,
    telefono CHAR(9),
    fecha_registro DATE DEFAULT (CURRENT_DATE()),
    CONSTRAINT chk_dni CHECK (dni REGEXP '^[0-9]{8}$'),
    CONSTRAINT chk_telefono CHECK (telefono IS NULL OR telefono REGEXP '^[0-9]{9}$'),
    CONSTRAINT chk_correo CHECK (correo REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_usuario CHECK (LENGTH(usuario) >= 3)
);

-- PRODUCTOS DEL MENÚ
CREATE TABLE Producto (
    idProducto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    precio DECIMAL(10,2) NOT NULL CHECK (precio > 0),
    categoria VARCHAR(50) NOT NULL
);

-- MESAS DEL RESTAURANTE
CREATE TABLE Mesa (
    idMesa INT AUTO_INCREMENT PRIMARY KEY,
    numeroMesa INT NOT NULL UNIQUE,
    capacidad INT NOT NULL CHECK (capacidad > 0)
);

-- MÉTODOS DE PAGO
CREATE TABLE MetodoPago (
    idMetodoPago INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Promociones (
    idPromocion INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    descripcion TEXT,
    precioFinal DECIMAL(10,2) NOT NULL CHECK (precioFinal > 0),
    categoria VARCHAR(50) NOT NULL,
    fechaInicio DATE DEFAULT (CURRENT_DATE()),
    fechaFin DATE,
    activo BOOLEAN DEFAULT TRUE,
    CONSTRAINT chk_fechas CHECK (fechaFin IS NULL OR fechaFin >= fechaInicio)
    );
    
    -- ================================================================
-- 6. TABLAS DE FEEDBACK (COMENTARIOS Y RECLAMACIONES)
-- ================================================================

-- TABLA PARA COMENTARIOS (Visibles para todos, creados solo por logueados)
CREATE TABLE Comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Nombre del usuario que comenta (lo tomamos de la sesión o tabla Usuarios)
    usuario_nombre VARCHAR(100) NOT NULL, 
    texto TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA PARA RECLAMACIONES (Privadas, asociadas a un Usuario logueado)
CREATE TABLE Reclamaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- FK al ID del usuario de la tabla Usuarios
    usuario_id INT NOT NULL,
    texto TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- ON DELETE CASCADE: Si se borra el usuario, se borran sus reclamos (o SET NULL si quieres conservarlos)
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ================================================================
-- 4. TABLAS TRANSACCIONALES
-- ================================================================

-- RESERVAS
CREATE TABLE Reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    celular CHAR(9) NOT NULL CHECK (celular REGEXP '^[0-9]{9}$'),
    cantidad_personas INT NOT NULL CHECK (cantidad_personas > 0),
    mensaje TEXT,
    usuario_id INT,
    idMesa INT,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (idMesa) REFERENCES Mesa(idMesa) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT uk_reserva_unica UNIQUE (usuario_id, idMesa, fecha, hora)
);

-- PEDIDOS (DELIVERY)
CREATE TABLE Pedido (
    idPedido INT AUTO_INCREMENT PRIMARY KEY,
    idUsuario INT NOT NULL,
    direccion VARCHAR(200) NOT NULL,
    fechaPedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    idMetodoPago INT NOT NULL,
    total DECIMAL(10,2) CHECK (total > 0),
    estado VARCHAR(20) DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente','Pagado','Entregado')),
    FOREIGN KEY (idUsuario) REFERENCES Usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (idMetodoPago) REFERENCES MetodoPago(idMetodoPago) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- DETALLE DEL PEDIDO
CREATE TABLE PedidoDetalle (
    idDetalle INT AUTO_INCREMENT PRIMARY KEY,
    idPedido INT NOT NULL,
    idProducto INT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precioUnitario DECIMAL(10,2) NOT NULL CHECK (precioUnitario > 0),
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precioUnitario) STORED,
    FOREIGN KEY (idPedido) REFERENCES Pedido(idPedido) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (idProducto) REFERENCES Producto(idProducto) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- TABLAS DE CARRITO TEMPORAL
CREATE TABLE Carrito (
    idCarrito INT AUTO_INCREMENT PRIMARY KEY,
    idUsuario INT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('abierto','confirmado','cancelado') DEFAULT 'abierto',
    FOREIGN KEY (idUsuario) REFERENCES Usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- DETALLES DEL CARRITO
CREATE TABLE CarritoDetalle (
    idDetalle INT AUTO_INCREMENT PRIMARY KEY,
    idCarrito INT NOT NULL,
    idProducto INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precioUnitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precioUnitario) STORED,
    CONSTRAINT uk_carrito_producto UNIQUE (idCarrito, idProducto),
    FOREIGN KEY (idCarrito) REFERENCES Carrito(idCarrito) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (idProducto) REFERENCES Producto(idProducto) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE PromocionDetalle (
    idDetalle INT AUTO_INCREMENT PRIMARY KEY,
    idPromocion INT NOT NULL,
    idProducto INT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0) DEFAULT 1,
    FOREIGN KEY (idPromocion) REFERENCES Promociones(idPromocion) ON DELETE CASCADE ON UPDATE CASCADE,
    -- Aquí se relaciona con la tabla Producto
    FOREIGN KEY (idProducto) REFERENCES Producto(idProducto) ON DELETE RESTRICT ON UPDATE CASCADE,
    -- Restringe que un mismo producto no se añada varias veces a la misma promoción
    CONSTRAINT uk_promocion_producto UNIQUE (idPromocion, idProducto)
);

-- ================================================================
-- 5. INSERTS - DATOS MAESTROS
-- ================================================================

-- MÉTODOS DE PAGO
INSERT INTO MetodoPago(nombre) VALUES
('Yape'), ('Efectivo'), ('Plin'), ('Tarjeta Visa'), ('Tarjeta Mastercard'),
('BBVA'), ('BCP'), ('Interbank'), ('Scotiabank'), ('Paypal');

-- MESAS (10 registros)
INSERT INTO Mesa(numeroMesa, capacidad) VALUES
(1,2),(2,2),(3,4),(4,4),(5,6),
(6,6),(7,2),(8,4),(9,8),(10,6);

-- PRODUCTOS (89 registros)
INSERT INTO Producto (nombre, descripcion, categoria, precio) VALUES
-- POLLOS (IDs 1-4)
('1/4 Pollo a la Leña', '+ Papas fritas y ensalada. Jugoso y dorado, acompañado con papas fritas y ensalada fresca.', 'pollos', 20.00),
('1/2 Pollo a la Leña', '+ Papas fritas y ensalada. Delicioso pollo a la leña con el sabor ahumado único.', 'pollos', 40.00),
('1 Pollo a la Leña', '+ Papas fritas y ensalada. Pollo entero a la leña, perfecto para compartir.', 'pollos', 75.00),
('Promo Familiar', '1 Pollo + Papas Fritas + Ensalada + Arroz + Camote + Gaseosa 1.5L.', 'pollos', 100.00),

-- PIZZAS (IDs 5-10)
('Pizza Margarita', 'Clásica pizza con mozzarella, tomate cherry y queso mozzarella.', 'pizzas', 24.00),
('Pizza Vegetariana', 'Berenjena, zapallo, tomate cherry, aceitunas, tocino, champiñones, pimiento, queso mozzarella.', 'pizzas', 25.00),
('Pizza Americana', 'Salsa de tomate, jamón y queso mozzarella.', 'pizzas', 25.00),
('Pizza Hawaiana', 'Jamón, queso mozzarella y piña.', 'pizzas', 26.00),
('Pizza Pepperoni', 'Pepperoni y queso mozzarella.', 'pizzas', 30.00),
('Pizza Angello', 'Jamón, aceitunas, tocino, salame, cabanossi, pimiento, queso mozzarella.', 'pizzas', 30.00),

-- EXTRAS PIZZA (IDs 11-18)
('Extra Pimiento', 'Adición para pizza.', 'extras_pizza', 2.00),
('Extra Champiñones', 'Adición para pizza.', 'extras_pizza', 3.00),
('Extra Aceitunas', 'Adición para pizza.', 'extras_pizza', 3.00),
('Extra Jamón', 'Adición para pizza.', 'extras_pizza', 4.00),
('Extra Tocino', 'Adición para pizza.', 'extras_pizza', 4.00),
('Extra Cabanossi', 'Adición para pizza.', 'extras_pizza', 4.00),
('Extra Salame', 'Adición para pizza.', 'extras_pizza', 4.00),
('Extra Pepperoni', 'Adición para pizza.', 'extras_pizza', 5.00),

-- PASTAS (IDs 19-25)
('Ravioles Jamón/Queso', 'Rellenos de jamón y queso en salsa de champiñones y tocino.', 'pastas', 25.00),
('Ravioles Carne', 'Rellenos de carne en salsa de champiñones y tocino.', 'pastas', 25.00),
('Lasagna', 'Carne en salsa blanca, jamón, pimiento, champiñones y mozzarella.', 'pastas', 30.00),
('Pesto', 'Pasta con salsa pesto de albahaca y parmesano.', 'pastas', 23.00),
('Boloñesa', 'Pasta con salsa de carne y tomate.', 'pastas', 24.00),
('Alfredo', 'Pasta en salsa cremosa de parmesano y mantequilla.', 'pastas', 24.00),
('1/4 de Pollo (Agregado)', 'Agregado para pastas.', 'pastas_extras', 12.00),

-- EXTRAS GENERALES (IDs 26-30)
('Porción de Papas', 'Papas fritas.', 'extras', 7.00),
('Porción de Papas Grande', 'Papas fritas grandes.', 'extras', 13.00),
('Porción de Camote', 'Camote frito.', 'extras', 7.00),
('Porción de Camote Grande', 'Camote frito grande.', 'extras', 13.00),
('Porción de Arroz', 'Arroz blanco.', 'extras', 8.00),

-- BEBIDAS (IDs 31-48)
('Refresco del Día 1/2 LT', 'Jugos naturales: papaya, piña o fresa.', 'bebidas', 5.00),
('Refresco del Día 1 LT', 'Jugos naturales.', 'bebidas', 10.00),
('Refresco del Día 1.5 LT', 'Jugos naturales.', 'bebidas', 15.00),
('Gaseosa Personal', 'Bebida personal.', 'bebidas', 3.50),
('Gaseosa 1/2 LT', 'Bebida 1/2 litro.', 'bebidas', 5.00),
('Gaseosa Gordita', 'Bebida tamaño gordita.', 'bebidas', 7.00),
('Gaseosa 1 LT', 'Bebida 1 litro.', 'bebidas', 10.00),
('Gaseosa 1.5 LT', 'Bebida 1.5 litros.', 'bebidas', 13.00),
('Limonada Frozen', 'Limonada con hielo frappé.', 'bebidas', 18.00),
('Maracuyá Frozen', 'Maracuyá con hielo frappé.', 'bebidas', 18.00),
('Agua Natural', 'Agua natural embotellada.', 'bebidas', 3.50),
('Agua con Gas', 'Agua gasificada.', 'bebidas', 4.50),
('Infusión Manzanilla', 'Té de manzanilla.', 'bebidas', 4.00),
('Infusión Hierba Luisa/Anís', 'Hierbas naturales.', 'bebidas', 4.00),
('Café Solo', 'Café recién preparado.', 'bebidas', 5.00),
('Café con Leche', 'Café con leche.', 'bebidas', 7.00),
('Leche con Milo', 'Bebida achocolatada.', 'bebidas', 8.00),
('Infusión de Naranja', 'Naranja, té, limón, hierba buena.', 'bebidas', 15.00),

-- BARRAS (IDs 49-67)
('Pilsen', 'Cerveza rubia.', 'barras', 10.00),
('Cuzqueña', 'Cerveza premium.', 'barras', 12.00),
('Corona', 'Cerveza clara.', 'barras', 15.00),
('Stella Artois', 'Cerveza belga.', 'barras', 15.00),
('Artesanal', 'Cerveza artesanal.', 'barras', 16.00),
('Pisco Sour', 'Cóctel peruano.', 'barras', 20.00),
('Daiquiri de Piña', 'Cóctel de ron y piña.', 'barras', 20.00),
('Mojito', 'Cóctel cubano.', 'barras', 18.00),
('Chilcano de Limón', 'Pisco, limón, ginger ale.', 'barras', 18.00),
('Chilcano de Maracuyá', 'Pisco, maracuyá, ginger ale.', 'barras', 18.00),
('Cuba Libre', 'Ron y cola.', 'barras', 18.00),
('Baileys', 'Licor crema.', 'barras', 18.00),
('Algarrobina', 'Pisco y algarrobina.', 'barras', 16.00),
('Tinto de Verano', 'Vino y soda.', 'barras', 20.00),
('Aperol Spritz', 'Cóctel italiano.', 'barras', 20.00),
('Gin Tonic', 'Ginebra y tónica.', 'barras', 22.00),
('Negroni', 'Ginebra, vermut y Campari.', 'barras', 22.00),
('Sangría', 'Jarra de sangría.', 'barras', 35.00),
('Calientito', 'Té, hierbas y licor.', 'barras', 18.00),

-- VINOS (IDs 68-82)
('Buenos Aires Malbec', 'Vino argentino.', 'vinos', 45.00),
('Finca Las Moras Especial', 'Vino argentino especial.', 'vinos', 80.00),
('Finca Las Moras Malbec', 'Vino argentino.', 'vinos', 40.00),
('El Enemigo Malbec', 'Vino premium argentino.', 'vinos', 99.00),
('El Enemigo Chardonnay', 'Vino blanco premium.', 'vinos', 95.00),
('Tabernero Vittoria Malbec', 'Vino peruano.', 'vinos', 80.00),
('Tabernero Rosé Selección', 'Vino rosado.', 'vinos', 30.00),
('Finca Rotondo Blanco', 'Vino uruguayo.', 'vinos', 45.00),
('Finca Rotondo Reserva Malbec', 'Vino uruguayo.', 'vinos', 54.00),
('Tacama Las Tablas', 'Gran tinto.', 'vinos', 30.00),
('Tacama Selección Especial', 'Vino malbec.', 'vinos', 40.00),
('Tacama Don Manuel', 'Vino premium.', 'vinos', 90.00),
('Intipalka Chardonnay', 'Vino peruano blanco.', 'vinos', 40.00),
('Intipalka Malbec', 'Vino peruano.', 'vinos', 35.00),
('Intipalka Rosé', 'Vino rosado.', 'vinos', 35.00),

-- ENTRADAS (IDs 83-86)
('Pan al Ajo', 'Pan tostado con mantequilla de ajo.', 'entradas', 8.00),
('Pan al Ajo Especial', 'Pan con mantequilla de ajo y queso.', 'entradas', 12.00),
('Mac and Cheese', 'Pasta con queso gratinado.', 'entradas', 15.00),
('Tabla de Quesos', 'Selección de quesos y embutidos.', 'entradas', 22.00),

-- ENSALADAS (IDs 87-89)
('Ensalada César', 'Lechuga, pollo, crutones, aliño césar.', 'ensaladas', 20.00),
('Ensalada de Fideos', 'Lechuga, pasta tornillo, pollo, queso.', 'ensaladas', 20.00),
('Ensalada de Atún', 'Lechuga, atún, aceitunas, queso parmesano.', 'ensaladas', 20.00);

-- ================================================================
-- 5.1 INSERTS - USUARIOS (TABLA ORIGINAL)
-- ================================================================

-- USUARIOS CLIENTES (IDs 1-10) - FORMATO ORIGINAL
INSERT INTO Usuarios(nombre, correo, contrasena_hash) VALUES
('Juan Pérez','juan.p@ejemplo.com','pbkdf2:sha256:600000$salt1$hashedpassword1'),
('Ana López','ana.l@ejemplo.com','pbkdf2:sha256:600000$salt2$hashedpassword2'),
('Luis Ramos','luis.r@ejemplo.com','pbkdf2:sha256:600000$salt3$hashedpassword3'),
('Pedro Castro','pedro.c@ejemplo.com','pbkdf2:sha256:600000$salt4$hashedpassword4'),
('Marco Vega','marco.v@ejemplo.com','pbkdf2:sha256:600000$salt5$hashedpassword5'),
('Sofía Torres','sofia.t@ejemplo.com','pbkdf2:sha256:600000$salt6$hashedpassword6'),
('Javier Ruiz','javier.r@ejemplo.com','pbkdf2:sha256:600000$salt7$hashedpassword7'),
('Gabriela Salas','gabriela.s@ejemplo.com','pbkdf2:sha256:600000$salt8$hashedpassword8'),
('Ricardo Díaz','ricardo.d@ejemplo.com','pbkdf2:sha256:600000$salt9$hashedpassword9'),
('Elena Flores','elena.f@ejemplo.com','pbkdf2:sha256:600000$salt10$hashedpassword10');

-- ================================================================
-- 5.2 INSERTS - ADMINISTRADORES (NUEVA TABLA)
-- ================================================================
-- ADMINISTRADORES AUTORIZADOS
INSERT INTO Administradores (nombre, correo, contrasena, rol) VALUES 
('camilo', 'camilo@angello.com', 'CamiloTech', 'admin'),
('Joseph', 'levano@angello.com', 'caro1234', 'admin'),
('Encargado Restaurante', 'encargado@angello.com', 'encargado123', 'encargado'),
('Jefe de Local', 'jefe@angello.com', 'jefe123', 'admin'),
('Gerente General', 'gerente@angello.com', 'gerente123', 'admin'),
('Angello', 'Angellotrattotia@gmail.com', 'Angello', 'admin'),
('Supervisor Turno', 'supervisor@angello.com', 'super123', 'encargado');

-- ================================================================
-- 5.3 INSERTS - REGISTRO DETALLADO (IDs 1-10)
-- ================================================================

INSERT INTO Registro (nombre, apellidos, usuario, dni, correo, telefono) VALUES
('Juan', 'Pérez Gómez', 'juanpg', '10293847', 'juan.p@ejemplo.com', '987654321'),
('Ana', 'López Ramos', 'analo', '11304958', 'ana.l@ejemplo.com', '975123456'),
('Luis', 'Ramos Díaz', 'luisrd', '12415069', 'luis.r@ejemplo.com', '992345678'),
('Pedro', 'Castro Vega', 'pedrovega', '13526170', 'pedro.c@ejemplo.com', '987567890'),
('Marco', 'Vega Torres', 'marcvt', '14637281', 'marco.v@ejemplo.com', '963258741'),
('Sofía', 'Torres Núñez', 'sofiT', '15748392', 'sofia.t@ejemplo.com', '933445566'),
('Javier', 'Ruiz Mendiola', 'javiR', '16859403', 'javier.r@ejemplo.com', '911223344'),
('Gabriela', 'Salas Vera', 'gabriSV', '17960514', 'gabriela.s@ejemplo.com', '955667788'),
('Ricardo', 'Díaz Polo', 'ricardDP', '18071625', 'ricardo.d@ejemplo.com', '922889900'),
('Elena', 'Flores Soria', 'eleFS', '19182736', 'elena.f@ejemplo.com', '944778899');

-- ================================================================
-- 6. INSERTS - DATOS TRANSACCIONALES (10 REGISTROS C/U)
-- ================================================================

-- RESERVAS (IDs 1-10)
INSERT INTO Reservas(fecha,hora,nombre,celular,cantidad_personas,mensaje,usuario_id,idMesa) VALUES
('2025-11-26','19:00','Juan Pérez','987654321',2,'Mesa cerca a ventana',1,1),
('2025-11-27','20:00','Ana López','975123456',2,'Cumpleaños',2,2),
('2025-11-28','18:30','Luis Ramos','992345678',4,'',3,3),
('2025-11-29','21:00','Pedro Castro','987567890',4,'Sin picante',4,4),
('2025-11-30','19:45','Marco Vega','963258741',6,'Silla para bebé',5,5),
('2025-12-01','20:30','Sofía Torres','933445566',4,'',6,6),
('2025-12-01','19:15','Javier Ruiz','911223344',2,'Mesa tranquila',7,7),
('2025-12-02','18:00','Gabriela Salas','955667788',4,'',8,8),
('2025-12-02','20:45','Ricardo Díaz','922889900',8,'Reunión de trabajo',9,9),
('2025-12-03','21:15','Elena Flores','944778899',6,'',10,10);

-- PEDIDOS DE EJEMPLO (IDs 1-8)
INSERT INTO Pedido(idUsuario, direccion, idMetodoPago, total, estado) VALUES
(1,'Av Lima 123',1,60.00,'Pagado'),        -- ID 1: Juan Pérez (Yape)
(2,'Jr Arequipa 456',2,45.00,'Pendiente'),  -- ID 2: Ana López (Efectivo)
(3,'Calle Sol 789',3,30.00,'Pagado'),       -- ID 3: Luis Ramos (Plin)
(6,'Calle Los Álamos 201',4,75.00,'Pagado'),    -- ID 4: Sofía Torres (Tarjeta Visa)
(7,'Av. Las Palmeras 500',5,64.00,'Pendiente'),  -- ID 5: Javier Ruiz (Tarjeta Mastercard)
(8,'Jr. Puno 333',6,55.00,'Pagado'),           -- ID 6: Gabriela Salas (BBVA)
(9,'Urb. San Roque N-1',1,100.00,'Pendiente'),  -- ID 7: Ricardo Díaz (Yape)
(10,'Pasaje Huancayo 10',2,35.00,'Pagado');      -- ID 8: Elena Flores (Efectivo)

-- DETALLES DE PEDIDOS (Total de 16 detalles)
INSERT INTO PedidoDetalle(idPedido,idProducto,cantidad,precioUnitario) VALUES
-- Pedido ID 1 (Total 60.00)
(1,1,2,20.00), -- 2x 1/4 Pollo a la Leña
(1,26,1,20.00), -- 1x Porción de Papas (Precio ajustado para cuadrar el total de 60.00)

-- Pedido ID 2 (Total 45.00)
(2,5,1,24.00), -- 1x Pizza Margarita
(2,36,1,7.00), -- 1x Gaseosa Gordita
(2,44,1,14.00), -- 1x Agua con Gas (Precio ajustado para cuadrar el total de 45.00)

-- Pedido ID 3 (Total 30.00)
(3,19,1,25.00), -- 1x Ravioles Jamón/Queso
(3,45,1,5.00),  -- 1x Café Solo

-- Pedido ID 4 (Total 75.00)
(4,3,1,75.00),   -- 1x 1 Pollo a la Leña

-- Pedido ID 5 (Total 64.00)
(5,9,1,30.00),  -- 1x Pizza Pepperoni
(5,19,1,25.00),  -- 1x Ravioles Jamón/Queso
(5,37,1,7.00),   -- 1x Gaseosa 1 LT (Ajustado a 7.00 para cuadrar el total de 64.00)
(5,11,1,2.00),  -- 1x Extra Pimiento

-- Pedido ID 6 (Total 55.00)
(6,21,1,30.00),  -- 1x Lasagna
(6,31,5,5.00),   -- 5x Refresco del Día 1/2 LT

-- Pedido ID 7 (Total 100.00)
(7,4,1,100.00),  -- 1x Promo Familiar

-- Pedido ID 8 (Total 35.00)
(8,74,1,30.00),  -- 1x Tabernero Rosé Selección
(8,41,1,5.00);   -- 1x Agua Natural (Ajustado a 5.00 para cuadrar el total de 35.00)

-- Insertar los encabezados de las promociones en la tabla Promociones
INSERT INTO Promociones (nombre, descripcion, precioFinal, categoria) VALUES
('Combo Pizza Angello + Pan al Ajo', 'Pizza Angello y una porción de Pan al Ajo.', 35.00, 'pizza'),
('Combo Lasagna + Tinto de Verano', 'Una Lasagna y un Tinto de Verano.', 45.00, 'pizza'),
('Combo Pizza (Am/Mar) + Sangría', 'Una Pizza Americana o Margarita con una Jarra de Sangría.', 50.00, 'pizza'),
('Combo 2 Aperol Spritz', 'Dos Aperol Spritz.', 34.00, 'pizza'),
('Combo 1/2 Pollo + Calientito', 'Medio Pollo a la Leña con un Calientito.', 53.00, 'pollo'),
('Combo 1 Pollo + Sangría', 'Un Pollo a la Leña con una Jarra de Sangría.', 100.00, 'pollo'),
('Combo 2 Pisco Sour', 'Dos Pisco Sour.', 34.00, 'pollo'),
('Promo Familiar (Menu Combo)', '1 Pollo + Papas + Ensalada + Arroz + Camote + Gaseosa 1.5L.', 110.00, 'pollo');

-- Insertar los componentes de las promociones en la tabla PromocionDetalle

-- Combo Pizza Angello + Pan al Ajo (ID de Pizza Angello=10, Pan al Ajo=83)
INSERT INTO PromocionDetalle (idPromocion, idProducto, cantidad) VALUES
((SELECT idPromocion FROM Promociones WHERE nombre = 'Combo Pizza Angello + Pan al Ajo'), 10, 1),
((SELECT idPromocion FROM Promociones WHERE nombre = 'Combo Pizza Angello + Pan al Ajo'), 83, 1);

-- Combo Lasagna + Tinto de Verano (ID de Lasagna=21, Tinto de Verano=56)
INSERT INTO PromocionDetalle (idPromocion, idProducto, cantidad) VALUES
((SELECT idPromocion FROM Promociones WHERE nombre = 'Combo Lasagna + Tinto de Verano'), 21, 1),
((SELECT idPromocion FROM Promociones WHERE nombre = 'Combo Lasagna + Tinto de Verano'), 56, 1);

-- Combo 2 Aperol Spritz (ID de Aperol Spritz=58)
INSERT INTO PromocionDetalle (idPromocion, idProducto, cantidad) VALUES
((SELECT idPromocion FROM Promociones WHERE nombre = 'Combo 2 Aperol Spritz'), 58, 2); -- Cantidad 2

-- Combo 1/2 Pollo + Calientito (ID de 1/2 Pollo a la Leña=2, Calientito=67)
INSERT INTO PromocionDetalle (idPromocion, idProducto, cantidad) VALUES
((SELECT idPromocion FROM Promociones WHERE nombre = 'Combo 1/2 Pollo + Calientito'), 2, 1),
((SELECT idPromocion FROM Promociones WHERE nombre = 'Combo 1/2 Pollo + Calientito'), 67, 1);

-- Combo 1 Pollo + Sangría (ID de 1 Pollo a la Leña=3, Sangría=66)
INSERT INTO PromocionDetalle (idPromocion, idProducto, cantidad) VALUES
((SELECT idPromocion FROM Promociones WHERE nombre = 'Combo 1 Pollo + Sangría'), 3, 1),
((SELECT idPromocion FROM Promociones WHERE nombre = 'Combo 1 Pollo + Sangría'), 66, 1);

-- Combo 2 Pisco Sour (ID de Pisco Sour=52)
INSERT INTO PromocionDetalle (idPromocion, idProducto, cantidad) VALUES
((SELECT idPromocion FROM Promociones WHERE nombre = 'Combo 2 Pisco Sour'), 52, 2); -- Cantidad 2
-- ================================================================
-- 7. VISTAS ÚTILES
-- ================================================================

-- 1. Vista de usuarios
CREATE OR REPLACE VIEW datos_usuarios AS
SELECT
    id,
    nombre,
    correo,
    fecha_registro 
FROM Usuarios;

-- 2. Vista de administradores
CREATE OR REPLACE VIEW datos_administradores AS
SELECT
    id,
    nombre,
    correo,
    rol,
    fecha_creacion,
    activo
FROM Administradores
WHERE activo = TRUE;

-- 3. Vista de registro completo
CREATE OR REPLACE VIEW datos_registro AS
SELECT
    id,
    nombre,
    apellidos,
    usuario,
    dni,
    correo,
    telefono,
    fecha_registro
FROM Registro;

-- 4. Vista de productos
CREATE OR REPLACE VIEW datos_productos AS
SELECT
    idProducto,
    nombre,
    descripcion,
    precio,
    categoria
FROM Producto;

-- 5. Vista de mesas
CREATE OR REPLACE VIEW datos_mesas AS
SELECT
    idMesa,
    numeroMesa,
    capacidad
FROM Mesa;

-- 6. Vista de métodos de pago
CREATE OR REPLACE VIEW datos_metodos_pago AS
SELECT
    idMetodoPago,
    nombre
FROM MetodoPago;

-- 7. Vista de reservas completas
CREATE OR REPLACE VIEW datos_reservas AS
SELECT
    r.id,
    r.fecha,
    r.hora,
    r.nombre AS nombre_cliente,
    r.celular,
    r.cantidad_personas,
    r.mensaje,
    u.nombre AS usuario_registrado,
    m.numeroMesa
FROM Reservas r
LEFT JOIN Usuarios u ON r.usuario_id = u.id
LEFT JOIN Mesa m ON r.idMesa = m.idMesa;

-- 8. Vista de pedidos (CORREGIDA)
CREATE OR REPLACE VIEW datos_pedidos AS
SELECT
    p.idPedido,
    r.nombre AS Nombre,       -- Nombre del cliente (desde Registro)
    r.apellidos AS Apellidos, -- Apellido del cliente (desde Registro)
    p.direccion,
    p.total,
    mp.nombre AS MetodoPago,
    p.estado,
    p.fechaPedido
FROM Pedido p
JOIN Usuarios u ON p.idUsuario = u.id
JOIN Registro r ON u.id = r.id
JOIN MetodoPago mp ON p.idMetodoPago = mp.idMetodoPago;

-- 9. Vista de detalle del pedido
CREATE OR REPLACE VIEW datos_pedido_detalle AS
SELECT
    pd.idDetalle,
    pd.idPedido,
    pr.nombre AS producto,
    pd.cantidad,
    pd.precioUnitario,
    pd.subtotal
FROM PedidoDetalle pd
JOIN Producto pr ON pd.idProducto = pr.idProducto;

-- 10. Vista de promociones principales
CREATE OR REPLACE VIEW datos_promociones AS
SELECT
    idPromocion,
    nombre AS nombre_promocion,
    descripcion,
    precioFinal,
    categoria,
    fechaInicio,
    fechaFin,
    activo
FROM Promociones
WHERE activo = TRUE;

-- 11. Vista de detalle de promociones
CREATE OR REPLACE VIEW datos_detalle_promociones AS
SELECT
    pd.idDetalle,
    p.nombre AS nombre_promocion,
    pr.nombre AS producto_componente,
    pd.cantidad,
    p.precioFinal AS precio_total_combo,
    pr.precio AS precio_unitario_producto
FROM PromocionDetalle pd
JOIN Promociones p ON pd.idPromocion = p.idPromocion
JOIN Producto pr ON pd.idProducto = pr.idProducto;

CREATE VIEW v_comentarios_publicos AS
SELECT
    id,
    usuario_nombre,
    texto,
    -- Formatear la fecha para una mejor lectura en la vista
    DATE_FORMAT(fecha, '%d/%m/%Y %H:%i:%s') AS fecha_formato
FROM Comentarios
ORDER BY fecha DESC;

CREATE VIEW v_reclamos_con_usuario AS
SELECT
    R.id AS reclamo_id,
    U.nombre AS nombre_usuario, -- Usamos el nombre de la tabla Usuarios
    R.texto,
    R.usuario_id,
    DATE_FORMAT(R.fecha, '%d/%m/%Y %H:%i:%s') AS fecha_formato
FROM Reclamaciones R
JOIN Usuarios U ON R.usuario_id = U.id
ORDER BY R.fecha DESC;
-- ================================================================
-- 8. CONSULTAS DE VERIFICACIÓN
-- ================================================================
SELECT 'VERIFICACIÓN DE DATOS' as status;
SELECT COUNT(*) as total_usuarios FROM Usuarios;
SELECT COUNT(*) as total_administradores FROM Administradores;
SELECT COUNT(*) as total_registros FROM Registro;
SELECT COUNT(*) as total_reservas FROM Reservas;
SELECT COUNT(*) as total_pedidos FROM Pedido;
SELECT COUNT(*) as total_detalle_pedidos FROM PedidoDetalle;
SELECT COUNT(*) as total_productos FROM Producto;
SELECT COUNT(*) as total_mesas FROM Mesa;
SELECT COUNT(*) as total_metodos_pago FROM MetodoPago;

-- Verificar administradores autorizados para el sistema
SELECT 'ADMINISTRADORES AUTORIZADOS PARA EL SISTEMA:' as info;
SELECT id, nombre, correo, rol FROM Administradores WHERE activo = TRUE;

SELECT 'TOTAL DE ADMINISTRADORES POR ROL:' as info;
SELECT rol, COUNT(*) as cantidad FROM Administradores WHERE activo = TRUE GROUP BY rol;

SELECT 'SCRIPT COMPLETADO EXITOSAMENTE' as final_status;

-- Consultas adicionales para testing
SELECT * FROM Registro LIMIT 5;
SELECT * FROM MetodoPago;
SELECT * FROM Producto LIMIT 5;
SELECT * FROM Administradores WHERE activo = TRUE;
SELECT * FROM Mesa;
SELECT * FROM Usuarios;
SELECT * FROM datos_detalle_promociones;
SELECT * FROM datos_promociones;
SELECT * FROM v_comentarios_publicos;
SELECT * FROM v_reclamos_con_usuario;

