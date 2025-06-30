-- DropIndex
DROP INDEX `literature_title_author_description_idx` ON `literature`;

-- AlterTable
ALTER TABLE `literature` ADD COLUMN `abstract` TEXT NULL,
    ADD COLUMN `doi` VARCHAR(255) NULL,
    ADD COLUMN `externalId` VARCHAR(255) NULL,
    ADD COLUMN `isbn` VARCHAR(50) NULL,
    ADD COLUMN `issn` VARCHAR(50) NULL,
    ADD COLUMN `issue` VARCHAR(50) NULL,
    ADD COLUMN `journal` VARCHAR(255) NULL,
    ADD COLUMN `keywords` TEXT NULL,
    ADD COLUMN `language` VARCHAR(50) NULL,
    ADD COLUMN `lastSyncedAt` DATETIME(3) NULL,
    ADD COLUMN `pages` VARCHAR(100) NULL,
    ADD COLUMN `publisher` VARCHAR(255) NULL,
    ADD COLUMN `syncMetadata` JSON NULL,
    ADD COLUMN `syncSource` VARCHAR(50) NULL,
    ADD COLUMN `volume` VARCHAR(50) NULL;

-- CreateTable
CREATE TABLE `bibliography_syncs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `service` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `apiKey` VARCHAR(500) NULL,
    `apiSecret` VARCHAR(500) NULL,
    `accessToken` VARCHAR(500) NULL,
    `refreshToken` VARCHAR(500) NULL,
    `tokenExpiresAt` DATETIME(3) NULL,
    `collectionId` VARCHAR(255) NULL,
    `collectionName` VARCHAR(255) NULL,
    `autoSync` BOOLEAN NOT NULL DEFAULT false,
    `syncInterval` INTEGER NULL,
    `lastSyncAt` DATETIME(3) NULL,
    `syncMetadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `bibliography_syncs_userId_idx`(`userId`),
    INDEX `bibliography_syncs_service_idx`(`service`),
    INDEX `bibliography_syncs_isActive_idx`(`isActive`),
    INDEX `bibliography_syncs_userId_service_idx`(`userId`, `service`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `literature_externalId_idx` ON `literature`(`externalId`);

-- CreateIndex
CREATE INDEX `literature_syncSource_idx` ON `literature`(`syncSource`);

-- CreateIndex
CREATE INDEX `literature_externalId_syncSource_idx` ON `literature`(`externalId`, `syncSource`);

-- CreateIndex
CREATE FULLTEXT INDEX `literature_title_author_description_abstract_keywords_idx` ON `literature`(`title`, `author`, `description`, `abstract`, `keywords`);

-- AddForeignKey
ALTER TABLE `bibliography_syncs` ADD CONSTRAINT `bibliography_syncs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
