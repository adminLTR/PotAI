-- CreateTable
CREATE TABLE `ambiental_conditions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `plant_id` INTEGER NOT NULL,
    `temperature_celsius` FLOAT NULL,
    `humidity_percent` FLOAT NULL,
    `moisture_percent` FLOAT NULL,
    `light_lux` FLOAT NULL,
    `recorded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ambiental_conditions_plant_id_idx`(`plant_id`),
    INDEX `ambiental_conditions_recorded_at_idx`(`recorded_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `watering_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ambiental_conditions_id` INTEGER NOT NULL,
    `watered_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `amount_ml` INTEGER NOT NULL,

    INDEX `watering_logs_ambiental_conditions_id_idx`(`ambiental_conditions_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
