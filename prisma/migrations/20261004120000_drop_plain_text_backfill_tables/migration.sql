-- #160: the #150 backfill never ran (production had nothing to decode), so its
-- run-once marker and per-row backup tables are dropped. Both were empty.

-- DropTable
DROP TABLE "backfill_150_originals";

-- DropTable
DROP TABLE "data_backfills";
