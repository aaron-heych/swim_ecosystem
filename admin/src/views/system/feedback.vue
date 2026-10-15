<template>
  <div class="page-container">
    <!-- 搜索 -->
    <el-form :inline="true" :model="query" class="search-form" @submit.prevent="onSearch">
      <el-form-item label="关键词">
        <el-input
          v-model="query.keyword"
          placeholder="用户 / 联系方式 / 内容"
          clearable
          style="width: 220px"
          @clear="onSearch"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select
          v-model="query.status"
          placeholder="全部状态"
          clearable
          style="width: 140px"
          @change="onSearch"
        >
          <el-option
            v-for="item in FEEDBACK_STATUS_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
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
      <el-table-column label="用户" prop="userName" width="120" />
      <el-table-column label="联系方式" prop="contact" width="150" />
      <el-table-column label="类型" prop="type" width="110" />
      <el-table-column label="反馈内容" prop="content" min-width="220">
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
      <el-table-column label="状态" width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="getDict(FEEDBACK_STATUS, row.status).type">
            {{ getDict(FEEDBACK_STATUS, row.status).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="110" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            size="small"
            :disabled="row.status === 1"
            @click="openReply(row)"
          >
            回复
          </el-button>
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

    <!-- 回复弹窗 -->
    <el-dialog
      v-model="replyVisible"
      title="回复反馈"
      width="500px"
      @closed="resetReplyForm"
    >
      <el-form ref="replyFormRef" :model="replyForm" label-width="90px">
        <el-form-item label="反馈用户">
          <span>{{ replyRow?.userName }}</span>
        </el-form-item>
        <el-form-item label="反馈内容">
          <span>{{ replyRow?.content }}</span>
        </el-form-item>
        <el-form-item label="回复内容" prop="reply" required>
          <el-input
            v-model="replyForm.reply"
            type="textarea"
            :rows="4"
            placeholder="请输入回复内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replyVisible = false">取消</el-button>
        <el-button type="primary" :loading="replyLoading" @click="submitReply">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, type FormInstance } from 'element-plus';
import { Search, Refresh } from '@element-plus/icons-vue';
import { getFeedbackList, replyFeedback } from '@/api/system';
import { FEEDBACK_STATUS, getDict } from '@/utils/dict';

const FEEDBACK_STATUS_OPTIONS = Object.entries(FEEDBACK_STATUS).map(([k, v]) => ({
  value: Number(k),
  label: v.label,
}));

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
  status: undefined as number | undefined,
  page: 1,
  pageSize: 10,
});

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getFeedbackList(query);
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
  query.status = undefined;
  query.page = 1;
  loadData();
}

/* 回复 */
const replyVisible = ref(false);
const replyLoading = ref(false);
const replyFormRef = ref<FormInstance>();
const replyRow = ref<any>(null);
const replyForm = reactive({
  reply: '',
});

function openReply(row: any) {
  replyRow.value = row;
  replyForm.reply = '';
  replyVisible.value = true;
}

function resetReplyForm() {
  replyForm.reply = '';
  replyRow.value = null;
  replyFormRef.value?.clearValidate();
}

async function submitReply() {
  if (!replyRow.value) return;
  if (!replyForm.reply.trim()) {
    ElMessage.warning('请输入回复内容');
    return;
  }
  replyLoading.value = true;
  try {
    await replyFeedback(replyRow.value.id, replyForm.reply);
    ElMessage.success('回复成功');
    replyVisible.value = false;
    loadData();
  } catch (e) {
    // 拦截器已处理
  } finally {
    replyLoading.value = false;
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
