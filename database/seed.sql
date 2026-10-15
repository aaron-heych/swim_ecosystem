-- =====================================================
-- 游泳生态圈 种子数据（覆盖全部 38 张表）
-- 用法: docker exec -i myapp-mysql mysql -uroot -p123456 swimming_platform < seed.sql
-- 管理员账号: admin / admin123
-- =====================================================
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE users;
TRUNCATE TABLE admin_users;
TRUNCATE TABLE roles;
TRUNCATE TABLE permissions;
TRUNCATE TABLE role_permissions;
TRUNCATE TABLE admin_user_roles;
TRUNCATE TABLE associations;
TRUNCATE TABLE association_members;
TRUNCATE TABLE venues;
TRUNCATE TABLE coaches;
TRUNCATE TABLE coach_courses;
TRUNCATE TABLE coach_schedules;
TRUNCATE TABLE coach_appointments;
TRUNCATE TABLE coach_reviews;
TRUNCATE TABLE event_sources;
TRUNCATE TABLE crawl_logs;
TRUNCATE TABLE events;
TRUNCATE TABLE event_groups;
TRUNCATE TABLE event_registrations;
TRUNCATE TABLE event_registration_items;
TRUNCATE TABLE circle_posts;
TRUNCATE TABLE card_shares;
TRUNCATE TABLE buddy_invitations;
TRUNCATE TABLE activities;
TRUNCATE TABLE activity_participants;
TRUNCATE TABLE circle_comments;
TRUNCATE TABLE circle_likes;
TRUNCATE TABLE circle_favorites;
TRUNCATE TABLE reports;
TRUNCATE TABLE oa_followers;
TRUNCATE TABLE message_templates;
TRUNCATE TABLE user_subscribes;
TRUNCATE TABLE notification_logs;
TRUNCATE TABLE banners;
TRUNCATE TABLE feedbacks;
TRUNCATE TABLE sms_codes;
TRUNCATE TABLE sys_configs;
TRUNCATE TABLE operation_logs;

-- ============ 1. users（C端用户，20 个） ============
INSERT INTO users (openid, unionid, oa_openid, phone, nickname, avatar_url, gender, real_name, birthday, province, city, district, swim_level, emergency_name, emergency_phone, bio, status, register_source, last_login_at, last_login_ip) VALUES
('oA1b2c3d4e5f6g7h8i9j0k1l', 'uU1v2w3x4y5z6a7b8c9d0e1f', 'oa_openid_001', '13800000001', '冰泳老周', NULL, 1, '周建国', '1968-03-12', '北京市', '北京市', '朝阳区', 4, '周小明', '13900000001', '冬泳二十年，每年冬至必下水', 1, 1, '2026-10-10 08:30:00', '111.196.82.10'),
('oB2c3d4e5f6g7h8i9j0k1l2m', 'uV2w3x4y5z6a7b8c9d0e1f2g', 'oa_openid_002', '13800000002', '浪花一朵朵', NULL, 2, '李雪梅', '1975-07-25', '北京市', '北京市', '海淀区', 3, '王强', '13900000002', '退休教师，游泳让我年轻', 1, 1, '2026-10-11 07:15:00', '111.196.82.11'),
('oC3d4e5f6g7h8i9j0k1l2m3n', 'uW3x4y5z6a7b8c9d0e1f2g3h', NULL, '13800000003', '浪里白条', NULL, 1, '张顺', '1988-11-02', '天津市', '天津市', '和平区', 4, NULL, NULL, '自由泳爱好者', 1, 1, '2026-10-11 19:40:00', '111.30.65.20'),
('oD4e5f6g7h8i9j0k1l2m3n4o', NULL, NULL, '13800000004', '小鱼儿', NULL, 2, '陈晓', '1995-04-18', '河北省', '石家庄市', '长安区', 2, '陈父', '13900000004', NULL, 1, 1, '2026-10-09 21:05:00', '110.242.68.5'),
('oE5f6g7h8i9j0k1l2m3n4o5p', NULL, NULL, '13800000005', '北极熊', NULL, 1, '刘冬', '1970-12-30', '辽宁省', '沈阳市', '沈河区', 4, '刘妻', '13900000005', '零下十度也照游', 1, 1, '2026-10-12 06:00:00', '113.232.90.3'),
('oF6g7h8i9j0k1l2m3n4o5p6q', NULL, NULL, '13800000006', '海豚姐姐', NULL, 2, '赵敏', '1992-09-09', '辽宁省', '大连市', '中山区', 3, NULL, NULL, NULL, 1, 1, '2026-10-08 12:22:00', '113.232.90.8'),
('oG7h8i9j0k1l2m3n4o5p6q7r', NULL, NULL, '13800000007', '泳往直前', NULL, 1, '孙志远', '1983-02-14', '山东省', '青岛市', '市南区', 3, NULL, NULL, '海边长大', 1, 1, '2026-10-12 07:45:00', '112.226.100.15'),
('oH8i9j0k1l2m3n4o5p6q7r8s', NULL, NULL, '13800000008', '碧水蓝天', NULL, 2, '王芳', '1979-06-06', '山东省', '烟台市', '芝罘区', 2, NULL, NULL, NULL, 1, 1, '2026-10-07 18:30:00', '112.226.100.22'),
('oI9j0k1l2m3n4o5p6q7r8s9t', NULL, NULL, '13800000009', '老铁冬泳', NULL, 1, '马铁柱', '1965-01-20', '吉林省', '长春市', '南关区', 4, '马小军', '13900000009', '南湖冬泳队队长', 1, 1, '2026-10-11 05:50:00', '118.89.140.7'),
('oJ0k1l2m3n4o5p6q7r8s9t0u', NULL, NULL, '13800000010', '追风少年', NULL, 1, '吴昊', '2001-08-15', '黑龙江省', '哈尔滨市', '道里区', 1, '吴母', '13900000010', '刚学蛙泳', 1, 1, '2026-10-06 20:10:00', '116.235.58.19'),
('oK1l2m3n4o5p6q7r8s9t0u1v', NULL, NULL, NULL, '教练刘海', NULL, 1, '刘海', '1985-05-05', '北京市', '北京市', '朝阳区', 4, NULL, NULL, '国家二级游泳运动员', 1, 1, '2026-10-12 09:00:00', '111.196.82.30'),
('oL2m3n4o5p6q7r8s9t0u1v2w', NULL, NULL, NULL, '教练苏珊', NULL, 2, '苏珊', '1990-10-10', '北京市', '北京市', '海淀区', 4, NULL, NULL, '八年少儿游泳教学经验', 1, 1, '2026-10-12 09:20:00', '111.196.82.31'),
('oM3n4o5p6q7r8s9t0u1v2w3x', NULL, NULL, NULL, '教练老钱', NULL, 1, '钱进', '1978-03-03', '天津市', '天津市', '南开区', 4, NULL, NULL, NULL, 1, 1, '2026-10-12 09:40:00', '111.30.65.40'),
('oN4o5p6q7r8s9t0u1v2w3x4y', NULL, NULL, '13800000014', '清晨第一泳', NULL, 1, '郑清晨', '1987-07-07', '河北省', '秦皇岛市', '海港区', 3, NULL, NULL, NULL, 1, 1, '2026-10-05 06:30:00', '110.242.68.50'),
('oO5p6q7r8s9t0u1v2w3x4y5z', NULL, NULL, '13800000015', '冬泳宝妈', NULL, 2, '冯丽丽', '1986-11-11', '北京市', '北京市', '丰台区', 3, '冯先生', '13900000015', NULL, 1, 1, '2026-10-04 21:00:00', '111.196.82.55'),
('oP6q7r8s9t0u1v2w3x4y5z6a', NULL, NULL, NULL, '孤泳者', NULL, 1, '许孤', '1993-09-23', '山西省', '太原市', '小店区', 2, NULL, NULL, NULL, 1, 1, '2026-10-03 22:15:00', '113.200.60.8'),
('oQ7r8s9t0u1v2w3x4y5z6a7b', NULL, NULL, NULL, '水中月', NULL, 2, '孟月', '1998-01-01', '内蒙古', '呼和浩特市', '新城区', 1, NULL, NULL, NULL, 1, 1, '2026-10-02 19:00:00', '116.135.90.12'),
('oR8s9t0u1v2w3x4y5z6a7b8c', NULL, NULL, NULL, '老骥伏枥', NULL, 1, '曹骥', '1958-05-20', '北京市', '北京市', '西城区', 4, '曹儿', '13900000018', '六十八岁，坚持冬泳十五年', 1, 1, '2026-10-12 06:10:00', '111.196.82.60'),
('oS9t0u1v2w3x4y5z6a7b8c9d', NULL, NULL, NULL, '小飞鱼', NULL, 1, '路飞', '2003-04-04', '北京市', '北京市', '东城区', 2, NULL, NULL, '大学生游泳社成员', 1, 1, '2026-10-01 16:40:00', '111.196.82.65'),
('oT0u1v2w3x4y5z6a7b8c9d0e', NULL, NULL, NULL, '被封号的鱼', NULL, 1, '违规用户', '1990-01-01', '北京市', '北京市', '朝阳区', 0, NULL, NULL, NULL, 0, 1, '2026-09-01 10:00:00', '111.196.82.70');

