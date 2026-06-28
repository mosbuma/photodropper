-- Event-level access codes and URL slugs for participant join links
USE `photodropper`;

ALTER TABLE `social_events`
  ADD COLUMN `slug` VARCHAR(64) NULL AFTER `name`,
  ADD COLUMN `access_code` VARCHAR(32) NULL AFTER `slug`;

UPDATE `social_events`
SET
  `slug` = LEFT(
    LOWER(
      TRIM(BOTH '-' FROM
        REGEXP_REPLACE(
          REGEXP_REPLACE(`name`, '[^a-zA-Z0-9]+', '-'),
          '-+',
          '-'
        )
      )
    ),
    60
  ),
  `access_code` = UPPER(SUBSTRING(REPLACE(UUID(), '-', ''), 1, 8))
WHERE `slug` IS NULL OR `access_code` IS NULL OR `slug` = '' OR `access_code` = '';

UPDATE `social_events` e
JOIN (
  SELECT `slug`
  FROM `social_events`
  GROUP BY `slug`
  HAVING COUNT(*) > 1
) dup ON dup.`slug` = e.`slug`
SET e.`slug` = LEFT(CONCAT(e.`slug`, '-', LEFT(e.`id`, 8)), 64);

ALTER TABLE `social_events`
  MODIFY COLUMN `slug` VARCHAR(64) NOT NULL,
  MODIFY COLUMN `access_code` VARCHAR(32) NOT NULL;

CREATE UNIQUE INDEX `social_events_slug_key` ON `social_events` (`slug`);
