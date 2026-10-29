<template>
  <div class="module-dashboard" v-loading="loading">
    <div class="page-head">
      <div>
        <div class="page-title">游泳圈子概览</div>
        <div class="page-sub">圈子帖子、评论与举报处理</div>
      </div>
      <el-button type="primary" @click="router.push('/circle/post')">
        <el-icon style="margin-right: 4px"><ChatDotRound /></el-icon>进入帖子管理
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card clickable" @click="router.push('/circle/post')">
          <div class="stat-inner">
            <div class="stat-icon" style="background: #2fbfb3">
              <el-icon :size="30"><ChatDotRound /></el-icon>
            </div>
            <div>
              <div class="stat-num">{{ stats.postTotal.toLocaleString() }}</div>
              <div class="stat-label">帖子总数 ›</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card clickable" @click="router.push('/circle/comment')">
          <div class="stat-inner">
            <div class="stat-icon" style="background: #409eff">
              <el-icon :size="30"><ChatLineSquare /></el-icon>
            </div>
            <div>
              <div class="stat-num">{{ stats.commentTotal.toLocaleString() }}</div>
              <div class="stat-label">评论总数 ›</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card clickable" @click="router.push('/circle/report')">
          <div class="stat-inner">
            <div class="stat-icon" style="background: #f56c6c">
              <el-icon :size="30"><WarningFilled /></el-icon>
            </div>
            <div>
              <div class="stat-num">{{ stats.reportTotal.toLocaleString() }}</div>
              <div class="stat-label">举报记录总数 ›</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <!-- 最近帖子 -->
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>
            <div class="card-head">
              <span>最近帖子</span>
              <el-link type="primary" @click="router.push('/circle/post')">查看全部</el-link>
            </div>
          </template>
          <el-table :data="recentPosts" size="small" stripe>
            <el-table-column label="标题" prop="title" min-width="180" show-overflow-tooltip />
            <el-table-column label="作者" prop="authorName" width="110" />
          </el-table>
        </el-card>
      </el-col>

      <!-- 最近举报 -->
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>
            <div class="card-head">
              <span>待处理举报</span>
              <el-link type="primary" @click="router.push('/circle/report')">去处理</el-link>
            </div>
          </template>
          <el-table :data="recentReports" size="small" stripe>
            <el-table-column label="举报人" prop="reporterName" width="100" />
            <el-table-column label="原因" prop="reason" min-width="140" show-overflow-tooltip />
            <el-table-column label="状态" width="110" align="center">
              <template #default="{ row }">
                <el-tag :type="getDict(REPORT_STATUS, row.status).type" size="small">
                  {{ getDict(REPORT_STATUS, row.status).label }}
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
import { ChatDotRound, ChatLineSquare, WarningFilled } from '@element-plus/icons-vue';
import { getPostList, getCommentList, getReportList } from '@/api/circle';
import { REPORT_STATUS, getDict } from '@/utils/dict';

const router = useRouter();
const loading = ref(false);
const stats = reactive({ postTotal: 0, commentTotal: 0, reportTotal: 0 });
const recentPosts = ref<any[]>([]);
const recentReports = ref<any[]>([]);

onMounted(async () => {
  loading.value = true;
  try {
    const [posts, comments, reports] = await Promise.all([
      getPostList({ page: 1, pageSize: 6 }),
      getCommentList({ page: 1, pageSize: 1 }),
      getReportList({ page: 1, pageSize: 6, status: 0 }),
    ]);
    stats.postTotal = (posts as any)?.total ?? 0;
    stats.commentTotal = (comments as any)?.total ?? 0;
    stats.reportTotal = (reports as any)?.total ?? 0;
    recentPosts.value = (posts as any)?.list ?? [];
    recentReports.value = (reports as any)?.list ?? [];
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
