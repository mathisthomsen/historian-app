-- CreateTable
CREATE TABLE "data_backfills" (
    "name" TEXT NOT NULL,
    "applied_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "report" JSONB NOT NULL,

    CONSTRAINT "data_backfills_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "backfill_150_originals" (
    "table_name" TEXT NOT NULL,
    "column_name" TEXT NOT NULL,
    "row_id" TEXT NOT NULL,
    "original_text" TEXT,
    "decoded_text" TEXT,
    "original_json" JSONB,
    "decoded_json" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backfill_150_originals_pkey" PRIMARY KEY ("table_name","column_name","row_id")
);

