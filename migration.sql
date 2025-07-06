-- Migration: Add commentStyle to social_events table
-- Run this to update your existing database

-- Add the comment_style column to the social_events table with a default value
ALTER TABLE partydropper.social_events 
ADD COLUMN comment_style VARCHAR(16) NOT NULL DEFAULT 'TICKER';

-- Update existing events to have the default comment style
-- (This is optional since we set a default, but ensures consistency)
UPDATE partydropper.social_events 
SET comment_style = 'TICKER' 
WHERE comment_style IS NULL;

-- Verify the migration
SELECT id, name, comment_style FROM partydropper.social_events LIMIT 5; 