-- ============ 2. admin_users（3 个管理员）密码均为 admin123 ============
INSERT INTO admin_users (username, password_hash, real_name, phone, email, status, last_login_at, last_login_ip) VALUES
('admin',   '$2a$10$KRbOW0sXfPU4EO9BSLKw3ej61AdNYQNnD25GZ9M1Kz16wWolZIRwy', '系统管理员', '13700000001', 'admin@swim.com', 1, '2026-10-12 09:00:00', '10.0.0.1'),
('operator','$2a$10$KRbOW0sXfPU4EO9BSLKw3ej61AdNYQNnD25GZ9M1Kz16wWolZIRwy', '运营小王', '13700000002', 'op@swim.com', 1, '2026-10-11 15:30:00', '10.0.0.2'),
('auditor', '$2a$10$KRbOW0sXfPU4EO9BSLKw3ej61AdNYQNnD25GZ9M1Kz16wWolZIRwy', '审核小李', '13700000003', 'audit@swim.com', 1, '2026-10-10 11:00:00', '10.0.0.3');

-- ============ 3. roles ============
INSERT INTO roles (code, name, description, sort, status) VALUES
('super_admin', '超级管理员', '拥有全部权限', 1, 1),
('operator', '运营人员', '内容与运营配置管理', 2, 1),
('auditor', '审核人员', '协会/赛事/帖子/教练审核', 3, 1);

-- ============ 4. permissions ============
INSERT INTO permissions (parent_id, type, code, name, path, component, icon, sort, status) VALUES
(0, 1, 'dashboard', '工作台', '/dashboard', 'dashboard/index', 'odometer', 1, 1),
(0, 1, 'user:manage', '用户管理', '/user', 'user/index', 'user', 2, 1),
(2, 2, 'user:list', '用户列表', NULL, NULL, NULL, 1, 1),
(2, 2, 'user:status', '禁用/启用用户', NULL, NULL, NULL, 2, 1),
(0, 1, 'rbac:manage', '权限管理', '/rbac', 'rbac/index', 'lock', 3, 1),
(5, 2, 'rbac:role', '角色管理', NULL, NULL, NULL, 1, 1),
(5, 2, 'rbac:permission', '权限分配', NULL, NULL, NULL, 2, 1),
(0, 1, 'association:manage', '协会管理', '/association', 'association/index', 'office-building', 4, 1),
(8, 2, 'association:audit', '协会审核', NULL, NULL, NULL, 1, 1),
(8, 2, 'association:member:audit', '会员审核', NULL, NULL, NULL, 2, 1),
(0, 1, 'venue:manage', '场馆管理', '/venue', 'venue/index', 'location', 5, 1),
(11, 2, 'coach:audit', '教练审核', NULL, NULL, NULL, 1, 1),
(0, 1, 'event:manage', '赛事管理', '/event', 'event/index', 'trophy', 6, 1),
(13, 2, 'event:create', '创建赛事', NULL, NULL, NULL, 1, 1),
(13, 2, 'event:audit', '赛事审核', NULL, NULL, NULL, 2, 1),
(13, 2, 'event:crawl:trigger', '手动抓取', NULL, NULL, NULL, 3, 1),
(0, 1, 'circle:manage', '圈子管理', '/circle', 'circle/index', 'chat-dot-round', 7, 1),
(17, 2, 'circle:audit', '帖子审核', NULL, NULL, NULL, 1, 1),
(17, 2, 'report:handle', '举报处理', NULL, NULL, NULL, 2, 1),
(0, 1, 'notification:manage', '消息通知', '/notification', 'notification/index', 'bell', 8, 1),
(20, 2, 'notification:send', '发送通知', NULL, NULL, NULL, 2, 1),
(0, 1, 'system:manage', '系统设置', '/system', 'system/index', 'setting', 9, 1),
(22, 2, 'system:banner:create', 'Banner管理', NULL, NULL, NULL, 1, 1),
(22, 2, 'system:feedback:reply', '反馈回复', NULL, NULL, NULL, 2, 1),
(22, 2, 'system:config:create', '配置管理', NULL, NULL, NULL, 3, 1);

-- ============ 5. role_permissions ============
INSERT INTO role_permissions (role_id, permission_id) SELECT 1, id FROM permissions;
INSERT INTO role_permissions (role_id, permission_id) VALUES
(2,1),(2,8),(2,11),(2,13),(2,14),(2,17),(2,20),(2,21),(2,22),(2,23),(2,24);
INSERT INTO role_permissions (role_id, permission_id) VALUES
(3,1),(3,8),(3,9),(3,10),(3,11),(3,12),(3,13),(3,15),(3,17),(3,18),(3,19);

-- ============ 6. admin_user_roles ============
INSERT INTO admin_user_roles (admin_user_id, role_id) VALUES (1,1),(2,2),(3,3);

-- ============ 7. associations（8 个协会） ============
INSERT INTO associations (name, short_name, logo_url, cover_url, province, city, district, address, longitude, latitude, contact_name, contact_phone, wechat, coach, establish_date, intro, member_count, audit_status, audit_remark, auditor_id, audited_at, status, creator_id) VALUES
('北京冬泳协会', '北京冬泳', NULL, NULL, '北京市', '北京市', '朝阳区', '朝阳公园路1号', 116.478000, 39.952000, '周建国', '13800000001', 'bjdyxh', '周建国', '2005-12-01', '北京市历史最悠久的冬泳组织，会员三千余人，每年举办冬至冰泳活动。', 6, 1, NULL, 1, '2026-09-01 10:00:00', 1, 1),
('什刹海冬泳队', '什刹海', NULL, NULL, '北京市', '北京市', '西城区', '什刹海后海北沿', 116.382000, 39.943000, '曹骥', '13800000018', 'schdy', '刘海', '2010-01-15', '以什刹海为基地的民间冬泳队伍，欢迎各年龄段泳友加入。', 3, 1, NULL, 1, '2026-09-02 10:00:00', 1, 18),
('天津海河冬泳协会', '海河冬泳', NULL, NULL, '天津市', '天津市', '和平区', '海河东路15号', 117.210000, 39.133000, '张顺', '13800000003', 'tjhhdy', '钱进', '2008-11-20', '海河沿线冬泳爱好者之家。', 2, 1, NULL, 1, '2026-09-03 10:00:00', 1, 3),
('青岛栈桥冬泳俱乐部', '栈桥冬泳', NULL, NULL, '山东省', '青岛市', '市南区', '太平路12号', 120.320000, 36.060000, '孙志远', '13800000007', 'qdzqdy', '孙志远', '2012-06-08', '海水冬泳特色俱乐部，常年在栈桥海域活动。', 2, 1, NULL, 1, '2026-09-04 10:00:00', 1, 7),
('长春南湖冬泳协会', '南湖冬泳', NULL, NULL, '吉林省', '长春市', '南关区', '南湖大路2838号', 125.323000, 43.860000, '马铁柱', '13800000009', 'ccnhdy', '马铁柱', '2015-01-01', '东北三省知名冬泳组织，破冰游泳是我们的传统。', 2, 1, NULL, 1, '2026-09-05 10:00:00', 1, 9),
('沈阳浑河冬泳队', '浑河冬泳', NULL, NULL, '辽宁省', '沈阳市', '沈河区', '浑河北岸健身带', 123.431000, 41.805000, '刘冬', '13800000005', 'syhhdy', NULL, '2018-03-10', '年轻有活力的冬泳队伍。', 1, 0, NULL, NULL, NULL, 1, 5),
('大连星海湾冬泳协会', '星海湾', NULL, NULL, '辽宁省', '大连市', '中山区', '星海湾浴场', 121.614000, 38.914000, '赵敏', '13800000006', 'dlxwh', '赵敏', '2016-07-22', NULL, 1, 2, '资料不全，请补充场地证明后重新提交', 1, '2026-09-06 10:00:00', 1, 6),
('石家庄滹沱河冬泳队', '滹沱河', NULL, NULL, '河北省', '石家庄市', '长安区', '滹沱河生态区', 114.540000, 38.050000, '陈晓', '13800000004', NULL, NULL, '2020-09-09', NULL, 0, 0, NULL, NULL, NULL, 0, 4);

