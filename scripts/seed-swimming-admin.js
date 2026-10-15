/**
 * 冬泳管理者（swimming_admin）角色 + 账号 幂等种子脚本
 *
 * 用法（项目根目录）：
 *   node scripts/seed-swimming-admin.js
 *
 * 行为（幂等，可重复执行）：
 *   1. 读取 .env 数据库配置
 *   2. 创建角色 swimming_admin（冬泳管理者，冬泳协会领域最大权限）
 *   3. 创建管理员账号 swimming_admin / swimming123（bcrypt 哈希）
 *   4. 关联账号 ↔ swimming_admin 角色
 *   5. 关联 swimming_admin 角色 ↔ 所有 association:* 权限（若权限表已有）
 *
 * 权限放行逻辑见 src/common/guards/permissions.guard.ts：
 *   swimming_admin 角色 → 放行所有 association:* 权限码
 *
 * 退出码：0 成功 / 1 失败
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const ROLE_CODE = 'swimming_admin';
const ROLE_NAME = '冬泳管理者';
const USERNAME = 'swimming_admin';
const PASSWORD = 'swimming123';
const REAL_NAME = '冬泳管理者';
const BCRYPT_ROUNDS = 10;

/* ---------------- .env 解析（最小实现，不依赖 dotenv） ---------------- */
function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  const env = {};
  if (fs.existsSync(envPath)) {
    const text = fs.readFileSync(envPath, 'utf-8');
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2];
    }
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const host = env.DB_HOST || '127.0.0.1';
  const port = Number(env.DB_PORT || 3306);
  const user = env.DB_USER || 'root';
  const password = env.DB_PASSWORD || '123456';
  const database = env.DB_DATABASE || 'swimming_platform';

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: false,
  });

  console.log(`[seed-swimming-admin] 连接 ${host}:${port}/${database}`);

  try {
    /* 1. 角色（幂等：存在则更新名称，保留 id） */
    const [roleRes] = await conn.execute(
      `INSERT INTO roles (code, name, description, sort, status)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name),
                               description = VALUES(description),
                               status = VALUES(status)`,
      [ROLE_CODE, ROLE_NAME, '冬泳协会领域最大权限，可管理所有协会及会员', 4, 1],
    );
    const [[roleRow]] = await conn.execute(
      `SELECT id FROM roles WHERE code = ?`,
      [ROLE_CODE],
    );
    const roleId = roleRow.id;
    console.log(`[seed-swimming-admin] 角色 ${ROLE_CODE} id=${roleId}`);

    /* 2. 管理员账号（幂等：存在则更新密码哈希与真实姓名） */
    const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_ROUNDS);
    await conn.execute(
      `INSERT INTO admin_users (username, password_hash, real_name, status)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash),
                               real_name = VALUES(real_name),
                               status = VALUES(status)`,
      [USERNAME, passwordHash, REAL_NAME, 1],
    );
    const [[adminRow]] = await conn.execute(
      `SELECT id FROM admin_users WHERE username = ?`,
      [USERNAME],
    );
    const adminId = adminRow.id;
    console.log(`[seed-swimming-admin] 账号 ${USERNAME} id=${adminId}`);

    /* 3. 账号 ↔ 角色（幂等：INSERT IGNORE） */
    await conn.execute(
      `INSERT IGNORE INTO admin_user_roles (admin_user_id, role_id) VALUES (?, ?)`,
      [adminId, roleId],
    );
    console.log(`[seed-swimming-admin] 关联 admin_user_roles 完成`);

    /* 4. 角色 ↔ 所有 association:* 权限（幂等：INSERT IGNORE） */
    const [permRows] = await conn.execute(
      `SELECT id, code FROM permissions WHERE code LIKE 'association%'`,
    );
    if (permRows.length === 0) {
      console.log(`[seed-swimming-admin] 权限表无 association:* 权限，跳过 role_permissions（不影响放行：guard 已对 swimming_admin 放行 association:*）`);
    } else {
      for (const p of permRows) {
        await conn.execute(
          `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
          [roleId, p.id],
        );
      }
      console.log(`[seed-swimming-admin] 关联 role_permissions ${permRows.length} 条: ${permRows.map(p => p.code).join(', ')}`);
    }

    console.log('\n[seed-swimming-admin] 完成 ✅');
    console.log(`  角色: ${ROLE_CODE}（${ROLE_NAME}）`);
    console.log(`  账号: ${USERNAME} / ${PASSWORD}`);
    console.log(`  权限: association:*（冬泳协会领域最大）`);
    console.log(`  前端可见菜单: 首页 Dashboard + 冬泳协会`);
  } finally {
    await conn.end();
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error('[seed-swimming-admin] 失败:', err);
  process.exit(1);
});
