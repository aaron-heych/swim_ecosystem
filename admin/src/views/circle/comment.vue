<template>
  <div class="page-container">
    <!-- 搜索 -->
    <el-form :inline="true" :model="query" class="search-form" @submit.prevent="onSearch">
      <el-form-item label="关键词">
        <el-input
          v-model="query.keyword"
          placeholder="评论内容 / 评论人"
          clearable
          style="width: 200px"
          @clear="onSearch"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="帖子ID">
        <el-input
          v-model="query.postId"
          type="number"
          placeholder="按帖子筛选"
          clearable
          style="width: 160px"
          @clear="onSearch"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="onSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格 -->
    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column label="ID" prop="id" width="70" />
      <el-table-column label="帖子标题" prop="postTitle" min-width="180" show-overflow-tooltip />
      <el-table-column label="评论人" prop="userName" width="120" />
      <el-table-column label="评论内容" prop="content" min-width="220">
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
      <el-table-column label="点赞数" prop="likeCount" width="80" align="center" />
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button link type="danger" size="small" @click="onDelete(row)">删除</el-button>
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
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh } from '@element-plus/icons-vue';
import { getCommentList, deleteComment } from '@/api/circle';

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
  keyword: '',
  postId: '' as string | number,
  page: 1,
  pageSize: 10,
});

async function loadData() {
  loading.value = true;
  try {
    const params: any = { page: query.page, pageSize: query.pageSize };
    if (query.keyword) params.keyword = query.keyword;
    if (query.postId !== '' && query.postId !== undefined) {
      params.postId = Number(query.postId);
    }
    const res: any = await getCommentList(params);
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
  query.keyword = '';
  query.postId = '';
  query.page = 1;
  loadData();
}

async function onDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定删除该评论吗？评论人：${row.userName}`,
      '删除确认',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  try {
    await deleteComment(row.id);
    ElMessage.success('删除成功');
    if (list.value.length === 1 && query.page > 1) query.page -= 1;
    loadData();
  } catch (e) {
    // 拦截器已处理
  }
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