-- ============ 8. association_members ============
-- 保险列：status=1 已通过会员投保一年期；其余状态未投保
INSERT INTO association_members (association_id, user_id, member_no, role, real_name, phone, emergency_name, emergency_phone, health_declaration, apply_remark, status, reviewer_id, reviewed_at, joined_at, has_insurance, buyed_insurance_at, insurance_start_at, insurance_end_at) VALUES
(1, 1, 'BJDY-0001', 1, '周建国', '13800000001', '周小明', '13900000001', '{"healthy":true,"heartDisease":false}', '发起人', 1, 1, '2026-09-01 10:00:00', '2026-09-01 10:00:00', 1, '2026-09-01 10:30:00', '2026-09-01 00:00:00', '2027-08-31 00:00:00'),
(1, 2, 'BJDY-0002', 2, '李雪梅', '13800000002', '王强', '13900000002', '{"healthy":true}', NULL, 1, 1, '2026-09-02 10:00:00', '2026-09-02 10:00:00', 1, '2026-09-02 10:30:00', '2026-09-02 00:00:00', '2027-09-01 00:00:00'),
(1, 3, 'BJDY-0003', 3, '张顺', '13800000003', NULL, NULL, '{"healthy":true}', NULL, 1, 1, '2026-09-03 10:00:00', '2026-09-03 10:00:00', 0, NULL, NULL, NULL),
(1, 15, 'BJDY-0004', 3, '冯丽丽', '13800000015', '冯先生', '13900000015', '{"healthy":true}', '希望参加每周日活动', 1, 2, '2026-09-10 10:00:00', '2026-09-10 10:00:00', 0, NULL, NULL, NULL),
(1, 18, 'BJDY-0005', 3, '曹骥', '13800000018', '曹儿', '13900000018', '{"healthy":true,"hypertension":true}', NULL, 1, 1, '2026-09-05 10:00:00', '2026-09-05 10:00:00', 1, '2026-09-05 10:30:00', '2026-09-05 00:00:00', '2027-09-04 00:00:00'),
(1, 19, 'BJDY-0006', 3, '路飞', '13800000019', NULL, NULL, '{"healthy":true}', '大学生，想学习冬泳', 1, 2, '2026-09-20 10:00:00', '2026-09-20 10:00:00', 0, NULL, NULL, NULL),
(1, 14, NULL, 3, '郑清晨', '13800000014', NULL, NULL, '{"healthy":true}', '老泳友推荐', 0, NULL, NULL, NULL, 0, NULL, NULL, NULL),
(2, 18, 'SCH-0001', 1, '曹骥', '13800000018', '曹儿', '13900000018', '{"healthy":true}', NULL, 1, 1, '2026-09-05 11:00:00', '2026-09-05 11:00:00', 1, '2026-09-05 11:30:00', '2026-09-05 00:00:00', '2027-09-04 00:00:00'),
(2, 1, 'SCH-0002', 3, '周建国', '13800000001', '周小明', '13900000001', '{"healthy":true}', NULL, 1, 18, '2026-09-06 11:00:00', '2026-09-06 11:00:00', 0, NULL, NULL, NULL),
(2, 2, 'SCH-0003', 3, '李雪梅', '13800000002', NULL, NULL, '{"healthy":true}', NULL, 1, 18, '2026-09-07 11:00:00', '2026-09-07 11:00:00', 0, NULL, NULL, NULL),
(3, 3, 'HH-0001', 1, '张顺', '13800000003', NULL, NULL, '{"healthy":true}', NULL, 1, 3, '2026-09-03 12:00:00', '2026-09-03 12:00:00', 1, '2026-09-03 12:30:00', '2026-09-03 00:00:00', '2027-09-02 00:00:00'),
(3, 13, 'HH-0002', 3, '钱进', '13800000013', NULL, NULL, '{"healthy":true}', NULL, 1, 3, '2026-09-04 12:00:00', '2026-09-04 12:00:00', 0, NULL, NULL, NULL),
(4, 7, 'QDZQ-0001', 1, '孙志远', '13800000007', NULL, NULL, '{"healthy":true}', NULL, 1, 7, '2026-09-04 13:00:00', '2026-09-04 13:00:00', 1, '2026-09-04 13:30:00', '2026-09-04 00:00:00', '2027-09-03 00:00:00'),
(4, 8, 'QDZQ-0002', 3, '王芳', '13800000008', NULL, NULL, '{"healthy":true}', NULL, 1, 7, '2026-09-05 13:00:00', '2026-09-05 13:00:00', 0, NULL, NULL, NULL),
(5, 9, 'NH-0001', 1, '马铁柱', '13800000009', '马小军', '13900000009', '{"healthy":true}', NULL, 1, 9, '2026-09-05 14:00:00', '2026-09-05 14:00:00', 1, '2026-09-05 14:30:00', '2026-09-05 00:00:00', '2027-09-04 00:00:00'),
(5, 10, 'NH-0002', 3, '吴昊', '13800000010', '吴母', '13900000010', '{"healthy":true}', '想挑战一下自己', 1, 9, '2026-09-15 14:00:00', '2026-09-15 14:00:00', 0, NULL, NULL, NULL),
(6, 5, NULL, 1, '刘冬', '13800000005', '刘妻', '13900000005', '{"healthy":true}', NULL, 0, NULL, NULL, NULL, 0, NULL, NULL, NULL),
(2, 10, NULL, 3, '吴昊', '13800000010', NULL, NULL, '{"healthy":true}', NULL, 2, 18, '2026-09-08 10:00:00', NULL, 0, NULL, NULL, NULL),
(1, 16, 'BJDY-0007', 3, '许孤', '13800000016', NULL, NULL, '{"healthy":true}', NULL, 3, 2, '2026-09-25 10:00:00', '2026-09-25 10:00:00', 0, NULL, NULL, NULL),
(1, 17, 'BJDY-0008', 3, '孟月', '13800000017', NULL, NULL, '{"healthy":true}', NULL, 4, 2, '2026-09-26 10:00:00', '2026-09-26 10:00:00', 0, NULL, NULL, NULL);

