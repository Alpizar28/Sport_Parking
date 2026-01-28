BEGIN;

-- 1. Cleaning Data
-- Remove linked resources for tables
DELETE FROM public.reservation_resources
WHERE resource_id IN (
    SELECT id FROM public.resources WHERE type = 'TABLE_ROW'
);

-- Remove reservations of type 'TABLES_ONLY'
DELETE FROM public.reservations WHERE type = 'TABLES_ONLY';

-- Remove resources of type 'TABLE_ROW'
DELETE FROM public.resources WHERE type = 'TABLE_ROW';

-- 2. Modifying ENUMs
-- resource_type: Remove 'TABLE_ROW'
CREATE TYPE resource_type_new AS ENUM ('FIELD');
ALTER TABLE public.resources 
  ALTER COLUMN type TYPE resource_type_new 
  USING type::text::resource_type_new;
DROP TYPE resource_type;
ALTER TYPE resource_type_new RENAME TO resource_type;

-- reservation_type: Remove 'TABLES_ONLY'
CREATE TYPE reservation_type_new AS ENUM ('FIELD', 'EVENT');
ALTER TABLE public.reservations 
  ALTER COLUMN type TYPE reservation_type_new 
  USING type::text::reservation_type_new;
DROP TYPE reservation_type;
ALTER TYPE reservation_type_new RENAME TO reservation_type;

COMMIT;
