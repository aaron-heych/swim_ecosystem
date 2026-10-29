<template>
  <div class="portal">
    <!-- 顶部欢迎横幅 -->
    <div class="hero">
      <div class="hero-inner">
        <div class="hero-left">
          <h1 class="hero-title">你好，{{ displayName }}</h1>
          <p class="hero-sub">欢迎使用游泳生态圈管理后台，请选择要进入的功能模块</p>
        </div>
        <div class="hero-actions">
          <el-button round @click="router.push('/account/change-password')">
            <el-icon style="margin-right: 4px"><Lock /></el-icon>修改密码
          </el-button>
          <el-button round type="danger" plain @click="handleLogout">
            <el-icon style="margin-right: 4px"><SwitchButton /></el-icon>退出登录
          </el-button>
        </div>
      </div>
    </div>

    <!-- 模块卡片 -->
    <div class="cards">
      <div
        v-for="mod in modules"
        :key="mod.path"
        class="card"
        @click="router.push(mod.entry)"
      >
        <div class="card-head">
          <div class="card-icon" :style="{ background: mod.color }">
            <el-icon :size="22"><component :is="mod.icon" /></el-icon>
          </div>
          <div class="card-title-wrap">
            <div class="card-title">{{ mod.title }}</div>
            <div class="card-desc">{{ mod.desc }}</div>
          </div>
        </div>
        <div class="card-links">
          <span
            v-for="child in mod.children.slice(0, 4)"
            :key="child.path"
            class="card-link"
            @click.stop="router.push(child.path)"
          >
            {{ child.title }}
          </span>
          <span v-if="mod.children.length > 4" class="card-more">
            等 {{ mod.children.length }} 个功能
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import { Lock, SwitchButton } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/user';
import { routes } from '@/router';

const router = useRouter();
const userStore = useUserStore();

const displayName = computed(
  () => userStore.userInfo.realName || userStore.userInfo.username,
);

const userRoleCodes = computed<string[]>(() => userStore.roleCodes());
const isSuperAdmin = computed(() => userRoleCodes.value.includes('super_admin'));

function childVisible(child: any): boolean {
  if (child.meta?.hidden) return false;
  const allowed = child.meta?.roles as string[] | undefined;
  if (!allowed || allowed.length === 0) return true;
  if (isSuperAdmin.value) return true;
  return allowed.some((code) => userRoleCodes.value.includes(code));
}

function groupVisible(r: any): boolean {
  if (r.path === '/login' || r.path === '/' || r.path.includes(':pathMatch')) return false;
  const allowed = (r.meta as any)?.roles as string[] | undefined;
  if (!allowed || allowed.length === 0) return true;
  if (isSuperAdmin.value) return true;
  return allowed.some((code) => userRoleCodes.value.includes(code));
}

const MODULE_DESC: Record<string, string> = {
  '/user': 'C端用户账号查看与管理',
  '/rbac': '管理员、角色与权限配置',
  '/winter': '冬泳协会、赛事、活动与成绩管理',
  '/venue': '游泳场馆信息维护与管理',
  '/coach': '教练信息与预约单管理',
  '/event': '赛事、报名与抓取源管理',
  '/circle': '圈子帖子、评论与举报处理',
  '/notification': '通知模板与发送日志管理',
  '/system': '日志、统计、Banner与系统配置',
};

const MODULE_COLOR: Record<string, string> = {
  '/user': 'linear-gradient(135deg, #67c23a, #95d475)',
  '/rbac': 'linear-gradient(135deg, #e6a23c, #eebe77)',
  '/winter': 'linear-gradient(135deg, #337ecc, #409eff)',
  '/venue': 'linear-gradient(135deg, #f56c6c, #f89898)',
  '/coach': 'linear-gradient(135deg, #9a6dd7, #b37feb)',
  '/event': 'linear-gradient(135deg, #d9822b, #e6a23c)',
  '/circle': 'linear-gradient(135deg, #2fbfb3, #5ad8cf)',
  '/notification': 'linear-gradient(135deg, #d9752b, #f0a04b)',
  '/system': 'linear-gradient(135deg, #6b7a90, #909399)',
};

interface ChildLink {
  path: string;
  title: string;
}

interface ModuleCard {
  path: string;
  title: string;
  icon: string;
  desc: string;
  color: string;
  entry: string;
  children: ChildLink[];
}

const modules = computed<ModuleCard[]>(() => {
  if (userStore.userInfo.needChangePassword) return [];
  const result: ModuleCard[] = [];
  for (const r of routes) {
    if (!groupVisible(r)) continue;
    const children = (r.children ?? [])
      .filter(childVisible)
      .map((c) => ({
        path: resolvePath(r.path, c.path),
        title: (c.meta as any)?.title ?? '',
      }));
    if (children.length === 0) continue;
    result.push({
      path: r.path,
      title: (r.meta as any)?.title ?? r.path,
      icon: (r.meta as any)?.icon ?? 'Menu',
      desc: MODULE_DESC[r.path] ?? '',
      color: MODULE_COLOR[r.path] ?? 'linear-gradient(135deg, #409eff, #79bbff)',
      entry: children[0].path,
      children,
    });
  }
  return result;
});

function resolvePath(parent: string, child: string) {
  if (child.startsWith('/')) return child;
  if (parent === '/') return '/' + child;
  return parent + '/' + child;
}

async function handleLogout() {
  await ElMessageBox.confirm('确定退出登录？', '提示', { type: 'warning' });
  userStore.logout();
  router.replace('/login');
}
</script>

<style scoped>
.portal {
  min-height: 100vh;
  background: #f0f2f5;
}

.hero {
  background: linear-gradient(120deg, #e8f3ff 0%, #f0f7ff 60%, #eefaff 100%);
  border-bottom: 1px solid #e6eef8;
}

.hero-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 36px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.hero-title {
  margin: 0 0 8px;
  font-size: 26px;
  font-weight: 700;
  color: #1f2d3d;
}

.hero-sub {
  margin: 0;
  font-size: 14px;
  color: #6b7a90;
}

.hero-actions {
  flex-shrink: 0;
  display: flex;
  gap: 4px;
}

.cards {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.card {
  background: #fff;
  border-radius: 10px;
  padding: 18px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(31, 45, 61, 0.1);
  border-color: #d9ecff;
}

.card-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.card-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.card-desc {
  margin-top: 4px;
  font-size: 13px;
  color: #909399;
  line-height: 1.5;
}

.card-links {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed #ebeef5;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
}

.card-link {
  font-size: 13px;
  color: #5a5e66;
  cursor: pointer;
  transition: color 0.2s;
}

.card-link:hover {
  color: #409eff;
}

.card-more {
  font-size: 12px;
  color: #c0c4cc;
}
</style>
