<template>
  <div class="page">
    <!-- 搜索 -->
    <el-form :inline="true" :model="query" class="search-form">
      <el-form-item label="抓取源ID">
        <el-input-number
          v-model="query.sourceId"
          :min="1"
          controls-position="right"
          placeholder="可选"
          style="width: 160px"
        />
      </el-form-item>
      <el-form-item label="抓取结果">
        <el-select v-model="query.result" placeholder="全部" clearable style="width: 140px">
          <el-option
            v-for="(item, k) in CRAWL_RESULT"
            :key="k"
            :label="item.label"
            :value="Number(k)"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">搜索</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="sourceName" label="抓取源" min-width="160" show-overflow-tooltip />
      <el-table-column label="开始时间" width="180">
        <template #default="{ row }">{{ formatTime(row.startTime) }}</template>
      </el-table-column>
      <el-table-column label="结束时间" width="180">
        <template #default="{ row }">{{ formatTime(row.endTime) }}</template>
      </el-table-column>
      <el-table-column prop="crawledCount" label="抓取数量" width="100" />
      <el-table-column prop="addedCount" label="新增数量" width="100" />
      <el-table-column label="结果" width="100">
        <template #default="{ row }">
          <el-tag :type="getDict(CRAWL_RESULT, row.result).type">
            {{ getDict(CRAWL_RESULT, row.result).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="错误信息" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tooltip
            v-if="row.errorMsg"
            :content="row.errorMsg"
            placement="top"
            :raw-content="false"
          >
            <span class="ellipsis">{{ row.errorMsg }}</span>
          </el-tooltip>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pager">
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="loadData"
        @current-change="loadData"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { getCrawlLogList } from '@/api/event';
import { CRAWL_RESULT, getDict } from '@/utils/dict';

function formatTime(t: any) {
  if (!t) return '-';
  return new Date(t).toLocaleString('zh-CN');
}

const loading = ref(false);
const list = ref<any[]>([]);
const total = ref(0);
const query = reactive({
  page: 1,
  pageSize: 10,
  sourceId: undefined as number | undefined,
  result: undefined as number | undefined,
});

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getCrawlLogList({
      page: query.page,
      pageSize: query.pageSize,
      sourceId: query.sourceId,
      result: query.result,
    });
    list.value = res.list || [];
    total.value = res.total || 0;
  } catch (e) {
    // 拦截器已提示
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  query.page = 1;
  loadData();
}

function onReset() {
  query.sourceId = undefined;
  query.result = undefined;
  query.page = 1;
  loadData();
}

onMounted(loadData);
</script>

<style scoped>
.page {
  padding: 16px;
}
.search-form {
  margin-bottom: 12px;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.ellipsis {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #f56c6c;
}
</style>
