DROP DATABASE IF EXISTS potia;
CREATE DATABASE IF NOT EXISTS potia;
USE potia;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE pots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    label VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE species (
    id INT AUTO_INCREMENT PRIMARY KEY,
    common_name VARCHAR(100) NOT NULL,
    scientific_name VARCHAR(100) NOT NULL,
    water_requirements VARCHAR(255),
    light_requirements VARCHAR(255),
    humidity_requirements VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (common_name, scientific_name)
);

CREATE TABLE plants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pot_id INT,
    name VARCHAR(100) NOT NULL,
    image_url VARCHAR(255),
    species_id INT,
    planted_at DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (species_id) REFERENCES species(id) ON DELETE SET NULL,
    FOREIGN KEY (pot_id) REFERENCES pots(id) ON DELETE SET NULL
);

CREATE TABLE ambiental_conditions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plant_id INT NOT NULL,
    temperature_celsius FLOAT,
    humidity_percent FLOAT,
    moisture_percent FLOAT,
    light_lux FLOAT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
);

CREATE TABLE watering_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ambiental_conditions_id INT NOT NULL,
    watered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount_ml INT NOT NULL,
    FOREIGN KEY (ambiental_conditions_id) REFERENCES ambiental_conditions(id) ON DELETE CASCADE
);