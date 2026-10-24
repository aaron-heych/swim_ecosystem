ALTER TABLE `admin_users`
  ADD COLUMN `need_change_password` TINYINT NOT NULL DEFAULT 0
  COMMENT '首次登录后是否必须修改密码';
