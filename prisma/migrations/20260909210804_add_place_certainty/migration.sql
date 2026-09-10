-- AlterTable
ALTER TABLE "persons" ADD COLUMN     "birth_place_certainty" "Certainty" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "death_place_certainty" "Certainty" NOT NULL DEFAULT 'UNKNOWN';
