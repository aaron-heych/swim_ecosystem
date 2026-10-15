<template>
  <div class="dashboard-page">
    <!-- 冬泳概览（冬泳管理者/会长可见；数据范围由后端按角色裁剪） -->
    <WinterDashboardPanel v-if="isSwimmingRole" />

    <!-- 业务总量（冬泳角色不展示） -->
    <div v-if="!isSwimmingRole" class="section-title">业务总量</div>
    <el-row v-if="!isSwimmingRole" :gutter="20">
      <el-col :span="isSwimmingRole ? 24 : 8" v-for="card in visibleCards" :key="card.key">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card-inner">
            <div class="stat-icon" :style="{ background: card.bg }">
              <el-icon :size="32"><component :is="card.icon" /></el-icon>
            </div>
            <div class="stat-body">
              <div class="stat-num">{{ stats[card.key] }}</div>
              <div class="stat-label">{{ card.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- C 端访问量（冬泳角色不展示） -->
    <div v-if="!isSwimmingRole" class="access-header">
      <div class="section-title clickable" style="margin-bottom:0;" @click="goToAccess()">
        <el-icon><TrendCharts /></el-icon>
        <span style="margin-left:6px;">网站 C 端访问量详情</span>
        <el-icon class="title-arrow"><Right /></el-icon>
      </div>
      <el-radio-group v-model="days" size="small" @change="loadAccess">
        <el-radio-button :value="7">近 7 天</el-radio-button>
        <el-radio-button :value="14">近 14 天</el-radio-button>
        <el-radio-button :value="30">近 30 天</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 访问量汇总 -->
    <el-row v-if="!isSwimmingRole" :gutter="20" class="access-summary">
      <el-col :span="8">
        <el-card shadow="hover" class="sum-card" :class="{ clickable: !isSwimmingRole }" @click="!isSwimmingRole && goToAccess()">
          <div class="sum-body">
            <div class="sum-num">{{ access.grandTotal.toLocaleString() }}</div>
            <div class="sum-label">累计访问总量</div>
          </div>
          <el-icon class="sum-icon" color="#409eff" :size="40"><DataLine /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="sum-card" :class="{ clickable: !isSwimmingRole }" @click="!isSwimmingRole && goToAccess()">
          <div class="sum-body">
            <div class="sum-num">{{ access.weekTotal.toLocaleString() }}</div>
            <div class="sum-label">近 7 天访问</div>
          </div>
          <el-icon class="sum-icon" color="#67c23a" :size="40"><Histogram /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="sum-card" :class="{ clickable: !isSwimmingRole }" @click="!isSwimmingRole && goToAccess()">
          <div class="sum-body">
            <div class="sum-num">{{ access.todayTotal.toLocaleString() }}</div>
            <div class="sum-label">今日访问</div>
          </div>
          <el-icon class="sum-icon" color="#e6a23c" :size="40"><Sunrise /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <!-- 各功能模块访问量 -->
    <div v-if="!isSwimmingRole" class="section-title">各功能模块访问量<span class="hint-text">（点击卡片查看明细）</span></div>
    <el-row v-if="!isSwimmingRole" :gutter="20">
      <el-col :span="isSwimmingRole ? 24 : 6" v-for="m in visibleSummary" :key="m.module">
        <el-card shadow="hover" class="module-card" :class="{ clickable: !isSwimmingRole }" @click="!isSwimmingRole && goToAccess(m.module)">
          <div class="module-card-inner">
            <div class="module-icon" :style="{ background: moduleColor(m.module) }">
              <el-icon :size="22"><component :is="moduleIcon(m.module)" /></el-icon>
            </div>
            <div class="module-body">
              <div class="module-label">{{ m.label }}</div>
              <div class="module-today">
                <span class="today-num">{{ m.today.toLocaleString() }}</span>
                <span class="today-suffix">今日</span>
              </div>
              <div class="module-sub">
                <span>7日 {{ m.week.toLocaleString() }}</span>
                <span>累计 {{ m.total.toLocaleString() }}</span>
              </div>
            </div>
          </div>
          <el-progress
            :percentage="totalPercent(m.total)"
            :color="moduleColor(m.module)"
            :stroke-width="6"
            :show-text="false"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 访问趋势（冬泳角色不展示） -->
    <el-card v-if="!isSwimmingRole" shadow="never" class="trend-card">
      <template #header>
        <div class="trend-header">
          <span class="trend-title">访问量趋势（按日）</span>
          <div class="legend">
            <span class="legend-item" v-for="m in visibleSummary" :key="m.module">
              <i class="legend-dot" :style="{ background: moduleColor(m.module) }"></i>
              {{ m.label }}
            </span>
          </div>
        </div>
      </template>

      <div v-if="access.loading" class="trend-empty">加载中…</div>
      <div v-else-if="!visibleTrend.length" class="trend-empty">暂无访问数据</div>
      <div v-else class="trend-chart">
        <div
          v-for="day in visibleTrend"
          :key="day.date"
          class="trend-col"
        >
          <el-tooltip placement="top" effect="dark">
            <template #content>
              <div class="tip-date">{{ formatDate(day.date) }}</div>
              <div class="tip-row" v-for="m in visibleSummary" :key="m.module">
                <i class="tip-dot" :style="{ background: moduleColor(m.module) }"></i>
                {{ m.label }}：{{ day.items[m.module] ?? 0 }}
              </div>
              <div class="tip-total">合计：{{ day.total.toLocaleString() }}</div>
            </template>
            <div class="bar-wrap">
              <div class="bar-stack" :style="{ height: barHeight(day.total) + 'px' }">
                <div
                  v-for="m in visibleSummary"
                  :key="m.module"
                  class="bar-seg"
                  v-show="day.items[m.module]"
                  :style="{
                    background: moduleColor(m.module),
                    height: segHeight(day, m.module),
                  }"
                ></div>
              </div>
              <div class="bar-total">{{ day.total.toLocaleString() }}</div>
            </div>
          </el-tooltip>
          <div class="bar-label">{{ formatDate(day.date) }}</div>
        </div>
      </div>
    </el-card>

    <el-card class="welcome-card">
      <div class="welcome">
        <el-icon :size="56" color="#409eff"><Sunrise /></el-icon>
        <div class="welcome-text">
          <h2>{{ isSwimmingRole ? '欢迎使用冬泳协会管理后台' : '欢迎使用游泳生态圈管理后台' }}</h2>
          <p>{{ isSwimmingRole ? '请通过左侧菜单管理冬泳协会及会员信息。' : '请通过左侧菜单进行各项业务管理操作。' }}</p>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  getUserTotal,
  getVenueTotal,
  getCoachTotal,
  getEventTotal,
  getAssociationTotal,
  getPostTotal,
  getAccessStats,
  type AccessStatResult,
} from '@/api/dashboard';
import { useUserStore } from '@/store/user';
import WinterDashboardPanel from '@/components/winter/WinterDashboardPanel.vue';

