-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `emailVerifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lastLoginAt` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_emailVerified_idx`(`emailVerified`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_confirmations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `email_confirmations_token_key`(`token`),
    INDEX `email_confirmations_token_idx`(`token`),
    INDEX `email_confirmations_userId_idx`(`userId`),
    INDEX `email_confirmations_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_resets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `password_resets_token_key`(`token`),
    INDEX `password_resets_token_idx`(`token`),
    INDEX `password_resets_userId_idx`(`userId`),
    INDEX `password_resets_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refresh_tokens_token_key`(`token`),
    INDEX `refresh_tokens_token_idx`(`token`),
    INDEX `refresh_tokens_userId_idx`(`userId`),
    INDEX `refresh_tokens_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `date` DATE NULL,
    `end_date` DATE NULL,
    `location` VARCHAR(255) NULL,

    INDEX `events_date_idx`(`date`),
    INDEX `events_title_idx`(`title`),
    INDEX `events_location_idx`(`location`),
    INDEX `events_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `name` VARCHAR(100) NULL,
    `icon` VARCHAR(100) NULL,
    `color` VARCHAR(10) NULL,

    INDEX `event_types_name_idx`(`name`),
    INDEX `event_types_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `life_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `person_id` INTEGER NULL,
    `event_id` INTEGER NULL,
    `title` VARCHAR(255) NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `location` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `metadata` JSON NULL,
    `event_type_id` INTEGER NULL,

    INDEX `person_id`(`person_id`),
    INDEX `fk_event_type`(`event_type_id`),
    INDEX `fk_event`(`event_id`),
    INDEX `life_events_start_date_idx`(`start_date`),
    INDEX `life_events_end_date_idx`(`end_date`),
    INDEX `life_events_title_idx`(`title`),
    INDEX `life_events_location_idx`(`location`),
    INDEX `life_events_person_id_start_date_idx`(`person_id`, `start_date`),
    INDEX `life_events_person_id_end_date_idx`(`person_id`, `end_date`),
    INDEX `life_events_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `persons` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `first_name` VARCHAR(100) NULL,
    `last_name` VARCHAR(100) NULL,
    `birth_date` DATE NULL,
    `birth_place` VARCHAR(255) NULL,
    `death_date` DATE NULL,
    `death_place` VARCHAR(255) NULL,
    `notes` TEXT NULL,

    INDEX `persons_first_name_idx`(`first_name`),
    INDEX `persons_last_name_idx`(`last_name`),
    INDEX `persons_birth_date_idx`(`birth_date`),
    INDEX `persons_death_date_idx`(`death_date`),
    INDEX `persons_birth_place_idx`(`birth_place`),
    INDEX `persons_death_place_idx`(`death_place`),
    INDEX `persons_first_name_last_name_idx`(`first_name`, `last_name`),
    INDEX `persons_userId_idx`(`userId`),
    FULLTEXT INDEX `persons_first_name_last_name_birth_place_death_place_notes_idx`(`first_name`, `last_name`, `birth_place`, `death_place`, `notes`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `person_relations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `from_person_id` INTEGER NOT NULL,
    `to_person_id` INTEGER NOT NULL,
    `relation_type` VARCHAR(100) NOT NULL,
    `notes` TEXT NULL,

    INDEX `person_relations_from_person_id_idx`(`from_person_id`),
    INDEX `person_relations_to_person_id_idx`(`to_person_id`),
    INDEX `person_relations_relation_type_idx`(`relation_type`),
    INDEX `person_relations_from_person_id_relation_type_idx`(`from_person_id`, `relation_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `literature` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `author` VARCHAR(255) NOT NULL,
    `publicationYear` INTEGER NULL,
    `type` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `url` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `literature_userId_idx`(`userId`),
    INDEX `literature_title_idx`(`title`),
    INDEX `literature_author_idx`(`author`),
    INDEX `literature_type_idx`(`type`),
    INDEX `literature_publicationYear_idx`(`publicationYear`),
    FULLTEXT INDEX `literature_title_author_description_idx`(`title`, `author`, `description`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `email_confirmations` ADD CONSTRAINT `email_confirmations_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `password_resets` ADD CONSTRAINT `password_resets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_types` ADD CONSTRAINT `event_types_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `life_events` ADD CONSTRAINT `fk_event` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `life_events` ADD CONSTRAINT `fk_event_type` FOREIGN KEY (`event_type_id`) REFERENCES `event_types`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `life_events` ADD CONSTRAINT `life_events_ibfk_1` FOREIGN KEY (`person_id`) REFERENCES `persons`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `life_events` ADD CONSTRAINT `life_events_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `persons` ADD CONSTRAINT `persons_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `person_relations` ADD CONSTRAINT `person_relations_from_person_id_fkey` FOREIGN KEY (`from_person_id`) REFERENCES `persons`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `person_relations` ADD CONSTRAINT `person_relations_to_person_id_fkey` FOREIGN KEY (`to_person_id`) REFERENCES `persons`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `literature` ADD CONSTRAINT `literature_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
