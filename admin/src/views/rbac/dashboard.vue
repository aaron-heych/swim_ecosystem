<template>
  <div class="module-dashboard" v-loading="loading">
    <div class="page-head">
      <div>
        <div class="page-title">权限管理概览</div>
        <div class="page-sub">管理员、角色与权限配置（底层地基，配置完成后基本不动）</div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card clickable" @click="router.push('/rbac/admin')">
          <div class="stat-inner">
            <div class="stat-icon" style="background: #409eff">
              <el-icon :size="30"><UserFilled /></el-icon>
            </div>
            <div>
              <div class="stat-num">{{ stats.adminTotal.toLocaleString() }}</div>
              <div class="stat-label">管理员账号 ›</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card clickable" @click="router.push('/rbac/role')">
          <div class="stat-inner">
            <div class="stat-icon" style="background: #e6a23c">
              <el-icon :size="30"><Avatar /></el-icon>
            </div>
            <div>
              <div class="stat-num">{{ stats.roleTotal.toLocaleString() }}</div>
              <div class="stat-label">角色数量 ›</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card clickable" @click="router.push('/rbac/permission')">
          <div class="stat-inner">
            <div class="stat-icon" style="background: #67c23a">
              <el-icon :size="30"><Key /></el-icon>
            </div>
            <div>
              <div class="stat-num">{{ stats.permissionTotal.toLocaleString() }}</div>
              <div class="stat-label">权限点数量 ›</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <!-- 权限体系说明 -->
      <el-col :span="10">
        <el-card shadow="never" class="func-card">
          <template #header><span>权限体系构成</span></template>
          <div class="func-item">
            <el-icon color="#409eff"><Menu /></el-icon>
            <div>
              <div class="func-title">菜单 / 资源管理</div>
              <div class="func-desc">定义系统中的菜单、页面与按钮级权限（对应"权限"页面）</div>
              <el-link type="primary" :underline="false" @click="router.push('/rbac/permission')">
                去配置 ›
              </el-link>
            </div>
          </div>
          <div class="func-item">
            <el-icon color="#e6a23c"><Avatar /></el-icon>
            <div>
              <div class="func-title">角色管理</div>
              <div class="func-desc">创建角色并勾选可访问的菜单与按钮（对应"角色"页面）</div>
              <el-link type="primary" :underline="false" @click="router.push('/rbac/role')">
                去配置 ›
              </el-link>
            </div>
          </div>
          <div class="func-item">
            <el-icon color="#909399"><DataAnalysis /></el-icon>
            <div>
              <div class="func-title">数据权限（规划中）</div>
              <div class="func-desc">按地区 / 赛区等维度限制角色可见的数据范围，后续版本支持</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 管理员列表 -->
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>
            <div class="card-head">
              <span>管理员账号</span>
              <el-link type="primary" @click="router.push('/rbac/admin')">管理管理员</el-link>
            </div>
          </template>
          <el-table :data="recentAdmins" size="small" stripe>
            <el-table-column label="用户名" prop="username" min-width="120" />
            <el-table-column label="真实姓名" prop="realName" min-width="110">
              <template #default="{ row }">{{ row.realName || '-' }}</template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                  {{ row.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  UserFilled,
  Avatar,
  Key,
  Menu,
  DataAnalysis,
} from '@element-plus/icons-vue';
import { getAdminList, getRoleList, getPermissionTree } from '@/api/user';

const router = useRouter();
const loading = ref(false);
const stats = reactive({ adminTotal: 0, roleTotal: 0, permissionTotal: 0 });
const recentAdmins = ref<any[]>([]);

onMounted(async () => {
  loading.value = true;
  try {
    const [admins, roles, permissions] = await Promise.all([
      getAdminList({ page: 1, pageSize: 8 }),
      getRoleList({ page: 1, pageSize: 1 }),
      getPermissionTree(),
    ]);
    stats.adminTotal = (admins as any)?.total ?? 0;
    stats.roleTotal = (roles as any)?.total ?? 0;
    const permList = Array.isArray(permissions) ? permissions : (permissions as any)?.list ?? [];
    stats.permissionTotal = permList.length;
    recentAdmins.value = (admins as any)?.list ?? [];
  } catch {
    // 错误已在拦截器统一处理
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
.stat-card {
  margin-bottom: 20px;
  cursor: pointer;
}
.stat-inner {
  display: flex;
  align-items: center;
  gap: 16px;
}
.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-num {
  font-size: 26px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}
.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}
.content-row {
  margin-bottom: 20px;
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.func-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
}
.func-item + .func-item {
  border-top: 1px dashed #ebeef5;
}
.func-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
.func-desc {
  margin-top: 2px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}
.func-item .el-link {
  margin-top: 4px;
  font-size: 12px;
}
</style>