const router = useRouter();
const userStore = useUserStore();

/** 冬泳角色（冬泳管理者 + 协会会长）：Dashboard 只显示协会相关信息 */
const isSwimmingRole = computed(() => {
  const codes = userStore.roleCodes();
  return codes.includes('swimming_admin') || codes.includes('swimming_sub_admin');
});

function goToAccess(module?: string) {
  router.push({ path: '/system/access', query: module ? { module } : {} });
}

/* ---------------- 业务总量 ---------------- */
const stats = reactive({
  user: 0,
  venue: 0,
  coach: 0,
  event: 0,
  association: 0,
  post: 0,
});

const cards = [
  { key: 'user', label: '用户总数', icon: 'User', bg: '#409eff' },
  { key: 'venue', label: '场馆总数', icon: 'House', bg: '#67c23a' },
  { key: 'coach', label: '教练总数', icon: 'Avatar', bg: '#e6a23c' },
  { key: 'event', label: '赛事总数', icon: 'Trophy', bg: '#f56c6c' },
  { key: 'association', label: '协会总数', icon: 'Flag', bg: '#909399' },
  { key: 'post', label: '帖子总数', icon: 'ChatDotRound', bg: '#9b59b6' },
] as const;

/** 冬泳角色只显示协会卡片 */
const visibleCards = computed(() =>
  isSwimmingRole.value ? cards.filter((c) => c.key === 'association') : cards,
);

