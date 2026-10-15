<template>
  <div class="page-container">
    <!-- 搜索 -->
    <el-form :inline="true" :model="query" class="search-form" @submit.prevent="onSearch">
      <el-form-item label="处理状态">
        <el-select
          v-model="query.status"
          placeholder="全部状态"
          clearable
          style="width: 160px"
          @change="onSearch"
        >
          <el-option
            v-for="item in REPORT_STATUS_OPTIONS"
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
      <el-table-column label="举报人" prop="reporterName" width="120" />
      <el-table-column label="对象类型" prop="targetType" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.targetType === 'post' ? 'primary' : 'warning'">
            {{ row.targetType === 'post' ? '帖子' : '评论' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="对象ID" prop="targetId" width="90" align="center" />
      <el-table-column label="举报原因" prop="reason" min-width="200" show-overflow-tooltip />
      <el-table-column label="状态" width="130" align="center">
        <template #default="{ row }">
          <el-tag :type="getDict(REPORT_STATUS, row.status).type">
            {{ getDict(REPORT_STATUS, row.status).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="举报时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            size="small"
            :disabled="row.status !== 0"
            @click="openHandle(row)"
          >
            处理
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

    <!-- 处理弹窗 -->
    <el-dialog
      v-model="handleVisible"
      title="举报处理"
      width="480px"
      @closed="resetHandleForm"
    >
      <el-form ref="handleFormRef" :model="handleForm" label-width="90px">
        <el-form-item label="举报原因">
          <span>{{ handleRow?.reason }}</span>
        </el-form-item>
        <el-form-item label="处理结果" prop="handleType" required>
          <el-radio-group v-model="handleForm.handleType">
            <el-radio :value="1">违规</el-radio>
            <el-radio :value="2">忽略</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理备注" prop="handleRemark">
          <el-input
            v-model="handleForm.handleRemark"
            type="textarea"
            :rows="3"
            placeholder="请输入处理备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleVisible = false">取消</el-button>
        <el-button type="primary" :loading="handleLoading" @click="submitHandle">
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
import { getReportList, handleReport } from '@/api/circle';
import { REPORT_STATUS, getDict } from '@/utils/dict';

const REPORT_STATUS_OPTIONS = Object.entries(REPORT_STATUS).map(([k, v]) => ({
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
  status: undefined as number | undefined,
  page: 1,
  pageSize: 10,
});

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getReportList(query);
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
  query.status = undefined;
  query.page = 1;
  loadData();
}

/* 处理 */
const handleVisible = ref(false);
const handleLoading = ref(false);
const handleFormRef = ref<FormInstance>();
const handleRow = ref<any>(null);
const handleForm = reactive({
  handleType: 1 as number,
  handleRemark: '',
});

function openHandle(row: any) {
  handleRow.value = row;
  handleForm.handleType = 1;
  handleForm.handleRemark = '';
  handleVisible.value = true;
}

function resetHandleForm() {
  handleForm.handleType = 1;
  handleForm.handleRemark = '';
  handleRow.value = null;
  handleFormRef.value?.clearValidate();
}

async function submitHandle() {
  if (!handleRow.value) return;
  handleLoading.value = true;
  try {
    await handleReport(handleRow.value.id, {
      handleType: handleForm.handleType,
      handleRemark: handleForm.handleRemark,
    });
    ElMessage.success('处理成功');
    handleVisible.value = false;
    loadData();
  } catch (e) {
    // 拦截器已处理
  } finally {
    handleLoading.value = false;
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
