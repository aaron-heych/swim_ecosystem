<template>
  <div class="module-dashboard" v-loading="loading">
    <div class="page-head">
      <div>
        <div class="page-title">教练管理概览</div>
        <div class="page-sub">教练信息与预约单管理</div>
      </div>
      <div class="head-actions">
        <el-button @click="router.push('/coach/list')">
          <el-icon style="margin-right: 4px"><Avatar /></el-icon>教练列表
        </el-button>
        <el-button type="primary" @click="router.push('/coach/appointment')">
          <el-icon style="margin-right: 4px"><Tickets /></el-icon>预约单管理
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover" class="stat-card clickable" @click="router.push('/coach/list')">
          <div class="stat-inner">
            <div class="stat-icon" style="background: #9a6dd7">
              <el-icon :size="30"><Avatar /></el-icon>
            </div>
            <div>
              <div class="stat-num">{{ stats.coachTotal.toLocaleString() }}</div>
              <div class="stat-label">教练总数 ›</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="stat-card clickable" @click="router.push('/coach/appointment')">
          <div class="stat-inner">
            <div class="stat-icon" style="background: #409eff">
              <el-icon :size="30"><Tickets /></el-icon>
            </div>
            <div>
              <div class="stat-num">{{ stats.appointmentTotal.toLocaleString() }}</div>
              <div class="stat-label">预约单总数 ›</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近预约 -->
    <el-card shadow="never" class="content-row">
      <template #header>
        <div class="card-head">
          <span>最近预约单</span>
          <el-link type="primary" @click="router.push('/coach/appointment')">查看全部</el-link>
        </div>
      </template>
      <el-table :data="recentAppointments" size="small" stripe>
        <el-table-column label="学员" prop="studentName" width="110" />
        <el-table-column label="教练" width="110">
          <template #default="{ row }">{{ row.coach?.name ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="课程" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.course?.title ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="预约日期" prop="scheduleDate" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getDict(APPOINTMENT_STATUS, row.status).type" size="small">
              {{ getDict(APPOINTMENT_STATUS, row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="支付" width="90">
          <template #default="{ row }">
            <el-tag :type="getDict(PAY_STATUS, row.payStatus).type" size="small">
              {{ getDict(PAY_STATUS, row.payStatus).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="100">
          <template #default="{ row }">¥{{ row.amount ?? 0 }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Avatar, Tickets } from '@element-plus/icons-vue';
import { getCoachList, getAppointmentList } from '@/api/venue';
import { APPOINTMENT_STATUS, PAY_STATUS, getDict } from '@/utils/dict';

const router = useRouter();
const loading = ref(false);
const stats = reactive({ coachTotal: 0, appointmentTotal: 0 });
const recentAppointments = ref<any[]>([]);

onMounted(async () => {
  loading.value = true;
  try {
    const [coaches, appointments] = await Promise.all([
      getCoachList({ page: 1, pageSize: 1 }),
      getAppointmentList({ page: 1, pageSize: 8 }),
    ]);
    stats.coachTotal = (coaches as any)?.total ?? 0;
    stats.appointmentTotal = (appointments as any)?.total ?? 0;
    recentAppointments.value = (appointments as any)?.list ?? [];
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
.head-actions {
  display: flex;
  gap: 8px;
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
