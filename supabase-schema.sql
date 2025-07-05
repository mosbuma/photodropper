-- Drop tables if they exist
DROP TABLE IF EXISTS partydropper.comments CASCADE;
DROP TABLE IF EXISTS partydropper.photos CASCADE;
DROP TABLE IF EXISTS partydropper.social_events CASCADE;

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS partydropper;

-- SocialEvent table
CREATE TABLE partydropper.social_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  photo_duration_ms integer NOT NULL DEFAULT 5000,
  scroll_speed_pct integer NOT NULL DEFAULT 50
);

-- Photo table
CREATE TABLE partydropper.photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES partydropper.social_events(id) ON DELETE CASCADE,
  index integer NOT NULL,
  photo_url text NOT NULL,
  uploader_name text,
  date_taken date,
  coordinates text,
  location text,
  visible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  schedule_count integer NOT NULL DEFAULT 0,
  show_count integer NOT NULL DEFAULT 0,
  last_shown timestamptz,
  show_from timestamptz,
  show_to timestamptz,
  CONSTRAINT unique_event_index UNIQUE (event_id, index)
);

-- Comment table
CREATE TABLE partydropper.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES partydropper.social_events(id) ON DELETE CASCADE,
  photo_id uuid REFERENCES partydropper.photos(id) ON DELETE CASCADE,
  index integer NOT NULL,
  comment text NOT NULL,
  commenter_name text,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  schedule_count integer NOT NULL DEFAULT 0,
  show_count integer NOT NULL DEFAULT 0,
  last_shown timestamptz,
  show_from timestamptz,
  show_to timestamptz,
  CONSTRAINT unique_event_photo_index UNIQUE (event_id, photo_id, index)
);

-- Disable RLS for all tables
ALTER TABLE partydropper.social_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE partydropper.photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE partydropper.comments DISABLE ROW LEVEL SECURITY;

-- Set search_path back to public
SET search_path TO public; 