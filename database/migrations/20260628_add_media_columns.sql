-- Run on existing photodropper DB after deploy:
--   mysql -u photodropper -p photodropper < database/migrations/20260628_add_media_columns.sql

USE `photodropper`;

ALTER TABLE `photos`
  ADD COLUMN `media_type` VARCHAR(16) NOT NULL DEFAULT 'image' AFTER `photo_url`,
  ADD COLUMN `duration_ms` INT NULL AFTER `media_type`,
  ADD COLUMN `thumbnail_url` VARCHAR(2048) NULL AFTER `duration_ms`,
  ADD COLUMN `mime_type` VARCHAR(64) NULL AFTER `thumbnail_url`;
