<template>
  <div class="page-container">
    <!-- 搜索 -->
    <el-form :inline="true" :model="query" class="search-form" @submit.prevent="onSearch">
      <el-form-item label="关键词">
        <el-input
          v-model="query.keyword"
          placeholder="配置键 / 配置名"
          clearable
          style="width: 200px"
          @clear="onSearch"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="分组">
        <el-select
          v-model="query.group"
          placeholder="全部分组"
          clearable
          filterable
          allow-create
          default-first-option
          style="width: 160px"
          @change="onSearch"
        >
          <el-option
            v-for="g in GROUP_OPTIONS"
            :key="g"
            :label="g"
            :value="g"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="onSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 顶部操作 -->
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="openCreate">新增配置</el-button>
    </div>

    <!-- 表格 -->
    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column label="ID" prop="id" width="70" />
      <el-table-column label="配置键" prop="configKey" width="180" show-overflow-tooltip />
      <el-table-column label="配置名" prop="configName" min-width="140" show-overflow-tooltip />
      <el-table-column label="值" prop="configValue" min-width="160">
        <template #default="{ row }">
          <el-tooltip
            :content="row.configValue"
            placement="top"
            :disabled="!row.configValue || String(row.configValue).length < 30"
          >
            <span class="ellipsis">{{ row.configValue }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="分组" prop="group" width="120" />
      <el-table-column label="类型" prop="type" width="100" />
      <el-table-column label="描述" prop="description" min-width="160" show-overflow-tooltip />
      <el-table-column label="更新时间" width="170">
        <template #default="{ row }">{{ formatTime(row.updatedAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
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

    <!-- 编辑/新增弹窗 -->
    <el-dialog
      v-model="formVisible"
      :title="formRow ? '编辑配置' : '新增配置'"
      width="560px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <el-form-item label="配置键" prop="configKey">
          <el-input v-model="form.configKey" placeholder="如 site.title" />
        </el-form-item>
        <el-form-item label="配置名" prop="configName">
          <el-input v-model="form.configName" placeholder="请输入配置名" />
        </el-form-item>
        <el-form-item label="值" prop="configValue">
          <el-input
            v-model="form.configValue"
            type="textarea"
            :rows="3"
            placeholder="请输入配置值"
          />
        </el-form-item>
        <el-form-item label="分组" prop="group">
          <el-select
            v-model="form.group"
            placeholder="请选择或输入分组"
            filterable
            allow-create
            default-first-option
            style="width: 100%"
          >
            <el-option
              v-for="g in GROUP_OPTIONS"
              :key="g"
              :label="g"
              :value="g"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-input v-model="form.type" placeholder="如 string / number / boolean / json" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="submitForm">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Search, Refresh, Plus } from '@element-plus/icons-vue';
import { getConfigList, createConfig, updateConfig, deleteConfig } from '@/api/system';

const GROUP_OPTIONS = ['system', 'business', 'notification', 'payment', 'other'];

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
  group: '' as string,
  page: 1,
  pageSize: 10,
});

async function loadData() {
  loading.value = true;
  try {
    const params: any = { page: query.page, pageSize: query.pageSize };
    if (query.keyword) params.keyword = query.keyword;
    if (query.group) params.group = query.group;
    const res: any = await getConfigList(params);
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
  query.group = '';
  query.page = 1;
  loadData();
}

async function onDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除配置「${row.configName}」吗？`, '删除确认', {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    await deleteConfig(row.id);
    ElMessage.success('删除成功');
    if (list.value.length === 1 && query.page > 1) query.page -= 1;
    loadData();
  } catch (e) {
    // 拦截器已处理
  }
}

/* 编辑/新增 */
const formVisible = ref(false);
const formLoading = ref(false);
const formRef = ref<FormInstance>();
const formRow = ref<any>(null);
const defaultForm = () => ({
  configKey: '',
  configName: '',
  configValue: '',
  group: '',
  type: '',
  description: '',
});
const form = reactive(defaultForm());
const formRules: FormRules = {
  configKey: [{ required: true, message: '请输入配置键', trigger: 'blur' }],
  configName: [{ required: true, message: '请输入配置名', trigger: 'blur' }],
  configValue: [{ required: true, message: '请输入配置值', trigger: 'blur' }],
};

function openCreate() {
  formRow.value = null;
  Object.assign(form, defaultForm());
  formVisible.value = true;
}

function openEdit(row: any) {
  formRow.value = row;
  Object.assign(form, {
    configKey: row.configKey ?? '',
    configName: row.configName ?? '',
    configValue: row.configValue ?? '',
    group: row.group ?? '',
    type: row.type ?? '',
    description: row.description ?? '',
  });
  formVisible.value = true;
}

function resetForm() {
  Object.assign(form, defaultForm());
  formRow.value = null;
  formRef.value?.clearValidate();
}

async function submitForm() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    formLoading.value = true;
    try {
      if (formRow.value) {
        await updateConfig(formRow.value.id, { ...form });
        ElMessage.success('更新成功');
      } else {
        await createConfig({ ...form });
        ElMessage.success('创建成功');
      }
      formVisible.value = false;
      loadData();
    } catch (e) {
      // 拦截器已处理
    } finally {
      formLoading.value = false;
    }
  });
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
.toolbar {
  margin-bottom: 12px;
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
