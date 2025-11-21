-- CreateTable
CREATE TABLE `species` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `common_name` VARCHAR(100) NOT NULL,
    `scientific_name` VARCHAR(100) NOT NULL,
    `water_requirements` VARCHAR(255) NULL,
    `light_requirements` VARCHAR(255) NULL,
    `humidity_requirements` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `species_common_name_idx`(`common_name`),
    UNIQUE INDEX `species_common_name_scientific_name_key`(`common_name`, `scientific_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