-- ============ 9. venues（10 个场馆） ============
INSERT INTO venues (name, type, cover_url, images, province, city, district, address, longitude, latitude, phone, business_hours, pool_length_m, lane_count, water_temp_min, water_temp_max, depth_min, depth_max, facilities, tags, price_min, price_max, intro, rating, rating_count, audit_status, status, creator_id) VALUES
('国家游泳中心（水立方）', 1, NULL, '[]', '北京市', '北京市', '朝阳区', '天辰东路11号', 116.390000, 39.992000, '010-84370112', '09:00-21:30', 50.0, 10, 26.0, 28.0, 1.2, 3.0, '["淋浴","储物柜","停车场","吹风机"]', '["奥运场馆","标准池"]', 60.00, 80.00, '北京奥运会游泳比赛场馆，水质一流。', 4.8, 326, 1, 1, 1),
('朝阳公园冬泳基地', 4, NULL, '[]', '北京市', '北京市', '朝阳区', '朝阳公园南湖', 116.479000, 39.951000, '010-65065409', '06:00-10:00（冬季）', NULL, NULL, 0.0, 8.0, 1.5, 3.5, '["更衣室","救生员"]', '["冬泳圣地","公开水域"]', 10.00, 20.00, '北京冬泳爱好者聚集地，冬季水温0-4℃。', 4.6, 158, 1, 1, 1),
('什刹海后海冬泳区', 4, NULL, '[]', '北京市', '北京市', '西城区', '后海北沿', 116.383000, 39.944000, NULL, '全天（冬季破冰）', NULL, NULL, 0.0, 6.0, 1.2, 2.5, '["简易更衣棚"]', '["传统冬泳","免费"]', 0.00, 0.00, '老北京冬泳传统场地，免费下水。', 4.5, 203, 1, 1, 1),
('海淀游泳馆', 1, NULL, '[]', '北京市', '北京市', '海淀区', '颐和园路12号', 116.298000, 39.999000, '010-62640505', '06:30-22:00', 50.0, 8, 27.0, 28.5, 1.4, 2.0, '["淋浴","储物柜","汗蒸"]', '["教学池","比赛池"]', 40.00, 60.00, NULL, 4.4, 89, 1, 1, 1),
('天津海河冬泳码头', 4, NULL, '[]', '天津市', '天津市', '和平区', '海河亲水平台', 117.211000, 39.134000, NULL, '06:00-09:00（冬季）', NULL, NULL, 1.0, 10.0, 1.5, 4.0, '["救生艇"]', '["海河","公开水域"]', 0.00, 0.00, NULL, 4.3, 67, 1, 1, 1),
('青岛栈桥海水浴场', 4, NULL, '[]', '山东省', '青岛市', '市南区', '太平路14号', 120.321000, 36.061000, '0532-82884548', '全天', NULL, NULL, 5.0, 18.0, 1.0, 3.0, '["冲脚池","更衣帐篷"]', '["海水","冬泳"]', 0.00, 0.00, NULL, 4.5, 145, 1, 1, 1),
('长春市工人体育馆游泳馆', 1, NULL, '[]', '吉林省', '长春市', '南关区', '人民大街2838号', 125.324000, 43.861000, '0431-88901234', '09:00-20:30', 25.0, 6, 27.0, 29.0, 1.2, 1.8, '["淋浴","储物柜"]', '["恒温","性价比高"]', 25.00, 35.00, NULL, 4.2, 54, 1, 1, 1),
('沈阳奥体中心游泳馆', 1, NULL, '[]', '辽宁省', '沈阳市', '浑南区', '浑南中路28号', 123.458000, 41.752000, '024-23895566', '07:00-21:00', 50.0, 10, 26.5, 28.0, 1.2, 3.0, '["淋浴","储物柜","停车场","跳水台"]', '["标准池","赛事级"]', 45.00, 70.00, NULL, 4.7, 112, 1, 1, 1),
('大连星海湾浴场', 4, NULL, '[]', '辽宁省', '大连市', '沙河口区', '星海湾畔', 121.615000, 38.915000, NULL, '全天', NULL, NULL, 6.0, 20.0, 1.0, 4.0, '["淋浴","救生员"]', '["海水","风景好"]', 0.00, 30.00, NULL, 4.4, 98, 1, 1, 1),
('石家庄全民健身中心游泳馆', 1, NULL, '[]', '河北省', '石家庄市', '长安区', '中山东路338号', 114.541000, 38.051000, '0311-86071234', '08:30-21:30', 25.0, 5, 27.0, 28.0, 1.2, 1.8, '["淋浴","储物柜"]', '["恒温","新手友好"]', 30.00, 45.00, NULL, 4.0, 23, 0, 1, 1);

-- ============ 10. coaches（6 名教练） ============
INSERT INTO coaches (user_id, name, avatar_url, gender, phone, wechat, venue_id, title, cert_images, strokes, teach_targets, experience_years, intro, lesson_price, rating, rating_count, student_count, audit_status, audit_remark, status, sort) VALUES
(11, '刘海', NULL, 1, '13600000011', 'coach_liuhai', 1, '国家二级运动员 / 高级教练', '[]', '["自由泳","蝶泳","仰泳"]', '["成人提高","竞技训练"]', 12, '前省队队员，主攻成人技术提升与赛前训练。', 300.00, 4.9, 58, 120, 1, NULL, 1, 1),
(12, '苏珊', NULL, 2, '13600000012', 'coach_susan', 4, '少儿游泳高级教练', '[]', '["蛙泳","自由泳"]', '["少儿启蒙","中考游泳"]', 8, '八年少儿教学经验，耐心细致，深受家长好评。', 260.00, 4.8, 76, 200, 1, NULL, 1, 2),
(13, '钱进', NULL, 1, '13600000013', 'coach_qianjin', 7, '社会体育指导员（游泳）', '[]', '["蛙泳","自由泳"]', '["成人零基础","中老年"]', 15, '专攻成人零基础入门，水中恐惧感消除经验丰富。', 180.00, 4.6, 42, 150, 1, NULL, 1, 3),
(1, '周建国', NULL, 1, '13800000001', 'bjdyxh', 2, '冬泳指导教练', '[]', '["冬泳适应","公开水域"]', '["冬泳入门"]', 20, '二十年冬泳经验，带你安全完成第一次冰泳。', 150.00, 5.0, 31, 80, 1, NULL, 1, 4),
(6, '赵敏', NULL, 2, '13800000006', 'coach_zhaomin', 9, '游泳救生员 / 教练', '[]', '["蛙泳","自由泳","仰泳"]', '["成人","亲子"]', 6, NULL, 220.00, 4.5, 18, 45, 0, NULL, 1, 5),
(3, '张顺', NULL, 1, '13800000003', NULL, 5, '退役运动员', '[]', '["全泳姿"]', '["竞技训练"]', 10, NULL, 350.00, 0.0, 0, 0, 2, '证书照片模糊，请重新上传', 0, 6);

-- ============ 11. coach_courses ============
INSERT INTO coach_courses (coach_id, name, type, sessions, duration_min, price, original_price, description, status) VALUES
(1, '自由泳技术提高一对一', 1, 1, 60, 300.00, 380.00, '针对有基础的成人，纠正动作、提升效率', 1),
(1, '赛前强化课时包（10节）', 4, 10, 60, 2800.00, 3000.00, '比赛专项训练，含出发转身技术', 1),
(2, '少儿游泳启蒙一对多', 2, 1, 60, 160.00, 200.00, '4-6人小班，适合4-8岁零基础儿童', 1),
(2, '中考游泳冲刺小班课', 3, 1, 90, 200.00, 260.00, '针对中考游泳测试的专项训练', 1),
(3, '成人零基础蛙泳入门', 1, 1, 60, 180.00, NULL, '从怕水到独立游25米', 1),
(3, '中老年康复游泳课', 1, 1, 45, 150.00, NULL, '低强度水中康复训练', 1),
(4, '冬泳安全入门体验课', 1, 1, 90, 150.00, 200.00, '冬泳常识、入水适应、安全要点全讲解', 1),
(4, '公开水域游泳技巧课', 1, 1, 90, 200.00, NULL, '公开水域与泳池完全不同的技巧体系', 1),
(5, '亲子游泳课', 2, 1, 60, 260.00, NULL, '一大一小亲子同游', 1);

-- ============ 12. coach_schedules ============
INSERT INTO coach_schedules (coach_id, course_id, venue_id, work_date, start_time, end_time, status) VALUES
(1, 1, 1, '2026-10-15', '09:00:00', '10:00:00', 1),
(1, 1, 1, '2026-10-15', '10:00:00', '11:00:00', 0),
(1, 1, 1, '2026-10-16', '14:00:00', '15:00:00', 0),
(1, 2, 1, '2026-10-17', '09:00:00', '10:00:00', 0),
(2, 3, 4, '2026-10-15', '16:00:00', '17:00:00', 1),
(2, 3, 4, '2026-10-16', '16:00:00', '17:00:00', 0),
(2, 4, 4, '2026-10-17', '15:00:00', '16:30:00', 0),
(3, 5, 7, '2026-10-15', '10:00:00', '11:00:00', 0),
(3, 6, 7, '2026-10-16', '09:00:00', '09:45:00', 0),
(4, 7, 2, '2026-10-18', '07:00:00', '08:30:00', 0),
(4, 8, 3, '2026-10-19', '07:00:00', '08:30:00', 0),
(5, 9, 9, '2026-10-15', '18:00:00', '19:00:00', 3);

