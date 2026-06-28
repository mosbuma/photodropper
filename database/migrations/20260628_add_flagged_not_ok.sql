-- Run on existing photodropper DB after deploy:
--   mysql -h HOST -u photodropper -p photodropper < database/migrations/20260628_add_flagged_not_ok.sql

USE `photodropper`;

ALTER TABLE `photos`
  ADD COLUMN `flagged_not_ok` TINYINT(1) NOT NULL DEFAULT 0 AFTER `visible`;
