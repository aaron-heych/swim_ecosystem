<template>
  <div class="module-dashboard">
    <div class="page-head">
      <div>
        <div class="page-title">冬泳管理概览</div>
        <div class="page-sub">冬泳协会、会员、赛事、活动与成绩管理</div>
      </div>
    </div>

    <!-- 业务快捷入口 -->
    <div class="quick-links">
      <div
        v-for="q in quickLinks"
        :key="q.path"
        class="quick-item"
        @click="router.push(q.path)"
      >
        <el-icon :size="18" :color="q.color"><component :is="q.icon" /></el-icon>
        <span>{{ q.label }}</span>
      </div>
    </div>

    <!-- 冬泳业务仪表盘（复用后端 /admin/winter-dashboard 按角色裁剪的数据） -->
    <WinterDashboardPanel />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Flag, Trophy, Medal, Bell, UserFilled } from '@element-plus/icons-vue';
import WinterDashboardPanel from '@/components/winter/WinterDashboardPanel.vue';

const router = useRouter();

const quickLinks = [
  { path: '/winter/association', label: '协会管理', icon: Flag, color: '#409eff' },
  { path: '/winter/members', label: '会员管理', icon: UserFilled, color: '#67c23a' },
  { path: '/winter/competition', label: '赛事管理', icon: Trophy, color: '#e6a23c' },
  { path: '/winter/activity', label: '活动管理', icon: Medal, color: '#9b59b6' },
  { path: '/winter/announcement', label: '通知公告', icon: Bell, color: '#f56c6c' },
];
</script>

<style scoped>
.page-head {
  margin-bottom: 16px;
}
.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}
.page-sub {
  margin-top: 4px;
  font-size: 13px;
  color: #909399;
}
.quick-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}
.quick-item {
  background: #fff;
  border-radius: 8px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #303133;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}
.quick-item:hover {
  border-color: #d9ecff;
  box-shadow: 0 4px 12px rgba(31, 45, 61, 0.08);
}
</style>
