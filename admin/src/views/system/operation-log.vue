<template>
  <div class="page-container">
    <!-- 搜索 -->
    <el-form :inline="true" :model="query" class="search-form" @submit.prevent="onSearch">
      <el-form-item label="操作人">
        <el-input
          v-model="query.operatorKeyword"
          placeholder="账号名 / 真实姓名"
          clearable
          style="width: 160px"
          @clear="onSearch"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="被操作对象">
        <el-input
          v-model="query.targetKeyword"
          placeholder="对象名称或ID"
          clearable
          style="width: 160px"
          @clear="onSearch"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="模块">
        <el-select
          v-model="query.module"
          placeholder="全部模块"
          clearable
          style="width: 140px"
        >
          <el-option label="用户管理" value="user" />
          <el-option label="角色/管理员" value="rbac" />
        </el-select>
      </el-form-item>
      <el-form-item label="操作类型">
        <el-select v-model="query.action" placeholder="全部操作" clearable style="width: 130px">
          <el-option label="新增" value="create" />
          <el-option label="修改" value="update" />
          <el-option label="逻辑删除" value="delete" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间范围">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 260px"
          @change="onSearch"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="onSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格 -->
    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column label="ID" prop="id" width="70" fixed="left" />
      <el-table-column label="操作" width="170" fixed="left">
        <template #default="{ row }">{{ operationLabel(row) }}</template>
      </el-table-column>
      <el-table-column label="操作人账号" prop="username" width="140" fixed="left" />
      <el-table-column label="操作人真实姓名" prop="operatorRealName" width="140" fixed="left">
        <template #default="{ row }">{{ row.operatorRealName || '-' }}</template>
      </el-table-column>
      <el-table-column label="被操作对象名称" min-width="180" fixed="left">
        <template #default="{ row }">
          {{ targetTypeLabel(row.targetType) }}：{{ row.targetName || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="被操作对象ID" prop="targetId" width="130" fixed="left">
        <template #default="{ row }">{{ row.targetId || '-' }}</template>
      </el-table-column>
      <el-table-column label="操作时间" width="170" fixed="left">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="详情" min-width="220">
        <template #default="{ row }">
          <el-tooltip
            :content="row.errorMsg || row.params || '-'"
            placement="top"
            :disabled="!(row.errorMsg || row.params)"
          >
            <span class="ellipsis">{{ row.errorMsg || row.params || '-' }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="结果" width="85" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '成功' : '失败' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="IP" prop="ip" width="130" />
      <el-table-column label="方法" prop="requestMethod" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="methodTagType(row.requestMethod)" size="small">{{ row.requestMethod || '-' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="请求路径" prop="requestUrl" min-width="220">
        <template #default="{ row }">
          <el-tooltip
            :content="row.requestUrl"
            placement="top"
            :disabled="!row.requestUrl || row.requestUrl.length < 40"
          >
            <span class="ellipsis">{{ row.requestUrl || '-' }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="query.page"
      v-model:page-size="query.pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      background
      class="pagination"
      @size-change="loadData"
      @current-change="loadData"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { Search, Refresh } from '@element-plus/icons-vue';
import { getOperationLogList } from '@/api/system';

function formatTime(t?: string | number | Date) {
  if (!t) return '-';
  const d = new Date(t);
  if (isNaN(d.getTime())) return '-';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function methodTagType(m: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    GET: 'primary',
    POST: 'success',
    PUT: 'warning',
    DELETE: 'danger',
    PATCH: 'info',
  };
  return map[(m || '').toUpperCase()] || 'info';
}

function moduleLabel(module?: string) {
  const labels: Record<string, string> = {
    user: '用户管理',
    rbac: '角色/管理员',
    activity: '活动管理',
    event: '赛事管理',
    association: '协会管理',
    venue: '场馆管理',
    coach: '教练管理',
  };
  return labels[module || ''] || module || '-';
}

function targetTypeLabel(type?: string) {
  const labels: Record<string, string> = {
    user: '用户',
    admin: '管理员',
    role: '角色',
  };
  return labels[type || ''] || type || '对象';
}

function actionLabel(action?: string) {
  const labels: Record<string, string> = {
    delete: '删除',
    create: '新增',
    update: '修改',
    audit: '审核',
    login: '登录',
  };
  return labels[action || ''] || action || '-';
}

function operationLabel(row: any) {
  const target = targetTypeLabel(row.targetType);
  return `${moduleLabel(row.module)} - ${actionLabel(row.action)}${target !== '对象' ? target : ''}`;
}

const loading = ref(false);
const list = ref<any[]>([]);
const total = ref(0);
const query = reactive({
  operatorKeyword: '',
  targetKeyword: '',
  module: '',
  action: '',
  page: 1,
  pageSize: 10,
});
const dateRange = ref<[string, string] | []>([]);

function defaultDateRange(): [string, string] {
  const today = new Date();
  const end = formatDate(today);
  const start = new Date(today);
  start.setDate(start.getDate() - 7);
  return [formatDate(start), end];
}

function formatDate(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

async function loadData() {
  loading.value = true;
  try {
    const params: any = { page: query.page, pageSize: query.pageSize };
    if (query.operatorKeyword) params.operatorKeyword = query.operatorKeyword;
    if (query.targetKeyword) params.targetKeyword = query.targetKeyword;
    if (query.module) params.module = query.module;
    if (query.action) params.action = query.action;
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = `${dateRange.value[0]}T00:00:00`;
      params.endDate = `${dateRange.value[1]}T23:59:59`;
    }
    const res: any = await getOperationLogList(params);
    list.value = res?.list || [];
    total.value = res?.total || 0;
  } catch (e) {
    // 拦截器已处理
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  query.page = 1;
  loadData();
}

function onReset() {
  query.operatorKeyword = '';
  query.targetKeyword = '';
  query.module = '';
  query.action = '';
  dateRange.value = defaultDateRange();
  query.page = 1;
  loadData();
}

onMounted(() => {
  dateRange.value = defaultDateRange();
  loadData();
});
</script>

<style scoped>
.page-container {
  padding: 16px;
}
.search-form {
  margin-bottom: 16px;
}
.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
.ellipsis {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
</style>
