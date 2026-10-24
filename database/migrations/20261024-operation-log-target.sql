ALTER TABLE `operation_logs`
  ADD COLUMN `target_type` VARCHAR(32) DEFAULT NULL COMMENT '操作对象类型' AFTER `action`,
  ADD COLUMN `target_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '操作对象ID' AFTER `target_type`,
  ADD COLUMN `target_name` VARCHAR(128) DEFAULT NULL COMMENT '操作对象名称（冗余）' AFTER `target_id`,
  ADD KEY `idx_oplog_target` (`target_type`, `target_id`),
  ADD KEY `idx_oplog_target_name` (`target_name`);
