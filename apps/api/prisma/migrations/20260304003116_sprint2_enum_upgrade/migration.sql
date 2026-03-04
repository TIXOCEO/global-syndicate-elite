-- Create enum type ONLY if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CrimeType') THEN
        CREATE TYPE "CrimeType" AS ENUM (
            'STREET_THEFT',
            'BLACK_MARKET_DEAL',
            'WAREHOUSE_RAID'
        );
    END IF;
END
$$;

-- Convert existing column safely
ALTER TABLE "CrimeLog"
ALTER COLUMN "crimeType"
TYPE "CrimeType"
USING "crimeType"::text::"CrimeType";

-- Enforce NOT NULL on XP columns
ALTER TABLE "CrimeLog"
ALTER COLUMN "shootingXpGranted" SET NOT NULL,
ALTER COLUMN "smugglingXpGranted" SET NOT NULL,
ALTER COLUMN "rxpGranted" SET NOT NULL;