async function loadStats() {
  try {
    if (isSwimmingRole.value) {
      // 冬泳角色只加载协会数据
      const a = await getAssociationTotal();
      stats.association = (a as any)?.total ?? 0;
    } else {
      const [u, v, c, e, a, p] = await Promise.all([
        getUserTotal(),
        getVenueTotal(),
        getCoachTotal(),
        getEventTotal(),
        getAssociationTotal(),
        getPostTotal(),
      ]);
      stats.user = (u as any)?.total ?? 0;
      stats.venue = (v as any)?.total ?? 0;
      stats.coach = (c as any)?.total ?? 0;
      stats.event = (e as any)?.total ?? 0;
      stats.association = (a as any)?.total ?? 0;
      stats.post = (p as any)?.total ?? 0;
    }
  } catch {
    // 错误已在拦截器统一处理
  }
}

/* ---------------- C 端访问量 ---------------- */
const days = ref(7);
const access = reactive<{
  loading: boolean;
  summary: AccessStatResult['summary'];
  trend: AccessStatResult['trend'];
  grandTotal: number;
  todayTotal: number;
  weekTotal: number;
}>({
  loading: false,
  summary: [],
  trend: [],
  grandTotal: 0,
  todayTotal: 0,
  weekTotal: 0,
});

const MODULE_META: Record<string, { color: string; icon: string }> = {
  association: { color: '#409eff', icon: 'Flag' },
  event: { color: '#f56c6c', icon: 'Trophy' },
  venue: { color: '#67c23a', icon: 'House' },
  coach: { color: '#e6a23c', icon: 'Avatar' },
  circle: { color: '#9b59b6', icon: 'ChatDotRound' },
  user: { color: '#009688', icon: 'User' },
  system: { color: '#909399', icon: 'Setting' },
  notification: { color: '#00bcd4', icon: 'Bell' },
};
function moduleColor(m: string) {
  return MODULE_META[m]?.color ?? '#909399';
}
function moduleIcon(m: string) {
  return MODULE_META[m]?.icon ?? 'Menu';
}

/** 冬泳角色只显示协会模块访问量 */
const visibleSummary = computed(() =>
  isSwimmingRole.value
    ? access.summary.filter((m) => m.module === 'association')
    : access.summary,
);

const maxModuleTotal = computed(() =>
  visibleSummary.value.reduce((mx, m) => Math.max(mx, m.total), 1),
);
function totalPercent(total: number) {
  return Math.round((total / maxModuleTotal.value) * 100);
}

/** 冬泳角色：趋势图只显示协会模块，重算每日合计 */
const visibleTrend = computed(() => {
  if (!isSwimmingRole.value) return access.trend;
  return access.trend.map((day) => {
    const items: Record<string, number> = {};
    let total = 0;
    for (const m of visibleSummary.value) {
      const v = day.items[m.module] ?? 0;
      items[m.module] = v;
      total += v;
    }
    return { date: day.date, total, items };
  });
});

const maxDayTotal = computed(() =>
  visibleTrend.value.reduce((mx, d) => Math.max(mx, d.total), 1),
);
function barHeight(total: number) {
  // 最大 200px，最小 2px
  return Math.max(2, Math.round((total / maxDayTotal.value) * 200));
}
function segHeight(day: AccessStatResult['trend'][number], module: string) {
  const v = day.items[module] ?? 0;
  if (!day.total || !v) return '0px';
  return ((v / day.total) * 100).toFixed(2) + '%';
}
function formatDate(d: string) {
  const parts = d.split('-');
  return parts.length >= 3 ? `${parts[1]}-${parts[2]}` : d;
}