-- ============ 13. coach_appointments ============
INSERT INTO coach_appointments (order_no, user_id, coach_id, course_id, schedule_id, venue_id, appointment_date, start_time, end_time, price, contact_name, contact_phone, status, pay_status, pay_time, transaction_id, remark) VALUES
('APT202610100001', 4, 1, 1, 1, 1, '2026-10-15', '09:00:00', '10:00:00', 300.00, '陈晓', '13800000004', 1, 1, '2026-10-10 14:00:00', 'WX20261010140000', '第一次课，请多关照'),
('APT202610100002', 10, 2, 3, 5, 4, '2026-10-15', '16:00:00', '17:00:00', 160.00, '吴母', '13900000010', 1, 1, '2026-10-10 15:00:00', 'WX20261010150000', '孩子6岁，零基础'),
('APT202610110003', 14, 1, 1, 2, 1, '2026-10-15', '10:00:00', '11:00:00', 300.00, '郑清晨', '13800000014', 0, 0, NULL, NULL, NULL),
('APT202610080004', 8, 3, 5, NULL, 7, '2026-10-12', '10:00:00', '11:00:00', 180.00, '王芳', '13800000008', 3, 1, '2026-10-08 10:00:00', 'WX20261008100000', NULL),
('APT202610050005', 16, 2, 4, NULL, 4, '2026-10-08', '15:00:00', '16:30:00', 200.00, '许孤', '13800000016', 2, 2, NULL, NULL, NULL),
('APT202610120006', 19, 1, 2, 4, 1, '2026-10-17', '09:00:00', '10:00:00', 280.00, '路飞', '13800000019', 0, 0, NULL, NULL, '想报名校比赛');

-- ============ 14. coach_reviews ============
INSERT INTO coach_reviews (appointment_id, coach_id, user_id, score_professional, score_attitude, score_punctual, content, reply, replied_at) VALUES
(4, 3, 8, 5, 5, 5, '钱教练特别有耐心，我这种完全怕水的人现在也敢自己漂了。', '谢谢认可，继续加油！', '2026-10-13 09:00:00'),
(5, 2, 16, 4, 5, 5, '苏教练对孩子很有办法，孩子上完课一直念叨还要来。', NULL, NULL),
(1, 1, 4, 5, 4, 5, '刘教练一眼看出我划水效率低的问题，一节课就有明显改善。', NULL, NULL);

-- ============ 15. event_sources ============
INSERT INTO event_sources (name, website, list_url, parser_type, parser_config, cron_expr, enabled, last_crawled_at, last_status, remark) VALUES
('中国游泳协会官网', 'https://www.swimming.org.cn', 'https://www.swimming.org.cn/xhgg/', 'cheerio', '{"listSelector":".news-list li","titleSelector":"a","linkAttr":"href"}', '0 */6 * * *', 1, '2026-10-12 06:00:00', 1, '官方赛事公告主要来源'),
('国家体育总局游泳中心', 'https://www.sport.gov.cn', 'https://www.sport.gov.cn/swimming/', 'puppeteer', '{"waitFor":".list"}', '0 8,20 * * *', 1, '2026-10-12 08:00:00', 1, NULL),
('北京市游泳运动协会', 'https://www.bjswim.org.cn', 'https://www.bjswim.org.cn/race', 'api', '{"api":"https://www.bjswim.org.cn/api/races"}', '0 9 * * *', 1, '2026-10-11 09:00:00', 0, '上次抓取接口超时'),
('泳者之家赛事平台', 'https://www.swimmer.cn', 'https://www.swimmer.cn/events', 'cheerio', NULL, '0 12 * * *', 0, NULL, NULL, '站点改版中，暂停抓取');

-- ============ 16. crawl_logs ============
INSERT INTO crawl_logs (source_id, trigger_type, started_at, finished_at, status, total_count, new_count, error_msg) VALUES
(1, 1, '2026-10-12 06:00:00', '2026-10-12 06:00:08', 1, 12, 2, NULL),
(2, 1, '2026-10-12 08:00:00', '2026-10-12 08:00:15', 1, 8, 1, NULL),
(3, 1, '2026-10-11 09:00:00', '2026-10-11 09:00:30', 2, 0, 0, '请求超时（30s）'),
(1, 2, '2026-10-12 10:30:00', '2026-10-12 10:30:06', 1, 12, 0, NULL);

-- ============ 17. events（10 场赛事） ============
INSERT INTO events (title, cover_url, organizer, source_id, source_url, external_id, event_type, level, province, city, district, venue_name, address, start_date, end_date, register_start, register_end, contact_phone, fee_min, fee_max, content, tags, audit_status, status, is_hot, register_count, view_count, publish_at, creator_id) VALUES
('2026全国冬泳锦标赛', NULL, '中国游泳协会', 1, 'https://www.swimming.org.cn/xhgg/2026dongyong', 'CSA-2026-DY-001', 1, 2, '黑龙江省', '哈尔滨市', '道里区', '松花江冬泳赛区', '哈尔滨市松花江畔', '2026-12-20', '2026-12-22', '2026-10-01 00:00:00', '2026-12-01 23:59:59', '0451-88888888', 100.00, 300.00, '<p>全国最高水平的冬泳赛事，设50米、100米、200米等冰泳项目。</p>', '["冬泳","全国赛","冰上游泳"]', 1, 1, 1, 156, 8901, '2026-10-01 10:00:00', 1),
('2026北京国际冬泳邀请赛', NULL, '北京市游泳运动协会', 3, 'https://www.bjswim.org.cn/race/2026int', 'BJ-2026-INT-01', 1, 4, '北京市', '北京市', '朝阳区', '朝阳公园冬泳基地', '朝阳公园南湖', '2026-12-05', '2026-12-06', '2026-10-10 00:00:00', '2026-11-25 23:59:59', '010-65000000', 80.00, 200.00, '<p>邀请国内外冬泳队伍同场竞技，设团体接力等趣味项目。</p>', '["冬泳","邀请赛","北京"]', 1, 1, 1, 89, 5670, '2026-10-10 10:00:00', 1),
('2026京津冀公开水域游泳挑战赛', NULL, '天津市游泳协会', NULL, NULL, NULL, 2, 4, '天津市', '天津市', '东丽区', '东丽湖', '东丽湖风景区', '2026-11-08', '2026-11-08', '2026-09-15 00:00:00', '2026-11-01 23:59:59', '022-24000000', 150.00, 280.00, '<p>5公里公开水域耐力挑战，京津冀泳友大联欢。</p>', '["公开水域","挑战赛"]', 1, 1, 0, 45, 3210, '2026-09-15 10:00:00', 1),
('2026青岛国际海洋节游泳赛', NULL, '青岛市体育局', NULL, NULL, NULL, 2, 3, '山东省', '青岛市', '市南区', '第一海水浴场', '市南区南海路', '2026-10-25', '2026-10-25', '2026-09-01 00:00:00', '2026-10-20 23:59:59', '0532-85000000', 60.00, 120.00, '<p>海洋节传统项目，1500米横渡海湾。</p>', '["海水","横渡"]', 1, 1, 0, 210, 6540, '2026-09-01 10:00:00', 1),
('2026沈阳浑河秋季游泳赛', NULL, '沈阳市游泳协会', NULL, NULL, NULL, 1, 4, '辽宁省', '沈阳市', '浑南区', '浑河奥林匹克公园段', '浑河北岸', '2026-10-18', '2026-10-18', '2026-09-10 00:00:00', '2026-10-12 23:59:59', '024-23890000', 50.00, 100.00, '<p>秋季浑河畅游活动，设500米、1000米两个组别。</p>', '["秋泳","浑河"]', 1, 2, 0, 78, 2100, '2026-09-10 10:00:00', 1),
('2026全国青少年游泳U系列总决赛', NULL, '中国游泳协会', 1, 'https://www.swimming.org.cn/xhgg/2026u-final', 'CSA-2026-U-FINAL', 1, 2, '北京市', '北京市', '朝阳区', '国家游泳中心', '天辰东路11号', '2026-11-14', '2026-11-16', '2026-10-05 00:00:00', '2026-11-05 23:59:59', '010-84370000', 120.00, 240.00, '<p>U8-U18各年龄组总决赛，泳池赛事。</p>', '["青少年","U系列","泳池赛"]', 1, 1, 0, 320, 12000, '2026-10-05 10:00:00', 1),
('2027元旦长春南湖破冰冬泳大会', NULL, '长春市体育总会', NULL, NULL, NULL, 1, 4, '吉林省', '长春市', '南关区', '南湖公园', '南湖大路', '2027-01-01', '2027-01-01', '2026-11-01 00:00:00', '2026-12-28 23:59:59', '0431-88900000', 30.00, 50.00, '<p>元旦破冰下水迎新年，全民参与不设名次。</p>', '["冬泳","元旦","群众性"]', 1, 1, 1, 56, 4320, '2026-10-12 10:00:00', 1),
('2026大连星海湾夜间荧光游泳赛', NULL, '大连市文旅局', NULL, NULL, NULL, 3, 5, '辽宁省', '大连市', '沙河口区', '星海湾浴场', '星海湾畔', '2026-08-20', '2026-08-20', '2026-07-01 00:00:00', '2026-08-15 23:59:59', '0411-84000000', 88.00, 128.00, '<p>夜间荧光趣味游泳活动，已圆满结束。</p>', '["夜泳","趣味"]', 1, 3, 0, 150, 9800, '2026-07-01 10:00:00', 1),
('2026石家庄滹沱河生态游泳节', NULL, '石家庄市体育局', NULL, NULL, NULL, 3, 4, '河北省', '石家庄市', '正定县', '滹沱河生态区', '滹沱河畔', '2026-11-22', '2026-11-22', '2026-10-15 00:00:00', '2026-11-15 23:59:59', '0311-86000000', 40.00, 80.00, '<p>生态游泳节，设畅游组和竞技组。</p>', '["生态","畅游"]', 0, 0, 0, 0, 320, NULL, 1),
('2026某商业机构高额奖金游泳赛', NULL, '某商业公司', NULL, NULL, NULL, 3, 5, '北京市', '北京市', '通州区', '某水上乐园', '通州区', '2026-11-01', '2026-11-01', '2026-10-01 00:00:00', '2026-10-30 23:59:59', NULL, 500.00, 500.00, '<p>高额奖金吸引报名，经核实无办赛资质。</p>', '[]', 2, 4, 0, 0, 88, NULL, 1);

