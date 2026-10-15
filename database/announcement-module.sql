-- 通知公告模块数据库迁移脚本（MySQL 8）
-- DB_SYNC=false 时部署前执行一次。
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(200) NOT NULL,
  `category` VARCHAR(40) NOT NULL,
  `publisher_unit` VARCHAR(150) NULL,
  `content` TEXT NOT NULL,
  `activity_at` DATETIME NULL,
  `location` VARCHAR(200) NULL,
  `participants` VARCHAR(500) NULL,
  `attachments` JSON NULL,
  `audience_type` VARCHAR(32) NOT NULL,
  `audience_association_id` BIGINT UNSIGNED NULL,
  `audience_user_ids` JSON NULL,
  `is_pinned` TINYINT NOT NULL DEFAULT 0,
  `is_important` TINYINT NOT NULL DEFAULT 0,
  `requires_attendance` TINYINT NOT NULL DEFAULT 0,
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '0草稿 1已发布 2已撤回',
  `publisher_admin_id` BIGINT UNSIGNED NULL,
  `published_at` DATETIME NULL,
  `withdrawn_at` DATETIME NULL,
  `deleted_at` DATETIME NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_announcement_status_date` (`status`, `published_at`),
  KEY `idx_announcement_category` (`category`),
  KEY `idx_announcement_scope` (`audience_association_id`, `deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `announcement_recipients` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `announcement_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `is_read` TINYINT NOT NULL DEFAULT 0,
  `read_at` DATETIME NULL,
  `attendance_status` TINYINT NULL COMMENT '1参加 2不参加',
  `responded_at` DATETIME NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_announcement_recipient` (`announcement_id`, `user_id`),
  KEY `idx_announcement_recipient_user` (`user_id`, `announcement_id`),
  CONSTRAINT `fk_announcement_recipient_announcement`
    FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_announcement_recipient_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
