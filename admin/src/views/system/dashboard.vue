<template>
  <div class="module-dashboard" v-loading="loading">
    <div class="page-head">
      <div>
        <div class="page-title">系统设置概览</div>
        <div class="page-sub">日志、统计、Banner 与系统配置</div>
      </div>
      <el-button type="primary" @click="router.push('/system/config')">
        <el-icon style="margin-right: 4px"><Setting /></el-icon>进入系统配置
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card clickable" @click="router.push('/system/banner')">
          <div class="stat-inner">
            <div class="stat-icon" style="background: #409eff">
              <el-icon :size="30"><Picture /></el-icon>
            </div>
            <div>
              <div class="stat-num">{{ stats.bannerTotal.toLocaleString() }}</div>
              <div class="stat-label">Banner 数量 ›</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card clickable" @click="router.push('/system/feedback')">
          <div class="stat-inner">
            <div class="stat-icon" style="background: #e6a23c">
              <el-icon :size="30"><ChatDotRound /></el-icon>
            </div>
            <div>
              <div class="stat-num">{{ stats.feedbackTotal.toLocaleString() }}</div>
              <div class="stat-label">用户反馈总数 ›</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card clickable" @click="router.push('/system/operation-log')">
          <div class="stat-inner">
            <div class="stat-icon" style="background: #909399">
              <el-icon :size="30"><Document /></el-icon>
            </div>
            <div>
              <div class="stat-num">{{ stats.logTotal.toLocaleString() }}</div>
              <div class="stat-label">操作日志总数 ›</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近操作日志 -->
    <el-card shadow="never" class="content-row">
      <template #header>
        <div class="card-head">
          <span>最近操作日志</span>
          <el-link type="primary" @click="router.push('/system/operation-log')">查看全部</el-link>
        </div>
      </template>
      <el-table :data="recentLogs" size="small" stripe>
        <el-table-column label="操作人账号" prop="username" width="140" />
        <el-table-column label="被操作对象" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.targetName || '-' }}</template>
        </el-table-column>
        <el-table-column label="IP" prop="ip" width="130" />
        <el-table-column label="结果" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作时间" width="160">
          <template #default="{ row }">{{ row.createdAt || '-' }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Setting, Picture, ChatDotRound, Document } from '@element-plus/icons-vue';
import { getBannerList, getFeedbackList, getOperationLogList } from '@/api/system';

const router = useRouter();
const loading = ref(false);
const stats = reactive({ bannerTotal: 0, feedbackTotal: 0, logTotal: 0 });
const recentLogs = ref<any[]>([]);

onMounted(async () => {
  loading.value = true;
  try {
    const [banners, feedbacks, logs] = await Promise.all([
      getBannerList({ page: 1, pageSize: 1 }),
      getFeedbackList({ page: 1, pageSize: 1 }),
      getOperationLogList({ page: 1, pageSize: 8 }),
    ]);
    stats.bannerTotal = (banners as any)?.total ?? 0;
    stats.feedbackTotal = (feedbacks as any)?.total ?? 0;
    stats.logTotal = (logs as any)?.total ?? 0;
    recentLogs.value = (logs as any)?.list ?? [];
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
</style>
