-- Migration to change date_taken from date to text
-- This preserves existing data while changing the column type

-- First, add the new column
ALTER TABLE partydropper.photos ADD COLUMN date_taken_text text;

-- Copy existing date data to the new column (convert date to text format)
UPDATE partydropper.photos 
SET date_taken_text = date_taken::text 
WHERE date_taken IS NOT NULL;

-- Drop the old column
ALTER TABLE partydropper.photos DROP COLUMN date_taken;

-- Rename the new column to the original name
ALTER TABLE partydropper.photos RENAME COLUMN date_taken_text TO date_taken;

-- Add a comment to document the change
COMMENT ON COLUMN partydropper.photos.date_taken IS 'Date taken stored as text to support various formats including EXIF'; 