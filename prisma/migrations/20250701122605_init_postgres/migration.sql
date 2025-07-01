-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_confirmations" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "location" TEXT,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_types" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT,
    "icon" TEXT,
    "color" TEXT,

    CONSTRAINT "event_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "life_events" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "person_id" INTEGER,
    "event_id" INTEGER,
    "title" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "location" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "event_type_id" INTEGER,

    CONSTRAINT "life_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "persons" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "birth_date" DATE,
    "birth_place" VARCHAR(255),
    "death_date" DATE,
    "death_place" VARCHAR(255),
    "notes" TEXT,

    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_relations" (
    "id" SERIAL NOT NULL,
    "from_person_id" INTEGER NOT NULL,
    "to_person_id" INTEGER NOT NULL,
    "relation_type" VARCHAR(100) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "person_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "literature" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "author" VARCHAR(255) NOT NULL,
    "publication_year" INTEGER,
    "type" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "url" VARCHAR(500),
    "publisher" VARCHAR(255),
    "journal" VARCHAR(255),
    "volume" VARCHAR(50),
    "issue" VARCHAR(50),
    "pages" VARCHAR(100),
    "doi" VARCHAR(255),
    "isbn" VARCHAR(50),
    "issn" VARCHAR(50),
    "language" VARCHAR(50),
    "keywords" TEXT,
    "abstract" TEXT,
    "externalId" VARCHAR(255),
    "syncSource" VARCHAR(50),
    "lastSyncedAt" TIMESTAMP(3),
    "syncMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "literature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bibliography_syncs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "service" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "apiKey" VARCHAR(500),
    "apiSecret" VARCHAR(500),
    "accessToken" VARCHAR(500),
    "refreshToken" VARCHAR(500),
    "tokenExpiresAt" TIMESTAMP(3),
    "collectionId" VARCHAR(255),
    "collectionName" VARCHAR(255),
    "autoSync" BOOLEAN NOT NULL DEFAULT false,
    "syncInterval" INTEGER,
    "lastSyncAt" TIMESTAMP(3),
    "syncMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bibliography_syncs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_emailVerified_idx" ON "users"("emailVerified");

-- CreateIndex
CREATE UNIQUE INDEX "email_confirmations_token_key" ON "email_confirmations"("token");

-- CreateIndex
CREATE INDEX "email_confirmations_token_idx" ON "email_confirmations"("token");

-- CreateIndex
CREATE INDEX "email_confirmations_userId_idx" ON "email_confirmations"("userId");

-- CreateIndex
CREATE INDEX "email_confirmations_expiresAt_idx" ON "email_confirmations"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_token_idx" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_userId_idx" ON "password_resets"("userId");

-- CreateIndex
CREATE INDEX "password_resets_expiresAt_idx" ON "password_resets"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "events_date_idx" ON "events"("date");

-- CreateIndex
CREATE INDEX "events_title_idx" ON "events"("title");

-- CreateIndex
CREATE INDEX "events_location_idx" ON "events"("location");

-- CreateIndex
CREATE INDEX "events_userId_idx" ON "events"("userId");

-- CreateIndex
CREATE INDEX "event_types_name_idx" ON "event_types"("name");

-- CreateIndex
CREATE INDEX "event_types_userId_idx" ON "event_types"("userId");

-- CreateIndex
CREATE INDEX "person_id" ON "life_events"("person_id");

-- CreateIndex
CREATE INDEX "fk_event_type_idx" ON "life_events"("event_type_id");

-- CreateIndex
CREATE INDEX "fk_event_idx" ON "life_events"("event_id");

-- CreateIndex
CREATE INDEX "life_events_start_date_idx" ON "life_events"("start_date");

-- CreateIndex
CREATE INDEX "life_events_end_date_idx" ON "life_events"("end_date");

-- CreateIndex
CREATE INDEX "life_events_title_idx" ON "life_events"("title");

-- CreateIndex
CREATE INDEX "life_events_location_idx" ON "life_events"("location");