-- ============ 18. event_groups ============
INSERT INTO event_groups (event_id, name, gender_limit, age_min, age_max, stroke, distance_m, fee, quota, registered_count, sort) VALUES
(1, '男子50米自由泳（青年组）', 1, 18, 39, '自由泳', 50, 100.00, 100, 42, 1),
(1, '女子50米自由泳（青年组）', 2, 18, 39, '自由泳', 50, 100.00, 100, 38, 2),
(1, '男子100米蛙泳（中年组）', 1, 40, 59, '蛙泳', 100, 120.00, 80, 35, 3),
(1, '不限性别200米混合接力', 0, 18, 70, '混合泳', 200, 300.00, 20, 8, 4),
(2, '男子50米冰泳', 1, 18, 65, '不限', 50, 80.00, 60, 30, 1),
(2, '女子50米冰泳', 2, 18, 65, '不限', 50, 80.00, 60, 25, 2),
(2, '4x25米团体接力', 0, 18, 70, '不限', 100, 200.00, 16, 9, 3),
(3, '5公里耐力挑战（男）', 1, 18, 60, '不限', 5000, 280.00, 50, 22, 1),
(3, '5公里耐力挑战（女）', 2, 18, 60, '不限', 5000, 280.00, 50, 23, 2),
(6, 'U10男子50米自由泳', 1, 8, 10, '自由泳', 50, 120.00, 64, 60, 1),
(6, 'U10女子50米自由泳', 2, 8, 10, '自由泳', 50, 120.00, 64, 55, 2),
(6, 'U14男子100米蛙泳', 1, 12, 14, '蛙泳', 100, 120.00, 64, 48, 3),
(7, '元旦破冰体验组（不限）', 0, 14, 75, '不限', 25, 30.00, 200, 56, 1);

-- ============ 19. event_registrations ============
INSERT INTO event_registrations (order_no, event_id, user_id, association_id, team_name, contact_name, contact_phone, emergency_name, emergency_phone, total_fee, pay_status, pay_time, transaction_id, status, remark) VALUES
('EVT202610110001', 1, 1, 1, '北京冬泳协会代表队', '周建国', '13800000001', '周小明', '13900000001', 220.00, 1, '2026-10-11 10:00:00', 'WX20261011100001', 1, '报两个项目'),
('EVT202610110002', 1, 2, 1, NULL, '李雪梅', '13800000002', '王强', '13900000002', 100.00, 1, '2026-10-11 11:00:00', 'WX20261011110002', 1, NULL),
('EVT202610120003', 2, 18, 2, '什刹海冬泳队', '曹骥', '13800000018', '曹儿', '13900000018', 280.00, 1, '2026-10-12 09:00:00', 'WX20261012090003', 1, NULL),
('EVT202610120004', 6, 19, NULL, NULL, '路飞', '13800000019', NULL, NULL, 120.00, 0, NULL, NULL, 0, '学生票'),
('EVT202610090005', 4, 7, 4, '栈桥冬泳俱乐部', '孙志远', '13800000007', NULL, NULL, 120.00, 1, '2026-10-09 15:00:00', 'WX20261009150005', 1, NULL),
('EVT202610080006', 5, 5, NULL, NULL, '刘冬', '13800000005', '刘妻', '13900000005', 50.00, 1, '2026-10-08 12:00:00', 'WX20261008120006', 2, '临时有事取消'),
('EVT202610120007', 7, 9, 5, '南湖冬泳协会', '马铁柱', '13800000009', '马小军', '13900000009', 60.00, 1, '2026-10-12 08:00:00', 'WX20261012080007', 1, '两人报名'),
('EVT202610120008', 1, 14, NULL, NULL, '郑清晨', '13800000014', NULL, NULL, 100.00, 2, NULL, NULL, 3, NULL);

-- ============ 20. event_registration_items ============
INSERT INTO event_registration_items (registration_id, group_id, participant_name, gender, birthday, phone, fee, status) VALUES
(1, 1, '周建国', 1, '1968-03-12', '13800000001', 100.00, 1),
(1, 3, '周建国', 1, '1968-03-12', '13800000001', 120.00, 1),
(2, 2, '李雪梅', 2, '1975-07-25', '13800000002', 100.00, 1),
(3, 5, '曹骥', 1, '1958-05-20', '13800000018', 80.00, 1),
(3, 7, '什刹海联队A组', 0, NULL, '13800000018', 200.00, 1),
(4, 10, '路飞', 1, '2003-04-04', '13800000019', 120.00, 1),
(5, 8, '孙志远', 1, '1983-02-14', '13800000007', 60.00, 1),
(5, 9, '王芳', 2, '1979-06-06', '13800000008', 60.00, 1),
(6, 8, '刘冬', 1, '1970-12-30', '13800000005', 50.00, 0),
(7, 13, '马铁柱', 1, '1965-01-20', '13800000009', 30.00, 1),
(7, 13, '吴昊', 1, '2001-08-15', '13800000010', 30.00, 1),
(8, 1, '郑清晨', 1, '1987-07-07', '13800000014', 100.00, 0);

-- ============ 21. circle_posts（12 个帖子：1代刷卡x3 2约搭子x3 3活动x3 4动态x3） ============
INSERT INTO circle_posts (user_id, type, title, content, images, venue_id, province, city, location_name, status, is_top, view_count, like_count, comment_count, favor_count) VALUES
(1, 1, '转让水立方游泳次卡（剩18次）', '水立方30次卡，还剩18次，2027年3月到期，因搬家转让，价格可刀。', '[]', 1, '北京市', '北京市', '国家游泳中心', 1, 0, 356, 23, 5, 11),
(2, 1, '海淀游泳馆季卡拼卡', '季卡不限次，找人拼单分摊，每周一三五归你。', '[]', 4, '北京市', '北京市', '海淀游泳馆', 1, 0, 189, 8, 3, 4),
(5, 1, '沈阳奥体次卡低价出', '20次卡用了3次，工作调动去外地，7折出。', '[]', 8, '辽宁省', '沈阳市', '沈阳奥体中心', 1, 0, 98, 3, 1, 2),
(3, 2, '周日早上朝阳公园约泳', '本周日早上6:30朝阳公园冬泳基地，水温4℃左右，来两个胆大的互相照应。', '[]', 2, '北京市', '北京市', '朝阳公园冬泳基地', 1, 1, 512, 45, 12, 20),
(6, 2, '大连星海湾周末晨泳搭子', '每周六日早上7点星海湾，新手可带，男女不限。', '[]', 9, '辽宁省', '大连市', '星海湾浴场', 1, 0, 234, 15, 4, 8),
(14, 2, '天津海河10月底约游', '10月25日左右水温还能下，从秦皇岛出发，有一起的吗？安全第一，必须结伴。', '[]', 5, '天津市', '天津市', '天津海河冬泳码头', 1, 0, 76, 4, 2, 3),
(1, 3, '北京冬泳协会11月集训活动', '协会定于11月15日在朝阳公园进行冬泳适应性集训，含安全讲座和分组下水，名额30人。', '[]', 2, '北京市', '北京市', '朝阳公园冬泳基地', 1, 1, 890, 67, 18, 35),
(18, 3, '什刹海冬至冰泳节（预报名）', '冬至当天传统冰泳活动，老规矩：先体检、后下水、喝姜汤。', '[]', 3, '北京市', '北京市', '什刹海后海', 1, 1, 1024, 89, 25, 48),
(9, 3, '长春南湖破冰迎新活动筹备会', '元旦破冰活动筹备会，线上线下同步，欢迎提建议。', '[]', NULL, '吉林省', '长春市', '南湖公园', 1, 0, 210, 12, 6, 7),
(4, 4, NULL, '第一次冬泳打卡！水温5℃，下水30秒，整个人通透了。感谢周老师指导。', '[]', 2, '北京市', '北京市', '朝阳公园冬泳基地', 1, 0, 445, 56, 15, 12),
(19, 4, NULL, '校游泳比赛拿了第三，从旱鸭子到领奖台用了一年，感谢教练！', '[]', 1, '北京市', '北京市', '国家游泳中心', 1, 0, 178, 34, 8, 5),
(10, 4, NULL, '哈尔滨松花江水温已经3℃了，老哥们还在坚持每天下水，佩服！', '[]', NULL, '黑龙江省', '哈尔滨市', '松花江畔', 2, 0, 56, 2, 0, 1);

