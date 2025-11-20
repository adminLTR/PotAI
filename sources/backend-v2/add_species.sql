-- Script para verificar y agregar especies que reconoce el modelo

-- Verificar especies existentes
SELECT * FROM species;

-- Insertar las especies que reconoce el modelo de TensorFlow
-- (Solo si no existen)

INSERT IGNORE INTO species (common_name, scientific_name, optimal_water_frequency_days, optimal_light_hours, optimal_humidity_percent) 
VALUES 
('ajo', 'Allium sativum', 3, 6, 60),
('geranio', 'Pelargonium', 4, 6, 50),
('hierbabuena', 'Mentha spicata', 2, 5, 70),
('menta', 'Mentha', 2, 5, 70),
('oregano', 'Origanum vulgare', 5, 6, 40),
('orquidea', 'Orchidaceae', 7, 4, 60),
('rosachina', 'Hibiscus rosa-sinensis', 3, 6, 60),
('tomatecherry', 'Solanum lycopersicum var. cerasiforme', 2, 8, 65);

-- Verificar inserción
SELECT id, common_name, scientific_name FROM species;