-- CreateIndex
CREATE INDEX "life_events_person_id_start_date_idx" ON "life_events"("person_id", "start_date");

-- CreateIndex
CREATE INDEX "life_events_person_id_end_date_idx" ON "life_events"("person_id", "end_date");

-- CreateIndex
CREATE INDEX "life_events_userId_idx" ON "life_events"("userId");

-- CreateIndex
CREATE INDEX "persons_first_name_idx" ON "persons"("first_name");

-- CreateIndex
CREATE INDEX "persons_last_name_idx" ON "persons"("last_name");

-- CreateIndex
CREATE INDEX "persons_birth_date_idx" ON "persons"("birth_date");

-- CreateIndex
CREATE INDEX "persons_death_date_idx" ON "persons"("death_date");

-- CreateIndex
CREATE INDEX "persons_birth_place_idx" ON "persons"("birth_place");

-- CreateIndex
CREATE INDEX "persons_death_place_idx" ON "persons"("death_place");

-- CreateIndex
CREATE INDEX "persons_first_name_last_name_idx" ON "persons"("first_name", "last_name");

-- CreateIndex
CREATE INDEX "persons_userId_idx" ON "persons"("userId");

-- CreateIndex
CREATE INDEX "person_relations_from_person_id_idx" ON "person_relations"("from_person_id");

-- CreateIndex
CREATE INDEX "person_relations_to_person_id_idx" ON "person_relations"("to_person_id");

-- CreateIndex
CREATE INDEX "person_relations_relation_type_idx" ON "person_relations"("relation_type");

-- CreateIndex
CREATE INDEX "person_relations_from_person_id_relation_type_idx" ON "person_relations"("from_person_id", "relation_type");

-- CreateIndex
CREATE INDEX "literature_userId_idx" ON "literature"("userId");

-- CreateIndex
CREATE INDEX "literature_title_idx" ON "literature"("title");

-- CreateIndex
CREATE INDEX "literature_author_idx" ON "literature"("author");

-- CreateIndex
CREATE INDEX "literature_type_idx" ON "literature"("type");

-- CreateIndex
CREATE INDEX "literature_publication_year_idx" ON "literature"("publication_year");

-- CreateIndex
CREATE INDEX "literature_externalId_idx" ON "literature"("externalId");

-- CreateIndex
CREATE INDEX "literature_syncSource_idx" ON "literature"("syncSource");

-- CreateIndex
CREATE INDEX "literature_externalId_syncSource_idx" ON "literature"("externalId", "syncSource");

-- CreateIndex
CREATE INDEX "bibliography_syncs_userId_idx" ON "bibliography_syncs"("userId");

-- CreateIndex
CREATE INDEX "bibliography_syncs_service_idx" ON "bibliography_syncs"("service");

-- CreateIndex
CREATE INDEX "bibliography_syncs_isActive_idx" ON "bibliography_syncs"("isActive");

-- CreateIndex
CREATE INDEX "bibliography_syncs_userId_service_idx" ON "bibliography_syncs"("userId", "service");

-- CreateIndex
CREATE UNIQUE INDEX "bibliography_syncs_userId_service_key" ON "bibliography_syncs"("userId", "service");

-- AddForeignKey
ALTER TABLE "email_confirmations" ADD CONSTRAINT "email_confirmations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_types" ADD CONSTRAINT "event_types_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "life_events" ADD CONSTRAINT "fk_event_life_events" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "life_events" ADD CONSTRAINT "fk_event_type_life_events" FOREIGN KEY ("event_type_id") REFERENCES "event_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "life_events" ADD CONSTRAINT "life_events_ibfk_1" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "life_events" ADD CONSTRAINT "life_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persons" ADD CONSTRAINT "persons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_relations" ADD CONSTRAINT "person_relations_from_person_id_fkey" FOREIGN KEY ("from_person_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_relations" ADD CONSTRAINT "person_relations_to_person_id_fkey" FOREIGN KEY ("to_person_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "literature" ADD CONSTRAINT "literature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bibliography_syncs" ADD CONSTRAINT "bibliography_syncs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
