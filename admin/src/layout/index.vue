<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo">
        <span class="logo-icon">🏊</span>
        <transition name="fade">
          <span v-if="!isCollapse" class="logo-text">游泳生态圈</span>
        </transition>
      </div>
      <el-scrollbar>
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapse"
          :unique-opened="true"
          background-color="#001529"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
          router
        >
          <template v-for="route in menuRoutes" :key="route.path">
            <!-- 单一子菜单（无隐藏子路由时保持单项目渲染） -->
            <el-menu-item
              v-if="route.children?.length === 1 && menuChildren(route).length === 1"
              :index="resolvePath(route.path, menuChildren(route)[0].path)"
            >
              <el-icon v-if="route.meta?.icon">
                <component :is="route.meta.icon" />
              </el-icon>
              <template #title>{{ menuChildren(route)[0].meta?.title }}</template>
            </el-menu-item>
            <!-- 分组子菜单（多子项，或存在隐藏子路由的分组） -->
            <el-sub-menu
              v-else-if="menuChildren(route).length >= 1"
              :index="route.path"
            >
              <template #title>
                <el-icon v-if="route.meta?.icon">
                  <component :is="route.meta.icon" />
                </el-icon>
                <span>{{ route.meta?.title }}</span>
              </template>
              <el-menu-item
                v-for="child in menuChildren(route)"
                :key="child.path"
                :index="resolvePath(route.path, child.path)"
              >
                {{ child.meta?.title }}
              </el-menu-item>
            </el-sub-menu>
          </template>
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <el-container>
      <!-- 顶栏 -->
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="isCollapse = !isCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/portal' }">工作台</el-breadcrumb-item>
            <el-breadcrumb-item
              v-if="currentParent?.meta?.title"
              :to="{ path: parentCrumbPath }"
            >
              {{ currentParent.meta.title }}
            </el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.meta?.title">
              {{ route.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar
                :size="34"
                class="role-avatar"
                :src="userStore.userInfo.avatar || undefined"
              >
                <el-icon :size="18"><UserFilled /></el-icon>
              </el-avatar>
              <span class="username">
                {{ userStore.userInfo.realName || userStore.userInfo.username }}
              </span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="change-password">
                  <el-icon><Lock /></el-icon>修改密码
                </el-dropdown-item>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主体 -->
      <el-main class="main">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import { ArrowDown, Lock, SwitchButton, UserFilled } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/user';
import { routes } from '@/router';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const isCollapse = ref(false);

// 当前用户角色码集合
const userRoleCodes = computed<string[]>(
  () => userStore.roleCodes(),
);
const isSuperAdmin = computed(() => userRoleCodes.value.includes('super_admin'));

// 侧边栏路由（排除 login / 404，并按 meta.roles 做角色过滤）
// 无 meta.roles：所有登录用户可见；有 meta.roles：super_admin 全见，其他角色需命中
const menuRoutes = computed(() => {
  if (userStore.userInfo.needChangePassword) return [];
  return routes.filter((r) => {
    if (r.path === '/login' || r.path.includes(':pathMatch')) return false;
    const allowed = (r.meta as any)?.roles as string[] | undefined;
    if (!allowed || allowed.length === 0) return true;
    if (isSuperAdmin.value) return true;
    return allowed.some((code) => userRoleCodes.value.includes(code));
  });
});

/** 子路由是否对当前用户可见（meta.roles 规则与顶级菜单一致） */
function childVisible(child: any): boolean {
  if (child.meta?.hidden) return false;
  const allowed = child.meta?.roles as string[] | undefined;
  if (!allowed || allowed.length === 0) return true;
  if (isSuperAdmin.value) return true;
  return allowed.some((code) => userRoleCodes.value.includes(code));
}

/** 过滤掉 meta.hidden 与角色不匹配的子路由（如会员管理隐藏页、会长不可见的子菜单） */
function menuChildren(route: any) {
  return (route.children ?? []).filter(childVisible);
}

const activeMenu = computed(() => route.path);

const currentParent = computed(() => {
  const segments = route.path.split('/').filter(Boolean);
  if (segments.length <= 1) return null;
  const parentPath = '/' + segments[0];
  return menuRoutes.value.find((r) => r.path === parentPath);
});

/** 面包屑中间项点击目标：父级分组的第一个可见子页面（如 /winter → /winter/association） */
const parentCrumbPath = computed(() => {
  const parent = currentParent.value;
  if (!parent) return '/portal';
  const first = menuChildren(parent)[0];
  return first ? resolvePath(parent.path, first.path) : parent.path;
});

function resolvePath(parent: string, child: string) {
  if (child.startsWith('/')) return child;
  if (parent === '/') return '/' + child;
  return parent + '/' + child;
}

async function handleCommand(cmd: string) {
  if (cmd === 'change-password') {
    router.push('/account/change-password');
    return;
  }
  if (cmd === 'logout') {
    await ElMessageBox.confirm('确定退出登录？', '提示', {
      type: 'warning',
    });
    userStore.logout();
    router.replace('/login');
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}
.sidebar {
  background: #001529;
  transition: width 0.28s;
  overflow: hidden;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: #002140;
  overflow: hidden;
}
.logo-icon {
  font-size: 24px;
}
.logo-text {
  margin-left: 10px;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}
.header {
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #5a5e66;
}
.header-right .user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.role-avatar {
  background: linear-gradient(135deg, #79bbff, #409eff);
  color: #fff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.35);
  flex-shrink: 0;
  transition: transform 0.2s;
}
.user-info:hover .role-avatar {
  transform: scale(1.08);
}
.role-avatar :deep(.el-icon) {
  color: #fff;
}
.username {
  font-size: 14px;
  color: #303133;
}
.main {
  background: #f0f2f5;
  padding: 16px;
  overflow-y: auto;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
:deep(.el-menu) {
  border-right: none;
}
</style>
