<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :inline="true" :model="query">
        <el-form-item label="教练姓名">
          <el-input
            v-model="query.keyword"
            placeholder="请输入教练姓名"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="所属场馆">
          <el-select
            v-model="query.venueId"
            placeholder="全部场馆"
            clearable
            filterable
            style="width: 180px"
          >
            <el-option
              v-for="v in venueOptions"
              :key="v.id"
              :label="v.name"
              :value="v.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select
            v-model="query.auditStatus"
            placeholder="全部"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="opt in auditOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="上架状态">
          <el-select
            v-model="query.status"
            placeholder="全部"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="opt in shelfOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格 -->
    <div class="table-container">
      <div class="mb-16">
        <el-button type="primary" @click="openCreate">
          <el-icon><Plus /></el-icon>新增教练
        </el-button>
      </div>
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :size="40" :src="row.avatar" icon="UserFilled" />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="phone" label="手机" width="130" />
        <el-table-column label="所属场馆" min-width="160">
          <template #default="{ row }">{{ row.venue?.name ?? '-' }}</template>
        </el-table-column>
        <el-table-column prop="specialty" label="专长" min-width="140" show-overflow-tooltip />
        <el-table-column label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getDict(AUDIT_STATUS, row.auditStatus).type">
              {{ getDict(AUDIT_STATUS, row.auditStatus).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="上架状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getDict(SHELF_STATUS, row.status).type">
              {{ getDict(SHELF_STATUS, row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="warning" size="small" @click="openAudit(row)">审核</el-button>
            <el-button
              link
              :type="row.status === 1 ? 'danger' : 'success'"
              size="small"
              @click="toggleStatus(row)"
            >
              {{ row.status === 1 ? '下架' : '上架' }}
            </el-button>
            <el-button link type="danger" size="small" @click="removeRow(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-size="query.pageSize"
          :current-page="query.page"
          :page-sizes="[10, 20, 50]"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 新增/编辑 dialog -->
    <el-dialog
      v-model="formDialogVisible"
      :title="formTitle"
      width="600px"
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入教练姓名" />
        </el-form-item>
        <el-form-item label="手机" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="所属场馆" prop="venueId">
          <el-select
            v-model="form.venueId"
            placeholder="请选择场馆"
            filterable
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="v in venueOptions"
              :key="v.id"
              :label="v.name"
              :value="v.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="专长" prop="specialty">
          <el-input v-model="form.specialty" placeholder="如 自由泳/蝶泳/教学" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 审核 dialog -->
    <el-dialog
      v-model="auditDialogVisible"
      title="教练审核"
      width="500px"
      @closed="resetAuditForm"
    >
      <el-form ref="auditFormRef" :model="auditForm" :rules="auditRules" label-width="100px">
        <el-form-item label="教练姓名">
          <span>{{ auditTarget?.name }}</span>
        </el-form-item>
        <el-form-item label="审核结果" prop="auditStatus">
          <el-radio-group v-model="auditForm.auditStatus">
            <el-radio :value="1">通过</el-radio>
            <el-radio :value="2">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核备注" prop="auditRemark">
          <el-input v-model="auditForm.auditRemark" type="textarea" :rows="3" placeholder="请输入审核备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAudit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import {
  getCoachList,
  createCoach,
  updateCoach,
  auditCoach,
  updateCoachStatus,
  deleteCoach,
  getVenueList,
} from '@/api/venue';
import { AUDIT_STATUS, SHELF_STATUS, getDict } from '@/utils/dict';

const auditOptions = Object.entries(AUDIT_STATUS).map(([k, v]) => ({
  value: Number(k),
  label: v.label,
}));
const shelfOptions = Object.entries(SHELF_STATUS).map(([k, v]) => ({
  value: Number(k),
  label: v.label,
}));

const list = ref<any[]>([]);
const total = ref(0);
const loading = ref(false);
const query = reactive({
  keyword: '',
  venueId: undefined as number | undefined,
  auditStatus: undefined as number | undefined,
  status: undefined as number | undefined,
  page: 1,
  pageSize: 10,
});

const venueOptions = ref<any[]>([]);
async function loadVenueOptions() {
  try {
    const res: any = await getVenueList({ page: 1, pageSize: 100 });
    venueOptions.value = res?.list ?? [];
  } catch (e) {
    // 错误已在拦截器处理
  }
}

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getCoachList(query);
    list.value = res?.list ?? [];
    total.value = res?.total ?? 0;
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.page = 1;
  loadData();
}
function handleReset() {
  query.keyword = '';
  query.venueId = undefined;
  query.auditStatus = undefined;
  query.status = undefined;
  query.page = 1;
  loadData();
}
function handleSizeChange(size: number) {
  query.pageSize = size;
  query.page = 1;
  loadData();
}
function handlePageChange(p: number) {
  query.page = p;
  loadData();
}

function formatTime(t?: string | number | Date | null) {
  if (!t) return '-';
  const d = new Date(t);
  if (isNaN(d.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* 新增/编辑 */
const formDialogVisible = ref(false);
const formTitle = ref('新增教练');
const submitting = ref(false);
const formRef = ref<FormInstance>();
const editingId = ref<number | null>(null);
const defaultForm = () => ({
  name: '',
  phone: '',
  venueId: undefined as number | undefined,
  specialty: '',
  description: '',
});
const form = reactive(defaultForm());
const rules: FormRules = {
  name: [{ required: true, message: '请输入教练姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  venueId: [{ required: true, message: '请选择所属场馆', trigger: 'change' }],
};

function openCreate() {
  editingId.value = null;
  formTitle.value = '新增教练';
  Object.assign(form, defaultForm());
  formDialogVisible.value = true;
}
function openEdit(row: any) {
  editingId.value = row.id;
  formTitle.value = '编辑教练';
  Object.assign(form, {
    name: row.name ?? '',
    phone: row.phone ?? '',
    venueId: row.venueId ?? row.venue?.id,
    specialty: row.specialty ?? '',
    description: row.description ?? '',
  });
  formDialogVisible.value = true;
}
function resetForm() {
  formRef.value?.resetFields();
  Object.assign(form, defaultForm());
  editingId.value = null;
}
async function submitForm() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      if (editingId.value) {
        await updateCoach(editingId.value, { ...form });
        ElMessage.success('更新成功');
      } else {
        await createCoach({ ...form });
        ElMessage.success('创建成功');
      }
      formDialogVisible.value = false;
      loadData();
    } catch (e) {
      // 错误已在拦截器处理
    } finally {
      submitting.value = false;
    }
  });
}

/* 审核 */
const auditDialogVisible = ref(false);
const auditFormRef = ref<FormInstance>();
const auditTarget = ref<any>(null);
const auditForm = reactive({ auditStatus: 1, auditRemark: '' });
const auditRules: FormRules = {
  auditStatus: [{ required: true, message: '请选择审核结果', trigger: 'change' }],
};
function openAudit(row: any) {
  auditTarget.value = row;
  auditForm.auditStatus = 1;
  auditForm.auditRemark = '';
  auditDialogVisible.value = true;
}
function resetAuditForm() {
  auditFormRef.value?.resetFields();
  auditForm.auditStatus = 1;
  auditForm.auditRemark = '';
  auditTarget.value = null;
}
async function submitAudit() {
  if (!auditFormRef.value) return;
  await auditFormRef.value.validate(async (valid) => {
    if (!valid) return;
    if (!auditTarget.value) return;
    submitting.value = true;
    try {
      await auditCoach(auditTarget.value.id, {
        auditStatus: auditForm.auditStatus,
        auditRemark: auditForm.auditRemark,
      });
      ElMessage.success('审核完成');
      auditDialogVisible.value = false;
      loadData();
    } catch (e) {
      // 错误已在拦截器处理
    } finally {
      submitting.value = false;
    }
  });
}

/* 上架/下架 */
async function toggleStatus(row: any) {
  const next = row.status === 1 ? 0 : 1;
  const action = next === 1 ? '上架' : '下架';
  try {
    await ElMessageBox.confirm(`确定${action}教练「${row.name}」？`, '提示', {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    await updateCoachStatus(row.id, next);
    ElMessage.success(`${action}成功`);
    loadData();
  } catch (e) {
    // 错误已在拦截器处理
  }
}

/* 删除 */
async function removeRow(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除教练「${row.name}」？该操作不可恢复。`, '警告', {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    await deleteCoach(row.id);
    ElMessage.success('删除成功');
    loadData();
  } catch (e) {
    // 错误已在拦截器处理
  }
}

onMounted(() => {
  loadVenueOptions();
  loadData();
});
</script>
