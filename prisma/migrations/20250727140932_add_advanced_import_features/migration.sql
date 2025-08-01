-- AlterTable
ALTER TABLE "events" ADD COLUMN     "created_via_import" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "date_original" VARCHAR(100),
ADD COLUMN     "date_uncertainty" VARCHAR(20),
ADD COLUMN     "end_date_original" VARCHAR(100),
ADD COLUMN     "end_date_uncertainty" VARCHAR(20),
ADD COLUMN     "import_batch_id" VARCHAR(100),
ADD COLUMN     "location_confidence" DECIMAL(3,2),
ADD COLUMN     "location_normalized" VARCHAR(255),
ADD COLUMN     "title_confidence" DECIMAL(3,2);

-- AlterTable
ALTER TABLE "persons" ADD COLUMN     "birth_date_original" VARCHAR(100),
ADD COLUMN     "birth_date_uncertainty" VARCHAR(20),
ADD COLUMN     "birth_place_confidence" DECIMAL(3,2),
ADD COLUMN     "birth_place_normalized" VARCHAR(255),
ADD COLUMN     "created_via_import" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "death_date_original" VARCHAR(100),
ADD COLUMN     "death_date_uncertainty" VARCHAR(20),
ADD COLUMN     "death_place_confidence" DECIMAL(3,2),
ADD COLUMN     "death_place_normalized" VARCHAR(255),
ADD COLUMN     "import_batch_id" VARCHAR(100),
ADD COLUMN     "name_confidence" DECIMAL(3,2);

-- CreateTable
CREATE TABLE "import_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "import_type" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "total_records" INTEGER NOT NULL,
    "imported_count" INTEGER NOT NULL,
    "error_count" INTEGER NOT NULL,
    "skipped_count" INTEGER NOT NULL,
    "processing_time" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "error_details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_uncertainty" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "table_name" VARCHAR(50) NOT NULL,
    "record_id" INTEGER NOT NULL,
    "field_name" VARCHAR(50) NOT NULL,
    "original_value" TEXT,
    "normalized_value" TEXT,
    "confidence" DECIMAL(3,2) NOT NULL,
    "uncertainty_type" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_uncertainty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duplicate_matches" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "table_name" VARCHAR(50) NOT NULL,
    "record_id" INTEGER NOT NULL,
    "duplicate_id" INTEGER NOT NULL,
    "confidence" DECIMAL(3,2) NOT NULL,
    "match_reason" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "resolved_action" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "duplicate_matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "import_history_batch_id_key" ON "import_history"("batch_id");

-- CreateIndex
CREATE INDEX "import_history_userId_idx" ON "import_history"("userId");

-- CreateIndex
CREATE INDEX "import_history_import_type_idx" ON "import_history"("import_type");

-- CreateIndex
CREATE INDEX "import_history_created_at_idx" ON "import_history"("created_at");

-- CreateIndex
CREATE INDEX "import_history_status_idx" ON "import_history"("status");

-- CreateIndex
CREATE INDEX "data_uncertainty_userId_idx" ON "data_uncertainty"("userId");

-- CreateIndex
CREATE INDEX "data_uncertainty_table_name_record_id_idx" ON "data_uncertainty"("table_name", "record_id");

-- CreateIndex
CREATE INDEX "data_uncertainty_field_name_idx" ON "data_uncertainty"("field_name");

-- CreateIndex
CREATE INDEX "data_uncertainty_uncertainty_type_idx" ON "data_uncertainty"("uncertainty_type");

-- CreateIndex
CREATE INDEX "data_uncertainty_confidence_idx" ON "data_uncertainty"("confidence");

-- CreateIndex
CREATE INDEX "duplicate_matches_userId_idx" ON "duplicate_matches"("userId");

-- CreateIndex
CREATE INDEX "duplicate_matches_table_name_record_id_idx" ON "duplicate_matches"("table_name", "record_id");

-- CreateIndex
CREATE INDEX "duplicate_matches_duplicate_id_idx" ON "duplicate_matches"("duplicate_id");

-- CreateIndex
CREATE INDEX "duplicate_matches_status_idx" ON "duplicate_matches"("status");

-- CreateIndex
CREATE INDEX "duplicate_matches_confidence_idx" ON "duplicate_matches"("confidence");

-- CreateIndex
CREATE INDEX "events_import_batch_id_idx" ON "events"("import_batch_id");

-- CreateIndex
CREATE INDEX "events_location_normalized_idx" ON "events"("location_normalized");

-- CreateIndex
CREATE INDEX "persons_import_batch_id_idx" ON "persons"("import_batch_id");

-- CreateIndex
CREATE INDEX "persons_birth_place_normalized_idx" ON "persons"("birth_place_normalized");

-- CreateIndex
CREATE INDEX "persons_death_place_normalized_idx" ON "persons"("death_place_normalized");

-- AddForeignKey
ALTER TABLE "import_history" ADD CONSTRAINT "import_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_uncertainty" ADD CONSTRAINT "data_uncertainty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duplicate_matches" ADD CONSTRAINT "duplicate_matches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
