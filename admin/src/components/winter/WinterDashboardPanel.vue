<template>
  <div class="winter-dashboard" v-loading="loading">
    <div class="wd-section-title">冬泳概览</div>
    <!-- 统计卡片（仅冬泳管理者/超管） -->
    <div v-if="data?.full" class="stat-cards">
      <div class="stat-card clickable" @click="goAssociation">
        <div class="stat-icon stat-icon-blue">
          <el-icon :size="22"><OfficeBuilding /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-label">冬泳协会</div>
          <div class="stat-value">{{ data.stats?.associationsTotal ?? 0 }}</div>
          <div class="stat-sub">已注册协会总数 ›</div>
        </div>
      </div>
      <div class="stat-card clickable" @click="goAssociation">
        <div class="stat-icon stat-icon-green">
          <el-icon :size="22"><UserFilled /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-label">注册会员</div>
          <div class="stat-value">{{ (data.stats?.membersTotal ?? 0).toLocaleString() }}</div>
          <div class="stat-sub">协会当前注册用户数 ›</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-orange">
          <el-icon :size="22"><TrendCharts /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-label">本月新增会员</div>
          <div class="stat-value">+{{ data.stats?.monthNewMembers ?? 0 }}</div>
          <div class="stat-sub">最近 30 天入会</div>
        </div>
      </div>
      <div class="stat-card clickable" @click="scrollToEvents">
        <div class="stat-icon stat-icon-purple">
          <el-icon :size="22"><Trophy /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-label">近三月赛事</div>
          <div class="stat-value">{{ data.stats?.recentEventCount ?? 0 }}</div>
          <div class="stat-sub">来自各官方网站的赛事 ›</div>
        </div>
      </div>
    </div>

    <!-- 图表区（仅冬泳管理者/超管） -->
    <div v-if="data?.full" class="chart-row">
      <!-- 年龄层级 -->
      <div class="panel chart-panel">
        <div class="panel-title">会员年龄层级</div>
        <div v-if="ageTotal > 0" class="donut-wrap">
          <div class="donut" :style="{ background: donutGradient }">
            <div class="donut-hole">
              <div class="donut-total">{{ ageTotal.toLocaleString() }}</div>
              <div class="donut-total-label">会员总数</div>
            </div>
          </div>
          <div class="donut-legend">
            <div v-for="(item, i) in ageData" :key="item.label" class="legend-item">
              <span class="legend-dot" :style="{ background: AGE_COLORS[i % AGE_COLORS.length] }" />
              <span class="legend-label">{{ item.label }}</span>
              <span class="legend-count">{{ item.count }}</span>
              <span class="legend-pct">{{ agePct(item.count) }}%</span>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无会员数据" :image-size="70" />
      </div>

      <!-- 会员增长趋势 -->
      <div class="panel chart-panel">
        <div class="panel-title">会员增长趋势（近 12 个月）</div>
        <div v-if="trendMax > 0" class="trend-chart">
          <div v-for="m in data.memberTrend" :key="m.month" class="trend-col" :title="`${m.month} 新增 ${m.count} 人`">
            <div class="trend-bar-wrap">
              <div class="trend-bar" :style="{ height: trendHeight(m.count) + 'px' }" />
              <div class="trend-count">{{ m.count || '' }}</div>
            </div>
            <div class="trend-label">{{ m.month.slice(5) }}月</div>
          </div>
        </div>
        <el-empty v-else description="暂无趋势数据" :image-size="70" />
      </div>
    </div>

    <!-- 近三月赛事（所有角色可见） -->
    <div ref="eventsPanelRef" class="panel events-panel" :class="{ flash: eventsFlash }">
      <div class="panel-header">
        <div class="panel-title">近三个月赛事信息</div>
        <div class="panel-sub">来自各官方网站的赛事通报（前后三个月窗口）</div>
      </div>
      <el-table :data="data?.events ?? []" border stripe size="small">
        <el-table-column prop="title" label="赛事名称" min-width="220" show-overflow-tooltip />
        <el-table-column label="来源" width="140">
          <template #default="{ row }">{{ row.sourceName || '手工发布' }}</template>
        </el-table-column>
        <el-table-column label="地区" width="140">
          <template #default="{ row }">
            {{ [row.province, row.city].filter(Boolean).join(' / ') || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="比赛时间" width="200">
          <template #default="{ row }">
            {{ row.startDate }}{{ row.endDate && row.endDate !== row.startDate ? ' ~ ' + row.endDate : '' }}
          </template>
        </el-table-column>
        <el-table-column prop="venueName" label="场馆" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.venueName || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="eventStatusTag(row.status)" size="small">
              {{ eventStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.sourceUrl"
              link
              type="primary"
              size="small"
              @click="openSource(row)"
            >
              查看原文
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="近三个月暂无赛事信息" />
        </template>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { OfficeBuilding, UserFilled, TrendCharts, Trophy } from '@element-plus/icons-vue';
import { getWinterDashboard } from '@/api/winter-dashboard';

const router = useRouter();
function goAssociation() {
  router.push('/winter/association');
}

/** 点击「近三月赛事」卡片：平滑滚动到赛事信息区域并短暂高亮 */
const eventsPanelRef = ref<HTMLElement | null>(null);
const eventsFlash = ref(false);
function scrollToEvents() {
  eventsPanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  eventsFlash.value = false;
  // 等滚动开始后再触发高亮动画
  setTimeout(() => {
    eventsFlash.value = true;
    setTimeout(() => (eventsFlash.value = false), 1600);
  }, 300);
}

const loading = ref(false);
const data = ref<any>(null);

/* ---- 年龄层级 donut ---- */
const AGE_COLORS = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#9b59b6', '#00bcd4', '#909399'];
const ageData = computed(() => (data.value?.ageDistribution ?? []).filter((d: any) => d.count > 0));
const ageTotal = computed(() => ageData.value.reduce((s: number, d: any) => s + d.count, 0));
const donutGradient = computed(() => {
  if (!ageTotal.value) return '#ebeef5';
  let acc = 0;
  const segs = ageData.value.map((d: any, i: number) => {
    const start = (acc / ageTotal.value) * 360;
    acc += d.count;
    const end = (acc / ageTotal.value) * 360;
    return `${AGE_COLORS[i % AGE_COLORS.length]} ${start}deg ${end}deg`;
  });
  return `conic-gradient(${segs.join(', ')})`;
});
function agePct(count: number) {
  return ageTotal.value ? ((count / ageTotal.value) * 100).toFixed(1) : '0.0';
}

/* ---- 会员增长趋势 ---- */
const trendMax = computed(() =>
  Math.max(0, ...(data.value?.memberTrend ?? []).map((m: any) => m.count)),
);
function trendHeight(count: number) {
  const H = 140;
  return trendMax.value ? Math.max(4, Math.round((count / trendMax.value) * H)) : 4;
}

/* ---- 赛事状态 ---- */
const EVENT_STATUS: Record<number, { label: string; type: string }> = {
  0: { label: '待发布', type: 'info' },
  1: { label: '报名中', type: 'success' },
  2: { label: '报名截止', type: 'warning' },
  3: { label: '已结束', type: 'info' },
  4: { label: '已取消', type: 'danger' },
};
function eventStatusLabel(s: number) {
  return EVENT_STATUS[s]?.label ?? '-';
}
function eventStatusTag(s: number) {
  return (EVENT_STATUS[s]?.type ?? 'info') as any;
}

function openSource(row: any) {
  window.open(row.sourceUrl, '_blank');
}

async function loadData() {
  loading.value = true;
  try {
    data.value = await getWinterDashboard();
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<style scoped>
.winter-dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 8px;
}
.wd-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

/* 统计卡片 */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 18px 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 14px;
}
.stat-card.clickable {
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
}
.stat-card.clickable:hover {
  box-shadow: 0 4px 14px rgba(64, 158, 255, 0.18);
  transform: translateY(-2px);
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.stat-icon-blue {
  background: linear-gradient(135deg, #79bbff 0%, #409eff 100%);
  box-shadow: 0 4px 10px rgba(64, 158, 255, 0.3);
}
.stat-icon-green {
  background: linear-gradient(135deg, #95d475 0%, #67c23a 100%);
  box-shadow: 0 4px 10px rgba(103, 194, 58, 0.3);
}
.stat-icon-orange {
  background: linear-gradient(135deg, #eebe77 0%, #e6a23c 100%);
  box-shadow: 0 4px 10px rgba(230, 162, 60, 0.3);
}
.stat-icon-purple {
  background: linear-gradient(135deg, #b58ce0 0%, #9b59b6 100%);
  box-shadow: 0 4px 10px rgba(155, 89, 182, 0.3);
}
.stat-body {
  min-width: 0;
}
.stat-label {
  font-size: 13px;
  color: #909399;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin: 6px 0 4px;
}
.stat-sub {
  font-size: 12px;
  color: #c0c4cc;
}

/* 面板 */
.panel {
  background: #fff;
  border-radius: 10px;
  padding: 16px 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

/* 近三月赛事面板：滚动定位与点击高亮 */
.events-panel {
  scroll-margin-top: 76px; /* 顶栏高度 + 间距，避免滚动后被 header 遮挡 */
  transition: box-shadow 0.3s;
}
.events-panel.flash {
  animation: panel-flash 1.6s ease;
}
@keyframes panel-flash {
  0%, 100% {
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  }
  25%, 60% {
    box-shadow: 0 0 0 3px rgba(155, 89, 182, 0.35), 0 4px 16px rgba(155, 89, 182, 0.25);
  }
}
.panel-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 12px;
}
.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
.panel-sub {
  font-size: 12px;
  color: #909399;
}

/* 图表行：年龄层级与会员趋势分行展示，各占整行 */
.chart-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
.chart-panel .panel-title {
  margin-bottom: 14px;
}

/* 年龄层级 donut */
.donut-wrap {
  display: flex;
  align-items: center;
  gap: 24px;
}
.donut {
  width: 170px;
  height: 170px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.donut-hole {
  width: 104px;
  height: 104px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.donut-total {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
}
.donut-total-label {
  font-size: 12px;
  color: #909399;
}
.donut-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}
.legend-label {
  color: #606266;
  flex: 1;
}
.legend-count {
  color: #303133;
  font-weight: 600;
}
.legend-pct {
  color: #909399;
  width: 48px;
  text-align: right;
}

/* 会员趋势柱状图 */
.trend-chart {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 190px;
  padding-top: 8px;
}
.trend-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
}
.trend-bar-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
}
.trend-bar {
  width: 60%;
  max-width: 34px;
  border-radius: 4px 4px 0 0;
  background: linear-gradient(180deg, #79bbff 0%, #409eff 100%);
  transition: height 0.3s;
}
.trend-count {
  font-size: 11px;
  color: #909399;
  margin-top: 3px;
  height: 14px;
}
.trend-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

@media (max-width: 1200px) {
  .stat-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .chart-row {
    grid-template-columns: 1fr;
  }
}
</style>
