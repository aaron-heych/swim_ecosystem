<template>
  <div class="module-dashboard" v-loading="loading">
    <div class="page-head">
      <div>
        <div class="page-title">消息通知概览</div>
        <div class="page-sub">通知模板与发送日志管理</div>
      </div>
      <el-button type="primary" @click="router.push('/notification/template')">
        <el-icon style="margin-right: 4px"><Bell /></el-icon>进入模板管理
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card clickable" @click="router.push('/notification/template')">
          <div class="stat-inner">
            <div class="stat-icon" style="background: #00bcd4">
              <el-icon :size="30"><Document /></el-icon>
            </div>
            <div>
              <div class="stat-num">{{ stats.templateTotal.toLocaleString() }}</div>
              <div class="stat-label">通知模板数 ›</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card clickable" @click="router.push('/winter/announcement')">
          <div class="stat-inner">
            <div class="stat-icon" style="background: #e6a23c">
              <el-icon :size="30"><BellFilled /></el-icon>
            </div>
            <div>
              <div class="stat-num">{{ stats.announcementTotal.toLocaleString() }}</div>
              <div class="stat-label">通知公告数 ›</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card clickable" @click="router.push('/notification/log')">
          <div class="stat-inner">
            <div class="stat-icon" style="background: #67c23a">
              <el-icon :size="30"><Promotion /></el-icon>
            </div>
            <div>
              <div class="stat-num">{{ stats.logTotal.toLocaleString() }}</div>
              <div class="stat-label">发送日志总数 ›</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近发送日志 -->
    <el-card shadow="never" class="content-row">
      <template #header>
        <div class="card-head">
          <span>最近发送记录</span>
          <el-link type="primary" @click="router.push('/notification/log')">查看全部</el-link>
        </div>
      </template>
      <el-table :data="recentLogs" size="small" stripe>
        <el-table-column label="模板名" prop="templateName" min-width="130" show-overflow-tooltip />
        <el-table-column label="接收用户" prop="userName" width="110" />
        <el-table-column label="渠道" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.channel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="标题" prop="title" min-width="150" show-overflow-tooltip />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发送时间" width="160">
          <template #default="{ row }">{{ row.sentAt || '-' }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Bell, Document, BellFilled, Promotion } from '@element-plus/icons-vue';
import { getTemplateList, getLogList, getAnnouncementList } from '@/api/notification';

const router = useRouter();
const loading = ref(false);
const stats = reactive({ templateTotal: 0, announcementTotal: 0, logTotal: 0 });
const recentLogs = ref<any[]>([]);

onMounted(async () => {
  loading.value = true;
  try {
    const [templates, announcements, logs] = await Promise.all([
      getTemplateList({ page: 1, pageSize: 1 }),
      getAnnouncementList({ page: 1, pageSize: 1 }),
      getLogList({ page: 1, pageSize: 8 }),
    ]);
    stats.templateTotal = (templates as any)?.total ?? 0;
    stats.announcementTotal = (announcements as any)?.total ?? 0;
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
