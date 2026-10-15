-- =====================================================
-- C 端访问量演示数据（access_stats）
-- 用法（需先启动后端让 TypeORM 自动建表，或先执行下方 CREATE TABLE）：
--   docker exec -i myapp-mysql mysql -uroot -p123456 swimming_platform < seed-access.sql
-- 或本机：
--   mysql -uroot -p123456 swimming_platform < database/seed-access.sql
--
-- 生成最近 30 天 × 8 个功能模块 的随机访问计数。
-- 重复执行会按 (module, stat_date) 唯一键覆盖更新，不会产生重复行。
-- =====================================================

CREATE TABLE IF NOT EXISTS `access_stats` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `module`     VARCHAR(32)  NOT NULL,
  `stat_date`  DATE         NOT NULL,
  `count`      INT          NOT NULL DEFAULT 0,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_access_module_date` (`module`,`stat_date`),
  KEY `idx_access_stat_date` (`stat_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 先清空旧演示数据（如需保留真实埋点，注释掉下一行）
TRUNCATE TABLE access_stats;

-- 最近 30 天（0..29），8 个模块的随机访问量
INSERT INTO access_stats (module, stat_date, count)
WITH RECURSIVE nums(d) AS (
  SELECT 0 UNION ALL SELECT d + 1 FROM nums WHERE d < 29
)
SELECT
  m.mkey,
  DATE_SUB(CURDATE(), INTERVAL n.d DAY),
  CASE m.mkey
    WHEN 'association'  THEN FLOOR(80  + RAND() * 220)  -- 冬泳协会
    WHEN 'event'        THEN FLOOR(150 + RAND() * 400)  -- 参赛报名
    WHEN 'venue'        THEN FLOOR(120 + RAND() * 320)  -- 游泳场馆
    WHEN 'coach'        THEN FLOOR(60  + RAND() * 180)  -- 教练预约
    WHEN 'circle'       THEN FLOOR(200 + RAND() * 500)  -- 游泳圈子
    WHEN 'user'         THEN FLOOR(40  + RAND() * 120)  -- 用户中心
    WHEN 'system'       THEN FLOOR(30  + RAND() * 90)   -- 系统服务
    WHEN 'notification' THEN FLOOR(20  + RAND() * 60)   -- 消息通知
  END AS cnt
FROM nums n
CROSS JOIN (
  SELECT 'association'  AS mkey UNION ALL
  SELECT 'event'        UNION ALL
  SELECT 'venue'        UNION ALL
  SELECT 'coach'        UNION ALL
  SELECT 'circle'       UNION ALL
  SELECT 'user'         UNION ALL
  SELECT 'system'       UNION ALL
  SELECT 'notification'
) AS m;

-- 校验：各模块累计
SELECT module, SUM(count) AS total, MAX(stat_date) AS latest
FROM access_stats
GROUP BY module
ORDER BY total DESC;
