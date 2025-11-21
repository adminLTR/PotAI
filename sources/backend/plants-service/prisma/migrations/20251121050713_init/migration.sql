-- CreateTable
CREATE TABLE `plants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `pot_id` INTEGER NULL,
    `name` VARCHAR(100) NOT NULL,
    `image_url` VARCHAR(255) NULL,
    `species_id` INTEGER NULL,
    `planted_at` DATE NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `plants_user_id_idx`(`user_id`),
    INDEX `plants_pot_id_idx`(`pot_id`),
    INDEX `plants_species_id_idx`(`species_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
