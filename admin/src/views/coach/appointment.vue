<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :inline="true" :model="query">
        <el-form-item label="学员/手机">
          <el-input
            v-model="query.keyword"
            placeholder="学员姓名/手机号"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="预约状态">
          <el-select
            v-model="query.status"
            placeholder="全部"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="opt in appointmentStatusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="支付状态">
          <el-select
            v-model="query.payStatus"
            placeholder="全部"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="opt in payStatusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格 -->
    <div class="table-container">
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="studentName" label="学员姓名" width="110" />
        <el-table-column label="账号" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.user?.isDeleted" type="info">已注销用户</el-tag>
            <span v-else>{{ row.user?.displayName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column label="教练" width="110">
          <template #default="{ row }">{{ row.coach?.name ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="课程" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.course?.title ?? '-' }}</template>
        </el-table-column>
        <el-table-column prop="scheduleDate" label="预约日期" width="120" />
        <el-table-column label="时段" width="160">
          <template #default="{ row }">{{ row.startTime ?? '-' }} ~ {{ row.endTime ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getDict(APPOINTMENT_STATUS, row.status).type">
              {{ getDict(APPOINTMENT_STATUS, row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="支付状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getDict(PAY_STATUS, row.payStatus).type">
              {{ getDict(PAY_STATUS, row.payStatus).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="100">
          <template #default="{ row }">¥{{ row.amount ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-select
              :model-value="row.status"
              size="small"
              style="width: 110px"
              @change="(v) => onStatusChange(row, v as number)"
            >
              <el-option
                v-for="opt in statusChangeOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-button
              link
              type="success"
              size="small"
              :disabled="row.payStatus === 1"
              style="margin-left: 8px"
              @click="markPaid(row)"
            >
              标记已支付
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-size="query.pageSize"
          :current-page="query.page"
          :page-sizes="[10, 20, 50]"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getAppointmentList,
  updateAppointmentStatus,
  updateAppointmentPayStatus,
} from '@/api/venue';
import { APPOINTMENT_STATUS, PAY_STATUS, getDict } from '@/utils/dict';

const appointmentStatusOptions = Object.entries(APPOINTMENT_STATUS).map(([k, v]) => ({
  value: Number(k),
  label: v.label,
}));
const payStatusOptions = Object.entries(PAY_STATUS).map(([k, v]) => ({
  value: Number(k),
  label: v.label,
}));

// 操作下拉可切换的状态：确认/完成/取消/爽约
const statusChangeOptions = [
  { value: 1, label: '已确认' },
  { value: 2, label: '已完成' },
  { value: 3, label: '已取消' },
  { value: 4, label: '爽约' },
];

const list = ref<any[]>([]);
const total = ref(0);
const loading = ref(false);
const query = reactive({
  keyword: '',
  status: undefined as number | undefined,
  payStatus: undefined as number | undefined,
  page: 1,
  pageSize: 10,
});

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getAppointmentList(query);
    list.value = res?.list ?? [];
    total.value = res?.total ?? 0;
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.page = 1;
  loadData();
}
function handleReset() {
  query.keyword = '';
  query.status = undefined;
  query.payStatus = undefined;
  query.page = 1;
  loadData();
}
function handleSizeChange(size: number) {
  query.pageSize = size;
  query.page = 1;
  loadData();
}
function handlePageChange(p: number) {
  query.page = p;
  loadData();
}

function formatTime(t?: string | number | Date | null) {
  if (!t) return '-';
  const d = new Date(t);
  if (isNaN(d.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* 改状态 */
async function onStatusChange(row: any, next: number) {
  if (next === row.status) return;
  const label = APPOINTMENT_STATUS[next]?.label ?? '新状态';
  try {
    await ElMessageBox.confirm(
      `确定将预约单（ID: ${row.id}）状态变更为「${label}」？`,
      '提示',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  try {
    await updateAppointmentStatus(row.id, next);
    ElMessage.success('状态变更成功');
    loadData();
  } catch (e) {
    // 错误已在拦截器处理
  }
}

/* 标记已支付 */
async function markPaid(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定将预约单（ID: ${row.id}）标记为已支付？`,
      '提示',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  try {
    await updateAppointmentPayStatus(row.id, {
      payStatus: 1,
      transactionId: 'OFFLINE_' + Date.now(),
    });
    ElMessage.success('已标记为已支付');
    loadData();
  } catch (e) {
    // 错误已在拦截器处理
  }
}

onMounted(loadData);
</script>
