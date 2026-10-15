<template>
  <div class="page-container">
    <!-- 搜索 -->
    <el-form :inline="true" :model="query" class="search-form" @submit.prevent="onSearch">
      <el-form-item label="关键词">
        <el-input
          v-model="query.keyword"
          placeholder="标题 / 作者"
          clearable
          style="width: 200px"
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
            v-for="item in POST_STATUS_OPTIONS"
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
      <el-table-column label="标题" prop="title" min-width="180" show-overflow-tooltip />
      <el-table-column label="作者" prop="authorName" width="120" />
      <el-table-column label="分类" prop="category" width="110" />
      <el-table-column label="点赞数" prop="likeCount" width="80" align="center" />
      <el-table-column label="评论数" prop="commentCount" width="80" align="center" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getDict(POST_STATUS, row.status).type">
            {{ getDict(POST_STATUS, row.status).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="置顶" width="90" align="center">
        <template #default="{ row }">
          <el-switch
            :model-value="row.isTop === 1"
            @change="(v: any) => onToggleTop(row, v)"
          />
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openAudit(row)">审核</el-button>
          <el-button
            link
            type="primary"
            size="small"
            @click="onToggleTop(row, row.isTop !== 1)"
          >
            {{ row.isTop === 1 ? '取消置顶' : '置顶' }}
          </el-button>
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

    <!-- 审核弹窗 -->
    <el-dialog
      v-model="auditVisible"
      title="帖子审核"
      width="480px"
      @closed="resetAuditForm"
    >
      <el-form ref="auditFormRef" :model="auditForm" label-width="90px">
        <el-form-item label="帖子标题">
          <span>{{ auditRow?.title }}</span>
        </el-form-item>
        <el-form-item label="审核结果" prop="auditStatus" required>
          <el-radio-group v-model="auditForm.auditStatus">
            <el-radio :value="1">通过</el-radio>
            <el-radio :value="3">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核备注" prop="auditRemark">
          <el-input
            v-model="auditForm.auditRemark"
            type="textarea"
            :rows="3"
            placeholder="请输入审核备注（驳回时建议填写原因）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button type="primary" :loading="auditLoading" @click="submitAudit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus';
import { Search, Refresh } from '@element-plus/icons-vue';
import { getPostList, auditPost, togglePostTop, deletePost } from '@/api/circle';
import { POST_STATUS, getDict } from '@/utils/dict';

const POST_STATUS_OPTIONS = Object.entries(POST_STATUS).map(([k, v]) => ({
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
    const res: any = await getPostList(query);
    list.value = res?.list || [];
    total.value = res?.total || 0;
  } catch (e) {
    // 错误已在拦截器处理
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

async function onToggleTop(row: any, v: any) {
  const target = v ? 1 : 0;
  try {
    await togglePostTop(row.id, target);
    row.isTop = target;
    ElMessage.success(target === 1 ? '已置顶' : '已取消置顶');
  } catch (e) {
    // 拦截器已处理
  }
}

async function onDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除帖子「${row.title}」吗？`, '删除确认', {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    await deletePost(row.id);
    ElMessage.success('删除成功');
    if (list.value.length === 1 && query.page > 1) query.page -= 1;
    loadData();
  } catch (e) {
    // 拦截器已处理
  }
}

/* 审核 */
const auditVisible = ref(false);
const auditLoading = ref(false);
const auditFormRef = ref<FormInstance>();
const auditRow = ref<any>(null);
const auditForm = reactive({
  auditStatus: 1 as number,
  auditRemark: '',
});

function openAudit(row: any) {
  auditRow.value = row;
  auditForm.auditStatus = 1;
  auditForm.auditRemark = '';
  auditVisible.value = true;
}

function resetAuditForm() {
  auditForm.auditStatus = 1;
  auditForm.auditRemark = '';
  auditRow.value = null;
  auditFormRef.value?.clearValidate();
}

async function submitAudit() {
  if (!auditRow.value) return;
  auditLoading.value = true;
  try {
    await auditPost(auditRow.value.id, {
      auditStatus: auditForm.auditStatus,
      auditRemark: auditForm.auditRemark,
    });
    ElMessage.success('审核已提交');
    auditVisible.value = false;
    loadData();
  } catch (e) {
    // 拦截器已处理
  } finally {
    auditLoading.value = false;
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
</style>
