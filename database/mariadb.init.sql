-- Photodropper MariaDB bootstrap
-- Usage (as MySQL root on Synology MariaDB):
--   mysql -u root -p < database/mariadb.init.sql
--
-- Then create an app user, e.g.:
--   CREATE USER 'photodropper'@'localhost' IDENTIFIED BY 'your-password';
--   GRANT ALL PRIVILEGES ON photodropper.* TO 'photodropper'@'localhost';
--   FLUSH PRIVILEGES;

CREATE DATABASE IF NOT EXISTS `photodropper`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `photodropper`;

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `social_events` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(64) NOT NULL,
  `access_code` VARCHAR(32) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `photo_duration_ms` INT NOT NULL DEFAULT 5000,
  `scroll_speed_pct` INT NOT NULL DEFAULT 50,
  `comment_style` VARCHAR(16) NOT NULL DEFAULT 'TICKER',
  `enable_photo_comments` BOOLEAN NOT NULL DEFAULT TRUE,
  `enable_event_comments` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `social_events_slug_key` ON `social_events` (`slug`);

CREATE TABLE IF NOT EXISTS `photos` (
  `id` VARCHAR(36) NOT NULL,
  `event_id` VARCHAR(36) NOT NULL,
  `index` INT NOT NULL,
  `photo_url` VARCHAR(2048) NOT NULL,
  `media_type` VARCHAR(16) NOT NULL DEFAULT 'image',
  `duration_ms` INT NULL,
  `thumbnail_url` VARCHAR(2048) NULL,
  `mime_type` VARCHAR(64) NULL,
  `uploader_name` VARCHAR(255) NULL,
  `date_taken` VARCHAR(64) NULL,
  `coordinates` VARCHAR(64) NULL,
  `location` TEXT NULL,
  `visible` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `schedule_count` INT NOT NULL DEFAULT 0,
  `show_count` INT NOT NULL DEFAULT 0,
  `last_shown` DATETIME(3) NULL,
  `show_from` DATETIME(3) NULL,
  `show_to` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `photos_event_id_index_key` (`event_id`, `index`),
  KEY `photos_event_id_idx` (`event_id`),
  CONSTRAINT `photos_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `social_events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `comments` (
  `id` VARCHAR(36) NOT NULL,
  `event_id` VARCHAR(36) NOT NULL,
  `photo_id` VARCHAR(36) NULL,
  `index` INT NOT NULL,
  `comment` VARCHAR(255) NOT NULL,
  `commenter_name` VARCHAR(32) NULL,
  `visible` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `schedule_count` INT NOT NULL DEFAULT 0,
  `show_count` INT NOT NULL DEFAULT 0,
  `last_shown` DATETIME(3) NULL,
  `show_from` DATETIME(3) NULL,
  `show_to` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `comments_event_id_photo_id_index_key` (`event_id`, `photo_id`, `index`),
  KEY `comments_event_id_idx` (`event_id`),
  CONSTRAINT `comments_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `social_events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `comments_photo_id_fkey` FOREIGN KEY (`photo_id`) REFERENCES `photos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
