/**
 * 行政区划（省/市/区县）初始化脚本
 *
 * 数据源：modood/Administrative-divisions-of-China（国家统计局编码）
 *   https://raw.githubusercontent.com/modood/Administrative-divisions-of-China/master/dist/pca-code.json
 *   结构：[{ code:2位, name, children:[{ code:4位, name, children:[{ code:6位, name }]}] }]
 *
 * 用法（项目根目录）：
 *   node scripts/seed-regions.js
 *   npm run seed:regions
 *
 * 行为：
 *   1. 读取 .env 数据库配置（缺省回退到 127.0.0.1/root/123456/swimming_platform）
 *   2. CREATE TABLE IF NOT EXISTS regions（不依赖后端 DB_SYNC 自动建表）
 *   3. 读取行政区划数据：优先用本地缓存 database/regions.json；
 *      缓存不存在时从远端拉取并写入缓存，后续可完全离线运行
 *   4. TRUNCATE regions（幂等，可重复执行）
 *   5. 按省 → 市 → 区县 顺序批量入库，自维护 parent_id 与 sort
 *   6. 输出各层级入库数量
 *
 * 退出码：0 成功 / 1 失败
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DATA_URL =
  'https://raw.githubusercontent.com/modood/Administrative-divisions-of-China/master/dist/pca-code.json';
const CACHE_FILE = path.resolve(__dirname, '..', 'database', 'regions.json');
const BATCH_SIZE = 500;

/* ---------------- .env 解析（最小实现，不依赖 dotenv） ---------------- */
function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  const env = {};
  if (fs.existsSync(envPath)) {
    const text = fs.readFileSync(envPath, 'utf-8');
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m && !line.trim().startsWith('#')) {
        env[m[1]] = m[2].trim();
      }
    }
  }
  return env;
}

/* ---------------- 读取数据：本地缓存优先，远端拉取并缓存 ---------------- */
function readCache() {
  if (!fs.existsSync(CACHE_FILE)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    if (Array.isArray(data)) return data;
  } catch (e) {
    console.warn('[regions] 本地缓存解析失败，将尝试远端拉取:', e.message);
  }
  return null;
}

async function fetchRemote() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(DATA_URL, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('数据格式异常：顶层非数组');
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function loadRegions() {
  // 1) 本地缓存命中 → 直接用（离线可用）
  const cached = readCache();
  if (cached) {
    console.log(`[regions] 使用本地缓存 ${path.relative(path.resolve(__dirname, '..'), CACHE_FILE)}`);
    return cached;
  }
  // 2) 缓存缺失 → 远端拉取并写入缓存
  console.log('[regions] 本地缓存缺失，拉取行政区划数据…');
  const data = await fetchRemote();
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data), 'utf-8');
    console.log(`[regions] 已写入本地缓存 ${path.relative(path.resolve(__dirname, '..'), CACHE_FILE)}`);
  } catch (e) {
    console.warn('[regions] 写入本地缓存失败（不影响本次入库）:', e.message);
  }
  return data;
}

/* ---------------- 批量插入 ---------------- */
async function batchInsert(conn, rows) {
  if (!rows.length) return;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    await conn.query(
      'INSERT INTO regions (code, name, level, parent_id, sort, status) VALUES ?',
      [chunk],
    );
  }
}

async function loadCodeIdMap(conn, level) {
  const [rs] = await conn.query(
    'SELECT id, code FROM regions WHERE level = ?',
    [level],
  );
  const map = new Map();
  for (const r of rs) map.set(String(r.code), Number(r.id));
  return map;
}

/* ---------------- 主流程 ---------------- */
async function main() {
  const env = loadEnv();
  const dbHost = env.DB_HOST || '127.0.0.1';
  const dbPort = Number(env.DB_PORT || 3306);
  const dbUser = env.DB_USER || 'root';
  const dbPwd = env.DB_PASSWORD || '123456';
  const dbName = env.DB_DATABASE || 'swimming_platform';

  const conn = await mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPwd,
    database: dbName,
    charset: 'utf8mb4',
    multipleStatements: false,
  });

  console.log(`[regions] 已连接 ${dbHost}:${dbPort}/${dbName}`);

  // 1) 建表（幂等）+ 对齐 code 列长度（兼容早期 VARCHAR(6) 建表）
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`regions\` (
      \`id\`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`code\`       VARCHAR(9)  NOT NULL,
      \`name\`       VARCHAR(64) NOT NULL,
      \`level\`      TINYINT     NOT NULL,
      \`parent_id\`  BIGINT UNSIGNED NULL,
      \`sort\`       INT         NOT NULL DEFAULT 0,
      \`status\`     TINYINT     NOT NULL DEFAULT 1,
      \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_region_code\` (\`code\`),
      KEY \`idx_region_parent\` (\`parent_id\`),
      KEY \`idx_region_level\` (\`level\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await conn.query('ALTER TABLE \`regions\` MODIFY \`code\` VARCHAR(9) NOT NULL;');

  // 2) 读取数据（本地缓存优先，缺失则远端拉取并缓存）
  const tree = await loadRegions();

  // 3) 清空（幂等重跑）
  await conn.query('TRUNCATE TABLE regions');

  // 4) 省
  const provinceRows = [];
  let pSort = 0;
  for (const p of tree) {
    pSort += 1;
    provinceRows.push([String(p.code), p.name, 1, null, pSort, 1]);
  }
  await batchInsert(conn, provinceRows);
  const provinceMap = await loadCodeIdMap(conn, 1);
  console.log(`[regions] 省级入库 ${provinceRows.length} 条`);

  // 5) 市
  const cityRows = [];
  let cSort = 0;
  for (const p of tree) {
    const pid = provinceMap.get(String(p.code));
    if (!pid) continue;
    for (const c of p.children || []) {
      cSort += 1;
      cityRows.push([String(c.code), c.name, 2, pid, cSort, 1]);
    }
  }
  await batchInsert(conn, cityRows);
  const cityMap = await loadCodeIdMap(conn, 2);
  console.log(`[regions] 市级入库 ${cityRows.length} 条`);

  // 6) 区县
  const areaRows = [];
  let aSort = 0;
  for (const p of tree) {
    for (const c of p.children || []) {
      const cid = cityMap.get(String(c.code));
      if (!cid) continue;
      for (const a of c.children || []) {
        aSort += 1;
        areaRows.push([String(a.code), a.name, 3, cid, aSort, 1]);
      }
    }
  }
  await batchInsert(conn, areaRows);
  console.log(`[regions] 区县级入库 ${areaRows.length} 条`);

  const total = provinceRows.length + cityRows.length + areaRows.length;
  console.log(`[regions] 完成，共 ${total} 条记录`);

  await conn.end();
}

main().catch((e) => {
  console.error('[regions] 失败：', e.message);
  process.exit(1);
});