-- ============ 22. card_shares ============
INSERT INTO card_shares (post_id, venue_id, card_type, total_times, remain_times, expire_date, price_type, price, trade_method, contact_wechat, status) VALUES
(1, 1, 1, 30, 18, '2027-03-31', 2, 800.00, '闲鱼或当面', 'bjdyxh', 0),
(2, 4, 2, NULL, NULL, '2027-01-15', 2, 600.00, '当面交易', 'lixuemei75', 0),
(3, 8, 1, 20, 17, '2026-12-31', 1, 35.00, '微信转账', 'sy_liudong', 1);

-- ============ 23. buddy_invitations ============
INSERT INTO buddy_invitations (post_id, venue_id, schedule_time, duration_min, gender_limit, level_requirement, people_needed, people_joined, status) VALUES
(4, 2, '2026-10-19 06:30:00', 45, 0, '有冬泳经验优先', 3, 2, 0),
(5, 9, '2026-10-18 07:00:00', 60, 0, '不限，新手可带', 5, 5, 1),
(6, 5, '2026-10-25 08:00:00', 40, 0, '必须会游泳，公开水域经验', 4, 1, 0);

-- ============ 24. activities ============
INSERT INTO activities (post_id, association_id, title, cover_url, venue_id, address, start_time, end_time, signup_deadline, max_participants, joined_count, fee, need_audit, intro, status) VALUES
(7, 1, '北京冬泳协会11月集训', NULL, 2, '朝阳公园冬泳基地', '2026-11-15 07:00:00', '2026-11-15 10:00:00', '2026-11-13 18:00:00', 30, 3, 50.00, 1, '冬泳适应性集训，含安全讲座、教练带队分组下水、热水姜汤补给。', 1),
(8, 2, '什刹海冬至冰泳节', NULL, 3, '什刹海后海北沿', '2026-12-21 08:00:00', '2026-12-21 11:00:00', '2026-12-18 18:00:00', 50, 2, 0.00, 1, '冬至传统冰泳，需提交近三月体检报告。', 1),
(9, 5, '长春南湖破冰迎新筹备会', NULL, NULL, '南湖公园会议室', '2026-11-02 14:00:00', '2026-11-02 16:00:00', '2026-11-01 12:00:00', 20, 1, 0.00, 0, '元旦活动筹备分工讨论。', 1);

-- ============ 25. activity_participants ============
INSERT INTO activity_participants (activity_id, user_id, status, signup_remark, reviewer_id, reviewed_at) VALUES
(1, 2, 1, '准时到', 1, '2026-10-12 10:00:00'),
(1, 3, 1, NULL, 1, '2026-10-12 10:05:00'),
(1, 15, 0, '第一次参加集训', NULL, NULL),
(2, 1, 1, '年年都参加', 18, '2026-10-12 11:00:00'),
(2, 19, 0, '想体验冬至冰泳', NULL, NULL),
(3, 9, 1, '我负责物料', 9, '2026-10-12 12:00:00');

-- ============ 26. circle_comments ============
INSERT INTO circle_comments (post_id, user_id, parent_id, reply_user_id, content, status) VALUES
(4, 2, 0, NULL, '周日我也去，老时间老地点！', 1),
(4, 5, 0, NULL, '4度还是有点猛，注意热身。', 1),
(4, 3, 1, 2, '带我一个，我7点前到。', 1),
(10, 1, 0, NULL, '不错！第一次能坚持30秒已经很棒了。', 1),
(10, 4, 4, 1, '谢谢周老师，下周继续！', 1),
(7, 15, 0, NULL, '报名了，请问需要自己带浮板吗？', 1),
(7, 1, 6, 15, '不用带，协会统一准备。', 1),
(1, 16, 0, NULL, '价格还能再商量吗？', 1),
(1, 1, 8, 16, '私聊，可以小刀。', 1),
(11, 11, 0, NULL, '恭喜！基本功很扎实。', 1),
(12, 5, 0, NULL, '东北老哥们确实硬核。', 1),
(12, 9, 0, NULL, '长春南湖也已经破冰了。', 1);

-- ============ 27. circle_likes ============
INSERT INTO circle_likes (user_id, target_type, target_id) VALUES
(2,1,4),(3,1,4),(5,1,4),(18,1,4),(19,1,4),
(1,1,7),(2,1,7),(3,1,7),(15,1,7),(14,1,7),
(1,1,8),(2,1,8),(4,1,8),(19,1,8),
(1,1,10),(2,1,10),(3,1,10),(18,1,10),
(4,1,11),(10,1,11),(16,1,11),
(2,2,1),(5,2,2),(1,2,4),(3,2,10);

-- ============ 28. circle_favorites ============
INSERT INTO circle_favorites (user_id, post_id) VALUES
(4,4),(14,4),(19,7),(2,8),(15,8),(8,1),(10,10),(16,5);

-- ============ 29. reports ============
INSERT INTO reports (reporter_id, target_type, target_id, reason_type, reason_detail, status, handler_id, handle_remark, handled_at) VALUES
(14, 1, 3, 2, '疑似黄牛倒卖，价格虚高且拒绝走平台担保', 0, NULL, NULL, NULL),
(8, 1, 2, 5, '卡已过期仍在出售', 1, 1, '已核实并下架帖子', '2026-10-12 15:00:00'),
(19, 2, 11, 4, '评论含人身攻击', 2, 1, '未发现违规内容，驳回', '2026-10-12 16:00:00');

-- ============ 30. oa_followers ============
INSERT INTO oa_followers (openid, unionid, nickname, gender, province, city, subscribe_status, subscribe_time, subscribe_scene, last_message_at) VALUES
('oa_openid_001', 'uU1v2w3x4y5z6a7b8c9d0e1f', '冰泳老周', 1, '北京', '北京', 1, '2026-08-01 10:00:00', 'ADD_SCENE_SEARCH', '2026-10-12 09:00:00'),
('oa_openid_002', 'uV2w3x4y5z6a7b8c9d0e1f2g', '浪花一朵朵', 2, '北京', '北京', 1, '2026-08-05 11:00:00', 'ADD_SCENE_QR_CODE', '2026-10-11 08:00:00'),
('oa_openid_003', NULL, '泳往直前', 1, '山东', '青岛', 1, '2026-09-01 12:00:00', 'ADD_SCENE_SEARCH', '2026-10-10 07:00:00'),
('oa_openid_004', NULL, '海豚姐姐', 2, '辽宁', '大连', 0, '2026-09-10 13:00:00', 'ADD_SCENE_PAID', '2026-09-20 10:00:00');

