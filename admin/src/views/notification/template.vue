<template>
  <div class="page-container">
    <!-- 搜索 -->
    <el-form :inline="true" :model="query" class="search-form" @submit.prevent="onSearch">
      <el-form-item label="关键词">
        <el-input
          v-model="query.keyword"
          placeholder="名称 / 编码"
          clearable
          style="width: 200px"
          @clear="onSearch"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="类型">
        <el-select
          v-model="query.type"
          placeholder="全部类型"
          clearable
          style="width: 140px"
          @change="onSearch"
        >
          <el-option
            v-for="item in TEMPLATE_TYPE_OPTIONS"
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

    <!-- 顶部操作 -->
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="openCreate">新增模板</el-button>
    </div>

    <!-- 表格 -->
    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column label="ID" prop="id" width="70" />
      <el-table-column label="名称" prop="name" min-width="140" show-overflow-tooltip />
      <el-table-column label="编码" prop="code" width="140" />
      <el-table-column label="类型" width="90" align="center">
        <template #default="{ row }">{{ getTemplateType(row.type) }}</template>
      </el-table-column>
      <el-table-column label="标题" prop="title" min-width="160" show-overflow-tooltip />
      <el-table-column label="渠道" width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="channelTagType(row.channel)">
            {{ row.channel }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="getDict(ENABLE_STATUS, row.status).type">
            {{ getDict(ENABLE_STATUS, row.status).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" width="170">
        <template #default="{ row }">{{ formatTime(row.updatedAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="success" size="small" @click="openSend(row)">发送</el-button>
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
      :title="formRow ? '编辑模板' : '新增模板'"
      width="560px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入模板编码" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%">
            <el-option
              v-for="item in TEMPLATE_TYPE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            placeholder="支持 {{变量}} 占位符"
          />
        </el-form-item>
        <el-form-item label="渠道" prop="channel">
          <el-select v-model="form.channel" placeholder="请选择渠道" style="width: 100%">
            <el-option
              v-for="c in CHANNEL_OPTIONS"
              :key="c"
              :label="c"
              :value="c"
            />
          </el-select>
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
        <el-button type="primary" :loading="formLoading" @click="submitForm">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 发送弹窗 -->
    <el-dialog
      v-model="sendVisible"
      title="发送通知"
      width="500px"
      @closed="resetSendForm"
    >
      <el-form ref="sendFormRef" :model="sendForm" label-width="90px">
        <el-form-item label="模板">
          <span>{{ sendRow?.name }}（{{ sendRow?.code }}）</span>
        </el-form-item>
        <el-form-item label="接收用户ID" prop="userId" required>
          <el-input v-model="sendForm.userId" placeholder="请输入接收用户ID" />
        </el-form-item>
        <el-form-item label="参数JSON" prop="params">
          <el-input
            v-model="sendForm.params"
            type="textarea"
            :rows="4"
            placeholder='例如 {"nick":"张三"}，可留空'
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sendVisible = false">取消</el-button>
        <el-button type="primary" :loading="sendLoading" @click="submitSend">
          发送
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Search, Refresh, Plus } from '@element-plus/icons-vue';
import {
  getTemplateList,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  sendNotification,
} from '@/api/notification';
import { ENABLE_STATUS, getDict } from '@/utils/dict';

const TEMPLATE_TYPE_OPTIONS = [
  { value: 1, label: '系统' },
  { value: 2, label: '活动' },
  { value: 3, label: '订单' },
];
const CHANNEL_OPTIONS = ['in_app', 'sms', 'wechat'];
const CHANNEL_TAG: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
  in_app: 'primary',
  sms: 'success',
  wechat: 'warning',
};

function getTemplateType(t: number) {
  return TEMPLATE_TYPE_OPTIONS.find((i) => i.value === t)?.label || '-';
}
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
  keyword: '',
  type: undefined as number | undefined,
  page: 1,
  pageSize: 10,
});

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getTemplateList(query);
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
  query.type = undefined;
  query.page = 1;
  loadData();
}

async function onDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除模板「${row.name}」吗？`, '删除确认', {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    await deleteTemplate(row.id);
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
  name: '',
  code: '',
  type: 1 as number,
  title: '',
  content: '',
  channel: 'in_app',
  status: 1 as number,
});
const form = reactive(defaultForm());
const formRules: FormRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入模板编码', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  channel: [{ required: true, message: '请选择渠道', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
};

function openCreate() {
  formRow.value = null;
  Object.assign(form, defaultForm());
  formVisible.value = true;
}

function openEdit(row: any) {
  formRow.value = row;
  Object.assign(form, {
    name: row.name ?? '',
    code: row.code ?? '',
    type: row.type ?? 1,
    title: row.title ?? '',
    content: row.content ?? '',
    channel: row.channel ?? 'in_app',
    status: row.status ?? 1,
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
        await updateTemplate(formRow.value.id, { ...form });
        ElMessage.success('更新成功');
      } else {
        await createTemplate({ ...form });
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

/* 发送 */
const sendVisible = ref(false);
const sendLoading = ref(false);
const sendFormRef = ref<FormInstance>();
const sendRow = ref<any>(null);
const sendForm = reactive({
  userId: '',
  params: '',
});

function openSend(row: any) {
  sendRow.value = row;
  sendForm.userId = '';
  sendForm.params = '';
  sendVisible.value = true;
}

function resetSendForm() {
  sendForm.userId = '';
  sendForm.params = '';
  sendRow.value = null;
  sendFormRef.value?.clearValidate();
}

async function submitSend() {
  if (!sendRow.value) return;
  if (!sendForm.userId) {
    ElMessage.warning('请输入接收用户ID');
    return;
  }
  let params: any = {};
  if (sendForm.params.trim()) {
    try {
      params = JSON.parse(sendForm.params);
    } catch {
      ElMessage.error('参数JSON格式错误');
      return;
    }
  }
  sendLoading.value = true;
  try {
    await sendNotification({
      templateId: sendRow.value.id,
      userId: Number(sendForm.userId),
      params,
    });
    ElMessage.success('发送请求已提交');
    sendVisible.value = false;
  } catch (e) {
    // 拦截器已处理
  } finally {
    sendLoading.value = false;
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
.toolbar {
  margin-bottom: 12px;
}
.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
