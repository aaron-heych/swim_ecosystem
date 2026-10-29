<template>
  <div class="module-dashboard" v-loading="loading">
    <div class="page-head">
      <div>
        <div class="page-title">赛事管理概览</div>
        <div class="page-sub">赛事、报名与抓取源管理</div>
      </div>
      <el-button type="primary" @click="router.push('/event/list')">
        <el-icon style="margin-right: 4px"><Trophy /></el-icon>进入赛事列表
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card clickable" @click="router.push('/event/list')">
          <div class="stat-inner">
            <div class="stat-icon" style="background: #f56c6c">
              <el-icon :size="30"><Trophy /></el-icon>
            </div>
            <div>
              <div class="stat-num">{{ stats.eventTotal.toLocaleString() }}</div>
              <div class="stat-label">赛事总数 ›</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card clickable" @click="router.push('/event/registration')">
          <div class="stat-inner">
            <div class="stat-icon" style="background: #409eff">
              <el-icon :size="30"><Tickets /></el-icon>
            </div>
            <div>
              <div class="stat-num">{{ stats.registrationTotal.toLocaleString() }}</div>
              <div class="stat-label">报名记录总数 ›</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card clickable" @click="router.push('/event/source')">
          <div class="stat-inner">
            <div class="stat-icon" style="background: #e6a23c">
              <el-icon :size="30"><Download /></el-icon>
            </div>
            <div>
              <div class="stat-num">{{ stats.sourceTotal.toLocaleString() }}</div>
              <div class="stat-label">抓取源数量 ›</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <!-- 最近赛事 -->
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>
            <div class="card-head">
              <span>最近赛事</span>
              <el-link type="primary" @click="router.push('/event/list')">查看全部</el-link>
            </div>
          </template>
          <el-table :data="recentEvents" size="small" stripe>
            <el-table-column label="赛事名称" prop="title" min-width="180" show-overflow-tooltip />
            <el-table-column label="开始时间" prop="startDate" width="130" />
          </el-table>
        </el-card>
      </el-col>

      <!-- 最近抓取日志 -->
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>
            <div class="card-head">
              <span>最近抓取记录</span>
              <el-link type="primary" @click="router.push('/event/crawl-log')">查看全部</el-link>
            </div>
          </template>
          <el-table :data="recentLogs" size="small" stripe>
            <el-table-column label="抓取源" prop="sourceName" min-width="120" show-overflow-tooltip />
            <el-table-column label="新增" prop="addedCount" width="70" align="center" />
            <el-table-column label="结果" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="getDict(CRAWL_RESULT, row.result).type" size="small">
                  {{ getDict(CRAWL_RESULT, row.result).label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="时间" width="100">
              <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
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
import { Trophy, Tickets, Download } from '@element-plus/icons-vue';
import { getEventList, getRegistrationList, getSourceList, getCrawlLogList } from '@/api/event';
import { CRAWL_RESULT, getDict } from '@/utils/dict';

const router = useRouter();
const loading = ref(false);
const stats = reactive({ eventTotal: 0, registrationTotal: 0, sourceTotal: 0 });
const recentEvents = ref<any[]>([]);
const recentLogs = ref<any[]>([]);

function formatTime(t?: string) {
  if (!t) return '-';
  return t.slice(5, 10);
}

onMounted(async () => {
  loading.value = true;
  try {
    const [events, registrations, sources, logs] = await Promise.all([
      getEventList({ page: 1, pageSize: 6 }),
      getRegistrationList({ page: 1, pageSize: 1 }),
      getSourceList({ page: 1, pageSize: 1 }),
      getCrawlLogList({ page: 1, pageSize: 6 }),
    ]);
    stats.eventTotal = (events as any)?.total ?? 0;
    stats.registrationTotal = (registrations as any)?.total ?? 0;
    stats.sourceTotal = (sources as any)?.total ?? 0;
    recentEvents.value = (events as any)?.list ?? [];
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
