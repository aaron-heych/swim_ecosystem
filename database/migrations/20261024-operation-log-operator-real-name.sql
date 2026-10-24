ALTER TABLE `operation_logs`
  ADD COLUMN `operator_real_name` VARCHAR(64) DEFAULT NULL
  COMMENT '操作人真实姓名（冗余）' AFTER `username`;
