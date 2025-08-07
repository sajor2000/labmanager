-- Direct SQL to remove TRL lab and associated data
-- Run this with psql or any PostgreSQL client

-- First, check if TRL exists
SELECT id, "shortName", name FROM "Lab" WHERE "shortName" = 'TRL';

-- If it exists, delete all associated data
-- Note: This will CASCADE delete related data due to foreign key constraints

-- Delete the TRL lab (this will cascade to related tables)
DELETE FROM "Lab" WHERE "shortName" = 'TRL';

-- Also remove any test users
DELETE FROM "User" WHERE email LIKE '%test%' OR email = 'test@example.com';

-- Show remaining labs
SELECT "shortName", name FROM "Lab" ORDER BY "shortName";
