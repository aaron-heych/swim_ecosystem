<template>
  <div class="page-container">
    <div class="page-head">
      <div class="page-title">
        <el-icon><TrendCharts /></el-icon>
        <span>访问统计详情</span>
      </div>
      <div class="page-sub">按功能模块 / 日期范围多维度检索 C 端访问量明细</div>
    </div>

    <!-- 筛选 -->
    <el-form :inline="true" class="search-form" @submit.prevent="onSearch">
      <el-form-item label="功能模块">
        <el-select
          v-model="query.module"
          placeholder="全部模块"
          clearable
          style="width: 180px"
          @change="onSearch"
        >
          <el-option
            v-for="m in MODULE_OPTIONS"
            :key="m.key"
            :label="m.label"
            :value="m.key"
          >
            <span class="sel-dot" :style="{ background: moduleColor(m.key) }"></span>
            {{ m.label }}
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="日期范围">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          :clearable="true"
          style="width: 280px"
          @change="onSearch"
        />
      </el-form-item>
      <el-form-item label="快捷">
        <el-radio-group v-model="quickRange" size="small" @change="onQuickChange">
          <el-radio-button :value="7">近7天</el-radio-button>
          <el-radio-button :value="14">近14天</el-radio-button>
          <el-radio-button :value="30">近30天</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="onSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 区间汇总卡片 -->
    <el-row :gutter="16" class="summary-row">
      <el-col :span="6">
        <el-card shadow="hover" class="sum-card">
          <div class="sum-body">
            <div class="sum-num">{{ detail.rangeTotal.toLocaleString() }}</div>
            <div class="sum-label">区间总访问</div>
          </div>
          <el-icon class="sum-icon" color="#409eff" :size="36"><DataLine /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="sum-card">
          <div class="sum-body">
            <div class="sum-num">{{ detail.rangeAvg.toLocaleString() }}</div>
            <div class="sum-label">日均访问</div>
          </div>
          <el-icon class="sum-icon" color="#67c23a" :size="36"><Histogram /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="sum-card">
          <div class="sum-body">
            <div class="sum-num">{{ detail.moduleCount }}</div>
            <div class="sum-label">命中模块数</div>
          </div>
          <el-icon class="sum-icon" color="#e6a23c" :size="36"><Menu /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="sum-card">
          <div class="sum-body">
            <div class="sum-num">{{ detail.maxDayTotal.toLocaleString() }}</div>
            <div class="sum-label">单日峰值</div>
          </div>
          <el-icon class="sum-icon" color="#f56c6c" :size="36"><Top /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <div class="range-text" v-if="detail.startDate">
      当前检索区间：<b>{{ detail.startDate }}</b> 至 <b>{{ detail.endDate }}</b>
      <template v-if="detail.module"> ｜ 模块：<b>{{ moduleLabel(detail.module) }}</b></template>
    </div>

    <!-- 主体两栏：按模块占比 + 按日趋势 -->
    <el-row :gutter="16" class="main-row">
      <el-col :span="8">
        <el-card shadow="never" class="panel-card">
          <template #header><span class="panel-title">按模块占比</span></template>
          <div v-loading="loading" class="module-list">
            <div v-if="!detail.byModule.length" class="empty-text">暂无数据</div>
            <div v-for="m in detail.byModule" :key="m.module" class="module-item">
              <div class="module-row">
                <span class="sel-dot" :style="{ background: moduleColor(m.module) }"></span>
                <span class="module-label">{{ m.label }}</span>
                <span class="module-total">{{ m.total.toLocaleString() }}</span>
                <span class="module-percent">{{ m.percent }}%</span>
              </div>
              <el-progress
                :percentage="m.percent"
                :color="moduleColor(m.module)"
                :stroke-width="8"
                :show-text="false"
              />
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card shadow="never" class="panel-card">
          <template #header>
            <div class="trend-head">
              <span class="panel-title">访问量趋势（按日）</span>
              <div class="legend" v-if="detail.byModule.length">
                <span class="legend-item" v-for="m in detail.byModule" :key="m.module">
                  <i class="legend-dot" :style="{ background: moduleColor(m.module) }"></i>
                  {{ m.label }}
                </span>
              </div>
            </div>
          </template>
          <div v-if="loading" class="trend-empty">加载中…</div>
          <div v-else-if="!detail.byDay.length" class="trend-empty">暂无访问数据</div>
          <div v-else class="trend-chart">
            <div v-for="day in trendView" :key="day.date" class="trend-col">
              <el-tooltip placement="top" effect="dark">
                <template #content>
                  <div class="tip-date">{{ day.date }}</div>
                  <div class="tip-row" v-for="m in detail.byModule" :key="m.module">
                    <i class="tip-dot" :style="{ background: moduleColor(m.module) }"></i>
                    {{ m.label }}：{{ day.items[m.module] ?? 0 }}
                  </div>
                  <div class="tip-total">合计：{{ day.total.toLocaleString() }}</div>
                </template>
                <div class="bar-wrap">
                  <div class="bar-stack" :style="{ height: barHeight(day.total) + 'px' }">
                    <div
                      v-for="m in detail.byModule"
                      :key="m.module"
                      v-show="day.items[m.module]"
                      class="bar-seg"
                      :style="{
                        background: moduleColor(m.module),
                        height: segHeight(day, m.module),
                      }"
                    ></div>
                  </div>
                  <div class="bar-total">{{ day.total.toLocaleString() }}</div>
                </div>
              </el-tooltip>
              <div class="bar-label">{{ formatDay(day.date) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 明细表 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="table-head">
          <span class="panel-title">访问明细</span>
          <el-radio-group v-model="query.sortOrder" size="small" @change="onSortChange">
            <el-radio-button value="DESC">最新优先</el-radio-button>
            <el-radio-button value="ASC">日期升序</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <el-table v-loading="loading" :data="detail.list.list" border stripe>
        <el-table-column label="日期" prop="statDate" width="130" sortable
          :sort-method="(a, b) => a.statDate.localeCompare(b.statDate)" />
        <el-table-column label="功能模块" min-width="140">
          <template #default="{ row }">
            <span class="sel-dot" :style="{ background: moduleColor(row.module) }"></span>
            {{ row.label }}
          </template>
        </el-table-column>
        <el-table-column label="访问量" prop="count" width="140" align="right" sortable
          :sort-method="(a, b) => a.count - b.count">
          <template #default="{ row }">
            <span class="count-num">{{ row.count.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column label="占比" min-width="160">
          <template #default="{ row }">
            <el-progress
              :percentage="rowPercent(row.count)"
              :color="moduleColor(row.module)"
              :stroke-width="10"
              :format="(p: number) => p.toFixed(1) + '%'"
            />
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="detail.list.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        class="pagination"
        @size-change="onPageSize"
        @current-change="loadData"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Search, Refresh } from '@element-plus/icons-vue';
import {
  getAccessStatDetail,
  type AccessStatDetailResult,
} from '@/api/dashboard';

const route = useRoute();

const MODULE_OPTIONS = [
  { key: 'association', label: '冬泳协会' },
  { key: 'event', label: '参赛报名' },
  { key: 'venue', label: '游泳场馆' },
  { key: 'coach', label: '教练预约' },
  { key: 'circle', label: '游泳圈子' },
  { key: 'user', label: '用户中心' },
  { key: 'system', label: '系统服务' },
  { key: 'notification', label: '消息通知' },
];

const MODULE_COLOR: Record<string, string> = {
  association: '#409eff',
  event: '#f56c6c',
  venue: '#67c23a',
  coach: '#e6a23c',
  circle: '#9b59b6',
  user: '#009688',
  system: '#909399',
  notification: '#00bcd4',
};
function moduleColor(m: string) {
  return MODULE_COLOR[m] ?? '#909399';
}
function moduleLabel(m: string) {
  return MODULE_OPTIONS.find((x) => x.key === m)?.label ?? m;
}

const loading = ref(false);
const quickRange = ref<number | ''>('');
const dateRange = ref<[string, string] | []>([]);
const query = reactive({
  module: '',
  startDate: '',
  endDate: '',
  page: 1,
  pageSize: 20,
  sortField: 'stat_date' as 'stat_date' | 'count' | 'module',
  sortOrder: 'DESC' as 'ASC' | 'DESC',
});

const detail = reactive<Omit<AccessStatDetailResult, 'list'> & {
  list: { list: any[]; total: number; page: number; pageSize: number; totalPages: number };
}>({
  rangeTotal: 0,
  rangeAvg: 0,
  moduleCount: 0,
  maxDayTotal: 0,
  startDate: '',
  endDate: '',
  module: null,
  byModule: [],
  byDay: [],
  list: { list: [], total: 0, page: 1, pageSize: 20, totalPages: 0 },
});

async function loadData() {
  loading.value = true;
  try {
    const params: any = {
      page: query.page,
      pageSize: query.pageSize,
      sortField: query.sortField,
      sortOrder: query.sortOrder,
    };
    if (query.module) params.module = query.module;
    if (query.startDate && query.endDate) {
      params.startDate = query.startDate;
      params.endDate = query.endDate;
    }
    const res = (await getAccessStatDetail(params)) as AccessStatDetailResult;
    detail.rangeTotal = res.rangeTotal;
    detail.rangeAvg = res.rangeAvg;
    detail.moduleCount = res.moduleCount;
    detail.maxDayTotal = res.maxDayTotal;
    detail.startDate = res.startDate;
    detail.endDate = res.endDate;
    detail.module = res.module;
    detail.byModule = res.byModule;
    detail.byDay = res.byDay;
    detail.list = res.list;
  } catch {
    // 拦截器已处理
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  query.page = 1;
  if (dateRange.value && dateRange.value.length === 2) {
    query.startDate = dateRange.value[0];
    query.endDate = dateRange.value[1];
    quickRange.value = '';
  } else {
    query.startDate = '';
    query.endDate = '';
  }
  loadData();
}

function onReset() {
  query.module = '';
  query.startDate = '';
  query.endDate = '';
  dateRange.value = [];
  quickRange.value = '';
  query.page = 1;
  query.sortOrder = 'DESC';
  loadData();
}

function onQuickChange(val: number | '') {
  if (!val) {
    dateRange.value = [];
    query.startDate = '';
    query.endDate = '';
    loadData();
    return;
  }
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (val - 1));
  const fmt = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
  query.startDate = fmt(start);
  query.endDate = fmt(end);
  dateRange.value = [query.startDate, query.endDate];
  query.page = 1;
  loadData();
}

function onSortChange() {
  query.sortField = 'stat_date';
  query.page = 1;
  loadData();
}

function onPageSize() {
  query.page = 1;
  loadData();
}

// 趋势图：数据点过多时按均匀间隔抽样，最多展示 30 根柱
const trendView = computed(() => {
  const arr = detail.byDay;
  if (arr.length <= 30) return arr;
  const step = Math.ceil(arr.length / 30);
  const out = [];
  for (let i = 0; i < arr.length; i += step) out.push(arr[i]);
  if (out[out.length - 1] !== arr[arr.length - 1]) out.push(arr[arr.length - 1]);
  return out;
});
const maxDayTotal = computed(() =>
  detail.byDay.reduce((mx, d) => Math.max(mx, d.total), 1),
);
function barHeight(total: number) {
  return Math.max(2, Math.round((total / maxDayTotal.value) * 180));
}
function segHeight(day: AccessStatDetailResult['byDay'][number], module: string) {
  const v = day.items[module] ?? 0;
  if (!day.total || !v) return '0px';
  return ((v / day.total) * 100).toFixed(2) + '%';
}
function formatDay(d: string) {
  const parts = d.split('-');
  return parts.length >= 3 ? `${parts[1]}-${parts[2]}` : d;
}
function rowPercent(count: number) {
  if (!detail.rangeTotal) return 0;
  return Number(((count / detail.rangeTotal) * 100).toFixed(1));
}

onMounted(() => {
  const qm = route.query.module as string | undefined;
  if (qm && MODULE_OPTIONS.some((m) => m.key === qm)) {
    query.module = qm;
  }
  const qs = route.query.startDate as string | undefined;
  const qe = route.query.endDate as string | undefined;
  if (qs && qe) {
    query.startDate = qs;
    query.endDate = qe;
    dateRange.value = [qs, qe];
  } else {
    // 默认近 30 天
    quickRange.value = 30;
    onQuickChange(30);
    return;
  }
  loadData();
});
</script>

<style scoped>
.page-container {
  padding: 16px;
}
.page-head {
  margin-bottom: 16px;
}
.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  display: flex;
  align-items: center;
}
.page-title .el-icon {
  margin-right: 6px;
  color: #409eff;
}
.page-sub {
  font-size: 13px;
  color: #909399;
  margin-top: 6px;
}
.search-form {
  margin-bottom: 12px;
}
.sel-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: middle;
}

/* 汇总卡 */
.summary-row {
  margin-bottom: 12px;
}
.sum-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
}
.sum-body {
  flex: 1;
}
.sum-num {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}
.sum-label {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}
.sum-icon {
  opacity: 0.9;
}

