-- Caudo - Seed de categorías para el consumidor colombiano
-- Este archivo se ejecuta automáticamente al iniciar PostgreSQL por primera vez
-- El seed principal también se ejecuta desde NestJS (SeedService)

-- Categorías de EGRESO
INSERT INTO categories (id, nombre, tipo, icono)
SELECT gen_random_uuid(), 'Transporte', 'egreso', '🚌'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE nombre = 'Transporte' AND tipo = 'egreso');

INSERT INTO categories (id, nombre, tipo, icono)
SELECT gen_random_uuid(), 'Alimentación', 'egreso', '🍽️'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE nombre = 'Alimentación' AND tipo = 'egreso');

INSERT INTO categories (id, nombre, tipo, icono)
SELECT gen_random_uuid(), 'Arriendo', 'egreso', '🏠'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE nombre = 'Arriendo' AND tipo = 'egreso');

INSERT INTO categories (id, nombre, tipo, icono)
SELECT gen_random_uuid(), 'Servicios Públicos', 'egreso', '💡'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE nombre = 'Servicios Públicos' AND tipo = 'egreso');

INSERT INTO categories (id, nombre, tipo, icono)
SELECT gen_random_uuid(), 'Entretenimiento', 'egreso', '🎬'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE nombre = 'Entretenimiento' AND tipo = 'egreso');

INSERT INTO categories (id, nombre, tipo, icono)
SELECT gen_random_uuid(), 'Salud', 'egreso', '🏥'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE nombre = 'Salud' AND tipo = 'egreso');

INSERT INTO categories (id, nombre, tipo, icono)
SELECT gen_random_uuid(), 'Educación', 'egreso', '📚'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE nombre = 'Educación' AND tipo = 'egreso');

INSERT INTO categories (id, nombre, tipo, icono)
SELECT gen_random_uuid(), 'Ropa', 'egreso', '👕'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE nombre = 'Ropa' AND tipo = 'egreso');

INSERT INTO categories (id, nombre, tipo, icono)
SELECT gen_random_uuid(), 'Tecnología', 'egreso', '💻'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE nombre = 'Tecnología' AND tipo = 'egreso');

INSERT INTO categories (id, nombre, tipo, icono)
SELECT gen_random_uuid(), 'Mascota', 'egreso', '🐶'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE nombre = 'Mascota' AND tipo = 'egreso');

INSERT INTO categories (id, nombre, tipo, icono)
SELECT gen_random_uuid(), 'Cuidado Personal', 'egreso', '💅'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE nombre = 'Cuidado Personal' AND tipo = 'egreso');

INSERT INTO categories (id, nombre, tipo, icono)
SELECT gen_random_uuid(), 'Suscripciones', 'egreso', '📱'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE nombre = 'Suscripciones' AND tipo = 'egreso');

INSERT INTO categories (id, nombre, tipo, icono)
SELECT gen_random_uuid(), 'Otros Gastos', 'egreso', '📦'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE nombre = 'Otros Gastos' AND tipo = 'egreso');

INSERT INTO categories (id, nombre, tipo, icono)
SELECT gen_random_uuid(), 'Ahorro', 'egreso', '🏦'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE nombre = 'Ahorro' AND tipo = 'egreso');

-- Categorías de INGRESO
INSERT INTO categories (id, nombre, tipo, icono)
SELECT gen_random_uuid(), 'Salario', 'ingreso', '💰'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE nombre = 'Salario' AND tipo = 'ingreso');

INSERT INTO categories (id, nombre, tipo, icono)
SELECT gen_random_uuid(), 'Freelance', 'ingreso', '💼'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE nombre = 'Freelance' AND tipo = 'ingreso');

INSERT INTO categories (id, nombre, tipo, icono)
SELECT gen_random_uuid(), 'Inversiones', 'ingreso', '📈'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE nombre = 'Inversiones' AND tipo = 'ingreso');

INSERT INTO categories (id, nombre, tipo, icono)
SELECT gen_random_uuid(), 'Ventas', 'ingreso', '🛍️'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE nombre = 'Ventas' AND tipo = 'ingreso');

INSERT INTO categories (id, nombre, tipo, icono)
SELECT gen_random_uuid(), 'Bonificaciones', 'ingreso', '🎁'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE nombre = 'Bonificaciones' AND tipo = 'ingreso');

INSERT INTO categories (id, nombre, tipo, icono)
SELECT gen_random_uuid(), 'Otros Ingresos', 'ingreso', '💵'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE nombre = 'Otros Ingresos' AND tipo = 'ingreso');