-- ============ 31. message_templates ============
INSERT INTO message_templates (code, channel, platform_template_id, name, title, example, status) VALUES
('EVENT_REGISTER_SUCCESS', 1, 'TPL_SUB_EVENT_001', '赛事报名成功通知', '报名成功提醒', '您已成功报名{{event}}，组别{{group}}', 1),
('EVENT_REGISTER_SUCCESS', 2, 'TPL_OA_EVENT_001', '赛事报名成功（公众号）', '报名成功', '{{first}}\n赛事：{{keyword1}}\n时间：{{keyword2}}\n{{remark}}', 1),
('ASSOC_AUDIT_RESULT', 1, 'TPL_SUB_ASSOC_001', '入会审核结果通知', '审核结果', '您的入会申请{{result}}', 1),
('APPOINTMENT_REMIND', 1, 'TPL_SUB_COACH_001', '课程预约提醒', '预约提醒', '您预约的{{course}}将于{{time}}开始', 1),
('APPOINTMENT_REMIND', 2, 'TPL_OA_COACH_001', '课程预约提醒（公众号）', '预约提醒', '{{first}}\n课程：{{keyword1}}\n时间：{{keyword2}}\n教练：{{keyword3}}\n{{remark}}', 1),
('SYSTEM_NOTICE', 2, 'TPL_OA_SYS_001', '系统通知（公众号）', '系统通知', '{{first}}\n{{keyword1}}\n{{remark}}', 0);

-- ============ 32. user_subscribes ============
INSERT INTO user_subscribes (user_id, template_id, channel, quota, last_accept_at) VALUES
(1, 1, 1, 5, '2026-10-11 10:00:00'),
(1, 4, 1, 3, '2026-10-11 10:00:00'),
(2, 1, 1, 2, '2026-10-11 11:00:00'),
(18, 3, 1, 1, '2026-10-12 09:00:00'),
(4, 4, 1, 0, '2026-10-10 14:00:00');

-- ============ 33. notification_logs ============
INSERT INTO notification_logs (user_id, openid, channel, template_id, template_code, title, content, data, biz_type, biz_id, status, wx_msgid, planned_at, sent_at) VALUES
(1, 'oA1b2c3d4e5f6g7h8i9j0k1l', 1, 1, 'EVENT_REGISTER_SUCCESS', '报名成功提醒', '您已成功报名2026全国冬泳锦标赛', '{"event":"2026全国冬泳锦标赛","group":"男子100米蛙泳"}', 'event_register', 1, 1, 'wxmsgid000001', '2026-10-11 10:00:05', '2026-10-11 10:00:06'),
(2, 'oB2c3d4e5f6g7h8i9j0k1l2m', 1, 1, 'EVENT_REGISTER_SUCCESS', '报名成功提醒', '您已成功报名2026全国冬泳锦标赛', '{"event":"2026全国冬泳锦标赛","group":"女子50米自由泳"}', 'event_register', 2, 1, 'wxmsgid000002', '2026-10-11 11:00:05', '2026-10-11 11:00:07'),
(4, NULL, 1, 4, 'APPOINTMENT_REMIND', '预约提醒', '您预约的自由泳技术提高一对一将于10月15日09:00开始', '{"course":"自由泳技术提高一对一","time":"2026-10-15 09:00"}', 'appointment', 1, 1, 'wxmsgid000003', '2026-10-14 20:00:00', '2026-10-14 20:00:03'),
(19, NULL, 1, 4, 'APPOINTMENT_REMIND', '预约提醒', '您预约的赛前强化课时包将于10月17日09:00开始', '{"course":"赛前强化课时包","time":"2026-10-17 09:00"}', 'appointment', 6, 2, NULL, '2026-10-16 20:00:00', NULL),
(1, 'oa_openid_001', 2, 2, 'EVENT_REGISTER_SUCCESS', '报名成功', '您报名的赛事已确认', '{"event":"2026北京国际冬泳邀请赛"}', 'event_register', 3, 1, 'oamsgid000001', '2026-10-12 09:00:05', '2026-10-12 09:00:08');

-- ============ 34. banners ============
INSERT INTO banners (title, image_url, position, link_type, link_value, sort, start_at, end_at, status) VALUES
('2026全国冬泳锦标赛火热报名中', 'https://cdn.example.com/banner/event2026dy.jpg', 'home', 2, '1', 1, '2026-10-01 00:00:00', '2026-12-01 00:00:00', 1),
('冬至冰泳节 · 什刹海不见不散', 'https://cdn.example.com/banner/dongzhi2026.jpg', 'home', 2, '2', 2, '2026-10-10 00:00:00', '2026-12-22 00:00:00', 1),
('北京冬泳协会招新', 'https://cdn.example.com/banner/bjdy.jpg', 'circle', 1, 'association:1', 3, NULL, NULL, 1),
('朝阳公园冬泳基地介绍', 'https://cdn.example.com/banner/venue2.jpg', 'venue', 3, '2', 4, NULL, NULL, 1),
('双11游泳装备特惠（外链）', 'https://cdn.example.com/banner/sale1111.jpg', 'home', 4, 'https://example.com/sale', 5, '2026-11-01 00:00:00', '2026-11-12 00:00:00', 0);

-- ============ 35. feedbacks ============
INSERT INTO feedbacks (user_id, type, content, contact, status, reply, reply_by, replied_at) VALUES
(4, 1, '希望赛事列表增加按距离筛选功能，想找离家近的。', '13800000004', 1, '好建议，已列入下个版本迭代计划。', 2, '2026-10-11 10:00:00'),
(10, 2, '小程序在红米手机上打开圈子图片加载很慢。', NULL, 0, NULL, NULL, NULL),
(16, 3, '举报某帖子疑似诈骗，平台处理很及时，感谢！', '13800000016', 1, '感谢反馈，我们会持续加强审核。', 2, '2026-10-12 11:00:00'),
(19, 4, '建议增加校园专区板块。', NULL, 0, NULL, NULL, NULL);

-- ============ 36. sms_codes ============
INSERT INTO sms_codes (phone, scene, code_hash, ip, used, expires_at) VALUES
('13800000004', 'bind', '$2a$10$fakehashfakehashfakehashfakehashfakehash0001', '110.242.68.5', 1, '2026-10-10 14:05:00'),
('13800000014', 'login', '$2a$10$fakehashfakehashfakehashfakehashfakehash0002', '110.242.68.50', 0, '2026-10-12 18:05:00'),
('13700000099', 'change_phone', '$2a$10$fakehashfakehashfakehashfakehashfakehash0003', '111.196.82.99', 0, '2026-10-01 10:05:00');

-- ============ 37. sys_configs ============
INSERT INTO sys_configs (config_group, config_key, config_value, value_type, remark) VALUES
('site', 'site_name', '游泳生态圈', 'string', '站点名称'),
('site', 'contact_service', '400-000-0000', 'string', '客服电话'),
('circle', 'post_need_audit', 'true', 'boolean', '帖子发布是否需要审核'),
('circle', 'post_max_images', '9', 'number', '帖子最多上传图片数'),
('event', 'crawl_enabled', 'true', 'boolean', '赛事抓取总开关'),
('event', 'register_max_items', '3', 'number', '单次报名最多选择组别数'),
('wx', 'subscribe_quota_max', '10', 'number', '用户订阅消息配额上限'),
('venue', 'appointment_cancel_hours', '24', 'number', '预约开课前多少小时可免费取消'),
('risk', 'report_auto_hide_count', '5', 'number', '同一目标被举报N次自动下架'),
('share', 'share_poster_config', '{"bg":"blue","logo":"top-left"}', 'json', '分享海报配置');

-- ============ 38. operation_logs ============
INSERT INTO operation_logs (admin_id, username, module, action, request_method, request_url, ip, user_agent, status) VALUES
(1, 'admin', 'event', '审核通过赛事《2026全国冬泳锦标赛》', 'PUT', '/api/admin/event/1/audit', '10.0.0.1', 'Mozilla/5.0', 1),
(1, 'admin', 'association', '审核通过北京冬泳协会', 'PUT', '/api/admin/association/1/audit', '10.0.0.1', 'Mozilla/5.0', 1),
(2, 'operator', 'system', '新增Banner：全国冬泳锦标赛', 'POST', '/api/admin/system/banner', '10.0.0.2', 'Mozilla/5.0', 1),
(3, 'auditor', 'circle', '审核帖子 id=12 驳回', 'PUT', '/api/admin/circle/post/12/audit', '10.0.0.3', 'Mozilla/5.0', 1),
(3, 'auditor', 'venue', '审核教练张顺驳回', 'PUT', '/api/admin/coach/6/audit', '10.0.0.3', 'Mozilla/5.0', 1),
(2, 'operator', 'notification', '手动发送预约提醒', 'POST', '/api/admin/notification/send', '10.0.0.2', 'Mozilla/5.0', 0);

SET FOREIGN_KEY_CHECKS = 1;