.range-text {
  font-size: 13px;
  color: #606266;
  margin: 4px 2px 12px;
}
.range-text b {
  color: #303133;
}

/* 主体 */
.main-row {
  margin-bottom: 16px;
}
.panel-card {
  height: 100%;
}
.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

/* 模块占比 */
.module-list {
  max-height: 320px;
  overflow-y: auto;
  padding-right: 4px;
}
.module-item {
  margin-bottom: 14px;
}
.module-item:last-child {
  margin-bottom: 0;
}
.module-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  font-size: 13px;
}
.module-label {
  color: #303133;
  flex: 1;
}
.module-total {
  color: #606266;
  font-weight: 600;
  margin: 0 8px 0 6px;
}
.module-percent {
  color: #909399;
  width: 48px;
  text-align: right;
}
.empty-text {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

/* 趋势 */
.trend-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.legend-item {
  font-size: 12px;
  color: #606266;
  display: inline-flex;
  align-items: center;
}
.legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 2px;
  margin-right: 4px;
  display: inline-block;
}
.trend-empty {
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
}
.trend-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 4px;
  height: 220px;
  padding: 8px 4px 0;
}
.trend-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}
.bar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 200px;
  justify-content: flex-end;
}
.bar-stack {
  width: 18px;
  min-height: 2px;
  display: flex;
  flex-direction: column-reverse;
  border-radius: 4px 4px 0 0;
  overflow: hidden;
  cursor: pointer;
}
.bar-seg {
  width: 100%;
}
.bar-total {
  font-size: 10px;
  color: #909399;
  margin-top: 4px;
}
.bar-label {
  font-size: 10px;
  color: #909399;
  margin-top: 2px;
}
.tip-date {
  font-weight: 600;
  margin-bottom: 4px;
}
.tip-row {
  display: flex;
  align-items: center;
  font-size: 12px;
  line-height: 1.6;
}
.tip-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  margin-right: 6px;
  display: inline-block;
}
.tip-total {
  margin-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  padding-top: 4px;
  font-weight: 600;
}

/* 表格 */
.table-card {
  margin-bottom: 16px;
}
.table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.count-num {
  font-weight: 600;
  color: #303133;
}
.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
