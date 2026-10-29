<template>
  <div class="module-dashboard" v-loading="loading">
    <div class="page-head">
      <div>
        <div class="page-title">场馆管理概览</div>
        <div class="page-sub">游泳场馆信息维护与管理</div>
      </div>
      <el-button type="primary" @click="router.push('/venue/list')">
        <el-icon style="margin-right: 4px"><House /></el-icon>进入场馆列表
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-inner">
            <div class="stat-icon" style="background: #67c23a">
              <el-icon :size="30"><House /></el-icon>
            </div>
            <div>
              <div class="stat-num">{{ stats.venueTotal.toLocaleString() }}</div>
              <div class="stat-label">场馆总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-inner">
            <div class="stat-icon" style="background: #409eff">
              <el-icon :size="30"><Location /></el-icon>
            </div>
            <div>
              <div class="stat-num">{{ provinceCount }}</div>
              <div class="stat-label">覆盖省份数（按近期场馆统计）</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <!-- 最近场馆 -->
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-head">
              <span>最近入库场馆</span>
              <el-link type="primary" @click="router.push('/venue/list')">查看全部</el-link>
            </div>
          </template>
          <el-table :data="recentVenues" size="small" stripe>
            <el-table-column label="名称" prop="name" min-width="160" show-overflow-tooltip />
            <el-table-column label="省/市/区" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">
                {{ [row.province, row.city, row.district].filter(Boolean).join(' / ') || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="地址" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">{{ row.address || '-' }}</template>
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
              <div class="func-title">场馆维护</div>
              <div class="func-desc">新增、编辑场馆基础信息与地址</div>
            </div>
          </div>
          <div class="func-item">
            <el-icon color="#e6a23c"><CircleCheck /></el-icon>
            <div>
              <div class="func-title">审核与状态</div>
              <div class="func-desc">场馆入驻审核、上 / 下架状态管控</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { House, Location, List, CircleCheck } from '@element-plus/icons-vue';
import { getVenueList } from '@/api/venue';

const router = useRouter();
const loading = ref(false);
const stats = reactive({ venueTotal: 0 });
const recentVenues = ref<any[]>([]);

const provinceCount = computed(
  () => new Set(recentVenues.value.map((v) => v.province).filter(Boolean)).size,
);

onMounted(async () => {
  loading.value = true;
  try {
    const [all, recent] = await Promise.all([
      getVenueList({ page: 1, pageSize: 1 }),
      getVenueList({ page: 1, pageSize: 8 }),
    ]);
    stats.venueTotal = (all as any)?.total ?? 0;
    recentVenues.value = (recent as any)?.list ?? [];
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
