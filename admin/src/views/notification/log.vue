<template>
  <div class="page-container">
    <!-- 搜索 -->
    <el-form :inline="true" :model="query" class="search-form" @submit.prevent="onSearch">
      <el-form-item label="模板ID">
        <el-input
          v-model="query.templateId"
          type="number"
          placeholder="按模板筛选"
          clearable
          style="width: 160px"
          @clear="onSearch"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="渠道">
        <el-select
          v-model="query.channel"
          placeholder="全部渠道"
          clearable
          style="width: 140px"
          @change="onSearch"
        >
          <el-option
            v-for="c in CHANNEL_OPTIONS"
            :key="c"
            :label="c"
            :value="c"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="onSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格 -->
    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column label="ID" prop="id" width="70" />
      <el-table-column label="模板名" prop="templateName" min-width="140" show-overflow-tooltip />
      <el-table-column label="接收用户" prop="userName" width="120" />
      <el-table-column label="渠道" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="channelTagType(row.channel)">{{ row.channel }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="标题" prop="title" min-width="160" show-overflow-tooltip />
      <el-table-column label="内容" prop="content" min-width="200">
        <template #default="{ row }">
          <el-tooltip
            :content="row.content"
            placement="top"
            :disabled="!row.content || row.content.length < 30"
          >
            <span class="ellipsis">{{ row.content }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">
            {{ row.status === 1 ? '成功' : '失败' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="错误信息" prop="errorMsg" min-width="160" show-overflow-tooltip />
      <el-table-column label="发送时间" width="170">
        <template #default="{ row }">{{ formatTime(row.sentAt) }}</template>
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
import { getLogList } from '@/api/notification';

const CHANNEL_OPTIONS = ['in_app', 'sms', 'wechat'];
const CHANNEL_TAG: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
  in_app: 'primary',
  sms: 'success',
  wechat: 'warning',
};
function channelTagType(c: string) {
  return CHANNEL_TAG[c] || 'info';
}

function formatTime(t?: string | number | Date) {
  if (!t) return '-';
  const d = new Date(t);
  if (isNaN(d.getTime())) return '-';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const loading = ref(false);
const list = ref<any[]>([]);
const total = ref(0);
const query = reactive({
  templateId: '' as string | number,
  channel: '' as string,
  page: 1,
  pageSize: 10,
});

async function loadData() {
  loading.value = true;
  try {
    const params: any = { page: query.page, pageSize: query.pageSize };
    if (query.templateId !== '' && query.templateId !== undefined) {
      params.templateId = Number(query.templateId);
    }
    if (query.channel) params.channel = query.channel;
    const res: any = await getLogList(params);
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
  query.templateId = '';
  query.channel = '';
  query.page = 1;
  loadData();
}

onMounted(loadData);
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
