<template>
  <div class="module-dashboard" v-loading="loading">
    <div class="page-head">
      <div>
        <div class="page-title">用户管理概览</div>
        <div class="page-sub">C端用户账号查看与管理</div>
      </div>
      <el-button type="primary" @click="router.push('/user/list')">
        <el-icon style="margin-right: 4px"><User /></el-icon>进入用户列表
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-inner">
            <div class="stat-icon" style="background: #409eff">
              <el-icon :size="30"><User /></el-icon>
            </div>
            <div>
              <div class="stat-num">{{ stats.userTotal.toLocaleString() }}</div>
              <div class="stat-label">用户总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-inner">
            <div class="stat-icon" style="background: #67c23a">
              <el-icon :size="30"><CircleCheck /></el-icon>
            </div>
            <div>
              <div class="stat-num">{{ stats.normalTotal.toLocaleString() }}</div>
              <div class="stat-label">正常状态用户</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-inner">
            <div class="stat-icon" style="background: #909399">
              <el-icon :size="30"><CircleClose /></el-icon>
            </div>
            <div>
              <div class="stat-num">{{ stats.disabledTotal.toLocaleString() }}</div>
              <div class="stat-label">已禁用 / 注销</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <!-- 最近注册用户 -->
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-head">
              <span>最近注册用户</span>
              <el-link type="primary" @click="router.push('/user/list')">查看全部</el-link>
            </div>
          </template>
          <el-table :data="recentUsers" size="small" stripe>
            <el-table-column label="ID" prop="id" width="80" />
            <el-table-column label="昵称" prop="nickname" min-width="120" show-overflow-tooltip />
            <el-table-column label="性别" width="80">
              <template #default="{ row }">{{ getDict(GENDER, row.gender).label }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getDict(USER_STATUS, row.status).type" size="small">
                  {{ getDict(USER_STATUS, row.status).label }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 功能说明 -->
      <el-col :span="8">
        <el-card shadow="never" class="func-card">
          <template #header><span>本模块能做什么</span></template>
          <div class="func-item">
            <el-icon color="#409eff"><List /></el-icon>
            <div>
              <div class="func-title">用户列表</div>
              <div class="func-desc">查询、禁用 / 恢复、删除C端用户账号</div>
            </div>
          </div>
          <div class="func-item">
            <el-icon color="#67c23a"><Lock /></el-icon>
            <div>
              <div class="func-title">账号安全</div>
              <div class="func-desc">注销账号标记、状态管控</div>
            </div>
          </div>
          <div class="func-item">
            <el-icon color="#e6a23c"><Connection /></el-icon>
            <div>
              <div class="func-title">关联业务</div>
              <div class="func-desc">用户与场馆、教练等业务身份的关联数据在各自模块中维护</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  User,
  CircleCheck,
  CircleClose,
  List,
  Lock,
  Connection,
} from '@element-plus/icons-vue';
import { getUserList } from '@/api/user';
import { GENDER, USER_STATUS, getDict } from '@/utils/dict';

const router = useRouter();
const loading = ref(false);
const stats = reactive({ userTotal: 0, normalTotal: 0, disabledTotal: 0 });
const recentUsers = ref<any[]>([]);

onMounted(async () => {
  loading.value = true;
  try {
    const [all, normal, disabled, recent] = await Promise.all([
      getUserList({ page: 1, pageSize: 1 }),
      getUserList({ page: 1, pageSize: 1, status: 1 }),
      getUserList({ page: 1, pageSize: 1, status: 0 }),
      getUserList({ page: 1, pageSize: 8 }),
    ]);
    stats.userTotal = (all as any)?.total ?? 0;
    stats.normalTotal = (normal as any)?.total ?? 0;
    stats.disabledTotal = (disabled as any)?.total ?? 0;
    recentUsers.value = (recent as any)?.list ?? [];
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
  padding: 10px 0;
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
</style>