async function loadAccess() {
  access.loading = true;
  try {
    const res = (await getAccessStats(days.value)) as AccessStatResult;
    access.summary = res.summary;
    access.trend = res.trend;
    access.grandTotal = res.grandTotal;
    access.todayTotal = res.todayTotal;
    access.weekTotal = res.weekTotal;
  } catch {
    // 错误已在拦截器统一处理
  } finally {
    access.loading = false;
  }
}

onMounted(() => {
  loadStats();
  loadAccess();
});
</script>

<style scoped>
.dashboard-page {
  padding: 0;
}
.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  margin: 18px 2px 12px;
  display: flex;
  align-items: center;
}
.section-title.clickable {
  cursor: pointer;
  transition: color 0.2s;
}
.section-title.clickable:hover {
  color: #409eff;
}
.title-arrow {
  margin-left: 4px;
  color: #909399;
  transition: transform 0.2s, color 0.2s;
}
.section-title.clickable:hover .title-arrow {
  color: #409eff;
  transform: translateX(3px);
}
.hint-text {
  font-size: 12px;
  font-weight: 400;
  color: #909399;
  margin-left: 8px;
}
.clickable {
  cursor: pointer;
  transition: transform 0.18s, box-shadow 0.18s;
}
.clickable:hover {
  transform: translateY(-2px);
}
.sum-card.clickable:hover {
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.18);
}
.module-card.clickable:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}
.stat-card {
  margin-bottom: 20px;
}
.stat-card-inner {
  display: flex;
  align-items: center;
}
.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-body {
  margin-left: 16px;
}
.stat-num {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}
.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

/* 访问量头部 */
.access-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 8px 2px 12px;
}
.access-summary {
  margin-bottom: 8px;
}
.sum-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
}
.sum-body {
  flex: 1;
}
.sum-num {
  font-size: 26px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}
.sum-label {
  font-size: 13px;
  color: #909399;
  margin-top: 6px;
}
.sum-icon {
  opacity: 0.9;
}

/* 模块卡片 */
.module-card {
  margin-bottom: 20px;
}
.module-card :deep(.el-card__body) {
  padding: 16px 18px 12px;
}
.module-card-inner {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.module-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.module-body {
  margin-left: 12px;
  flex: 1;
  min-width: 0;
}
.module-label {
  font-size: 14px;
  color: #606266;
}
.module-today {
  margin-top: 2px;
  display: flex;
  align-items: baseline;
}
.today-num {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
}
.today-suffix {
  font-size: 12px;
  color: #909399;
  margin-left: 4px;
}
.module-sub {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

/* 趋势图 */
.trend-card {
  margin-bottom: 20px;
}
.trend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
.trend-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
.legend-item {
  font-size: 12px;
  color: #606266;
  display: inline-flex;
  align-items: center;
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-right: 5px;
  display: inline-block;
}
.trend-empty {
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
}
.trend-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 6px;
  height: 240px;
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
  height: 218px;
  justify-content: flex-end;
}
.bar-stack {
  width: 22px;
  min-height: 2px;
  display: flex;
  flex-direction: column-reverse; /* 从底部向上堆叠 */
  border-radius: 4px 4px 0 0;
  overflow: hidden;
  cursor: pointer;
}
.bar-seg {
  width: 100%;
}
.bar-total {
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
}
.bar-label {
  font-size: 11px;
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

.welcome-card {
  margin-top: 8px;
}
.welcome {
  display: flex;
  align-items: center;
  padding: 16px 8px;
}
.welcome-text h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 22px;
}
.welcome-text p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}
.welcome-text {
  margin-left: 20px;
}
</style>
