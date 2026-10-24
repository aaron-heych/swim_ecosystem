-- Run this script after selecting the target database (for example, swimming_platform).
-- It removes every foreign-key constraint in the selected schema and keeps all data
-- and ordinary indexes unchanged.
DELIMITER $$

DROP PROCEDURE IF EXISTS `drop_all_foreign_keys`$$

CREATE PROCEDURE `drop_all_foreign_keys`()
BEGIN
  DECLARE table_name_value VARCHAR(64);
  DECLARE constraint_name_value VARCHAR(64);
  DECLARE queue_id BIGINT UNSIGNED;

  IF DATABASE() IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Select a target database before running this migration';
  END IF;

  DROP TEMPORARY TABLE IF EXISTS `_foreign_key_drop_queue`;
  CREATE TEMPORARY TABLE `_foreign_key_drop_queue` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `table_name` VARCHAR(64) NOT NULL,
    `constraint_name` VARCHAR(64) NOT NULL
  );
  INSERT INTO `_foreign_key_drop_queue` (`table_name`, `constraint_name`)
  SELECT `TABLE_NAME`, `CONSTRAINT_NAME`
  FROM `information_schema`.`KEY_COLUMN_USAGE`
  WHERE `CONSTRAINT_SCHEMA` = DATABASE()
    AND `REFERENCED_TABLE_NAME` IS NOT NULL;

  WHILE EXISTS (SELECT 1 FROM `_foreign_key_drop_queue`) DO
    SELECT `id`, `table_name`, `constraint_name`
    INTO queue_id, table_name_value, constraint_name_value
    FROM `_foreign_key_drop_queue`
    ORDER BY `id`
    LIMIT 1;

    SET @drop_fk_sql = CONCAT(
      'ALTER TABLE `',
      REPLACE(DATABASE(), '`', '``'),
      '`.`',
      REPLACE(table_name_value, '`', '``'),
      '` DROP FOREIGN KEY `',
      REPLACE(constraint_name_value, '`', '``'),
      '`'
    );
    PREPARE drop_fk_statement FROM @drop_fk_sql;
    EXECUTE drop_fk_statement;
    DEALLOCATE PREPARE drop_fk_statement;
    DELETE FROM `_foreign_key_drop_queue` WHERE `id` = queue_id;
  END WHILE;

  DROP TEMPORARY TABLE `_foreign_key_drop_queue`;
END$$

CALL `drop_all_foreign_keys`()$$
DROP PROCEDURE `drop_all_foreign_keys`$$

DELIMITER ;
