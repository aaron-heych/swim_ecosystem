<template>
  <div class="page">
    <!-- 搜索 -->
    <el-form :inline="true" :model="query" class="search-form">
      <el-form-item label="名称">
        <el-input
          v-model="query.keyword"
          placeholder="抓取源名称"
          clearable
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 140px">
          <el-option
            v-for="(item, k) in SOURCE_STATUS"
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

    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="openCreate">新增抓取源</el-button>
    </div>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
      <el-table-column prop="sourceType" label="源类型" width="100" />
      <el-table-column prop="url" label="URL" min-width="220" show-overflow-tooltip />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="getDict(SOURCE_STATUS, row.status).type">
            {{ getDict(SOURCE_STATUS, row.status).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="最近抓取时间" width="180">
        <template #default="{ row }">{{ formatTime(row.lastCrawlAt) }}</template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button link type="success" @click="onTrigger(row)">触发抓取</el-button>
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
        </template>
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

    <!-- 编辑/新增 -->
    <el-dialog
      v-model="formVisible"
      :title="form.id ? '编辑抓取源' : '新增抓取源'"
      width="560px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="抓取源名称" />
        </el-form-item>
        <el-form-item label="源类型" prop="sourceType">
          <el-input v-model="form.sourceType" placeholder="如 url / api" />
        </el-form-item>
        <el-form-item label="URL" prop="url">
          <el-input v-model="form.url" placeholder="抓取目标 URL" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="描述" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="onSubmitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import {
  getSourceList,
  createSource,
  updateSource,
  deleteSource,
  triggerCrawl,
} from '@/api/event';
import { SOURCE_STATUS, getDict } from '@/utils/dict';

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
  keyword: '',
  status: undefined as number | undefined,
});

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getSourceList({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword || undefined,
      status: query.status,
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
  query.keyword = '';
  query.status = undefined;
  query.page = 1;
  loadData();
}

/* 表单 */
const formVisible = ref(false);
const formRef = ref<FormInstance>();
const submitting = ref(false);
const form = reactive({
  id: 0,
  name: '',
  sourceType: '',
  url: '',
  description: '',
  status: 1,
});

function resetForm() {
  form.id = 0;
  form.name = '';
  form.sourceType = '';
  form.url = '';
  form.description = '';
  form.status = 1;
  formRef.value?.resetFields();
}

function openCreate() {
  resetForm();
  formVisible.value = true;
}

function openEdit(row: any) {
  resetForm();
  Object.assign(form, {
    id: row.id,
    name: row.name || '',
    sourceType: row.sourceType || '',
    url: row.url || '',
    description: row.description || '',
    status: row.status ?? 1,
  });
  formVisible.value = true;
}

async function onSubmitForm() {
  submitting.value = true;
  try {
    if (form.id) {
      await updateSource(form.id, { ...form });
      ElMessage.success('编辑成功');
    } else {
      await createSource({ ...form });
      ElMessage.success('新增成功');
    }
    formVisible.value = false;
    loadData();
  } catch (e) {
    // 拦截器已提示
  } finally {
    submitting.value = false;
  }
}

/* 触发抓取 */
async function onTrigger(row: any) {
  try {
    await ElMessageBox.confirm(`确认触发抓取源「${row.name}」？`, '提示', {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    await triggerCrawl(row.id);
    ElMessage.success('抓取任务已触发，请到抓取日志查看');
    loadData();
  } catch (e) {
    // 拦截器已提示
  }
}

/* 删除 */
async function onDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除抓取源「${row.name}」？`, '危险操作', {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    await deleteSource(row.id);
    ElMessage.success('删除成功');
    loadData();
  } catch (e) {
    // 拦截器已提示
  }
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
.toolbar {
  margin-bottom: 12px;
  display: flex;
  justify-content: flex-end;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
