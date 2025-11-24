-- SQL script to clean Biography prefix from artist bio data
-- Run this with: psql connection_string -f clean_bio.sql

-- Update all artist bios that start with "Biography"
UPDATE artists 
SET bio = TRIM(SUBSTRING(bio FROM 10))
WHERE bio LIKE 'Biography%';

-- Show count of updated rows
SELECT COUNT(*) as cleaned_count 
FROM artists 
WHERE bio NOT LIKE 'Biography%' AND bio IS NOT NULL;
