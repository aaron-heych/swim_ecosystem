<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :inline="true" :model="query">
        <el-form-item label="名称/地址">
          <el-input
            v-model="query.keyword"
            placeholder="请输入场馆名称/地址"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
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
        <el-form-item label="启用状态">
          <el-select
            v-model="query.status"
            placeholder="全部"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="opt in statusOptions"
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
          <el-icon><Plus /></el-icon>新增场馆
        </el-button>
      </div>
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
        <el-table-column label="省/市/区" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ [row.province, row.city, row.district].filter(Boolean).join(' / ') || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="详细地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getDict(AUDIT_STATUS, row.auditStatus).type">
              {{ getDict(AUDIT_STATUS, row.auditStatus).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getDict(ENABLE_STATUS, row.status).type">
              {{ getDict(ENABLE_STATUS, row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="warning" size="small" @click="openAudit(row)">审核</el-button>
            <el-button
              link
              :type="row.status === 1 ? 'danger' : 'success'"
              size="small"
              @click="toggleStatus(row)"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
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
      width="640px"
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="场馆名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入场馆名称" />
        </el-form-item>
        <el-form-item label="所在地区" prop="provinceCode">
          <div class="region-cascader">
            <el-select
              v-model="selectedProvinceId"
              placeholder="省"
              clearable
              filterable
              style="width: 33%"
              @change="onProvinceChange"
              @visible-change="onProvinceDropdownVisible"
            >
              <el-option
                v-for="p in provinceOptions"
                :key="p.id"
                :label="p.name"
                :value="p.id"
              />
            </el-select>
            <el-select
              v-model="selectedCityId"
              placeholder="市"
              clearable
              filterable
              :disabled="!selectedProvinceId"
              style="width: 33%"
              @change="onCityChange"
            >
              <el-option
                v-for="c in cityOptions"
                :key="c.id"
                :label="c.name"
                :value="c.id"
              />
            </el-select>
            <el-select
              v-model="selectedDistrictId"
              placeholder="区/县"
              clearable
              filterable
              :disabled="!selectedCityId"
              style="width: 33%"
              @change="onDistrictChange"
            >
              <el-option
                v-for="d in districtOptions"
                :key="d.id"
                :label="d.name"
                :value="d.id"
              />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="详细地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入详细地址" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="经度" prop="longitude">
          <el-input-number v-model="form.longitude" :precision="6" :step="0.000001" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="纬度" prop="latitude">
          <el-input-number v-model="form.latitude" :precision="6" :step="0.000001" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="营业时间" prop="businessHours">
          <el-input v-model="form.businessHours" placeholder="如 08:00-22:00" />
        </el-form-item>
        <el-form-item label="描述" prop="intro">
          <el-input v-model="form.intro" type="textarea" :rows="3" placeholder="请输入描述" />
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
      title="场馆审核"
      width="500px"
      @closed="resetAuditForm"
    >
      <el-form ref="auditFormRef" :model="auditForm" :rules="auditRules" label-width="100px">
        <el-form-item label="场馆名称">
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
  getVenueList,
  createVenue,
  updateVenue,
  auditVenue,
  updateVenueStatus,
  deleteVenue,
} from '@/api/venue';
import { getProvinces, getRegionChildren, type RegionItem } from '@/api/region';
import { AUDIT_STATUS, ENABLE_STATUS, getDict } from '@/utils/dict';

const auditOptions = Object.entries(AUDIT_STATUS).map(([k, v]) => ({
  value: Number(k),
  label: v.label,
}));
const statusOptions = Object.entries(ENABLE_STATUS).map(([k, v]) => ({
  value: Number(k),
  label: v.label,
}));

const list = ref<any[]>([]);
const total = ref(0);
const loading = ref(false);
const query = reactive({
  keyword: '',
  auditStatus: undefined as number | undefined,
  status: undefined as number | undefined,
  page: 1,
  pageSize: 10,
});

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getVenueList(query);
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

/* ============================ 省/市/区级联 ============================ */
const provinceOptions = ref<RegionItem[]>([]);
const cityOptions = ref<RegionItem[]>([]);
const districtOptions = ref<RegionItem[]>([]);
const selectedProvinceId = ref<number | undefined>(undefined);
const selectedCityId = ref<number | undefined>(undefined);
const selectedDistrictId = ref<number | undefined>(undefined);

async function ensureProvinces() {
  if (provinceOptions.value.length) return;
  try {
    provinceOptions.value = await getProvinces();
  } catch (e) {
    // 错误已在拦截器处理
  }
}
function onProvinceDropdownVisible(v: boolean) {
  if (v) ensureProvinces();
}
async function onProvinceChange(provinceId: number | undefined) {
  selectedCityId.value = undefined;
  selectedDistrictId.value = undefined;
  cityOptions.value = [];
  districtOptions.value = [];
  const p = provinceOptions.value.find((o) => o.id === provinceId);
  if (!provinceId || !p) {
    form.provinceCode = null;
    form.province = null;
    form.cityCode = null;
    form.city = null;
    form.districtCode = null;
    form.district = null;
    return;
  }
  form.provinceCode = p.code;
  form.province = p.name;
  form.cityCode = null;
  form.city = null;
  form.districtCode = null;
  form.district = null;
  try {
    cityOptions.value = await getRegionChildren(provinceId);
  } catch (e) {
    // 错误已在拦截器处理
  }
}
async function onCityChange(cityId: number | undefined) {
  selectedDistrictId.value = undefined;
  districtOptions.value = [];
  const c = cityOptions.value.find((o) => o.id === cityId);
  if (!cityId || !c) {
    form.cityCode = null;
    form.city = null;
    form.districtCode = null;
    form.district = null;
    return;
  }
  form.cityCode = c.code;
  form.city = c.name;
  form.districtCode = null;
  form.district = null;
  try {
    districtOptions.value = await getRegionChildren(cityId);
  } catch (e) {
    // 错误已在拦截器处理
  }
}
function onDistrictChange(districtId: number | undefined) {
  const d = districtOptions.value.find((o) => o.id === districtId);
  if (!districtId || !d) {
    form.districtCode = null;
    form.district = null;
    return;
  }
  form.districtCode = d.code;
  form.district = d.name;
}

/** 编辑回显：按 venue 的 code 反查 region.id 并逐级加载子级 */
async function restoreRegionSelection() {
  selectedProvinceId.value = undefined;
  selectedCityId.value = undefined;
  selectedDistrictId.value = undefined;
  cityOptions.value = [];
  districtOptions.value = [];

  await ensureProvinces();

  if (!form.provinceCode) return;
  const p = provinceOptions.value.find((o) => o.code === form.provinceCode);
  if (!p) return; // 编码找不到（未入库或已禁用），让用户重选
  selectedProvinceId.value = p.id;
  try {
    cityOptions.value = await getRegionChildren(p.id);
  } catch (e) {
    return;
  }

  if (!form.cityCode) return;
  const c = cityOptions.value.find((o) => o.code === form.cityCode);
  if (!c) return;
  selectedCityId.value = c.id;
  try {
    districtOptions.value = await getRegionChildren(c.id);
  } catch (e) {
    return;
  }

  if (!form.districtCode) return;
  const d = districtOptions.value.find((o) => o.code === form.districtCode);
  if (!d) return;
  selectedDistrictId.value = d.id;
}

/* ============================ 新增/编辑 ============================ */
const formDialogVisible = ref(false);
const formTitle = ref('新增场馆');
const submitting = ref(false);
const formRef = ref<FormInstance>();
const editingId = ref<number | null>(null);
const defaultForm = () => ({
  name: '',
  address: '',
  phone: '',
  longitude: undefined as number | undefined,
  latitude: undefined as number | undefined,
  businessHours: '',
  intro: '',
  province: null as string | null,
  city: null as string | null,
  district: null as string | null,
  provinceCode: null as string | null,
  cityCode: null as string | null,
  districtCode: null as string | null,
});
const form = reactive(defaultForm());
const rules: FormRules = {
  name: [{ required: true, message: '请输入场馆名称', trigger: 'blur' }],
  address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
};

async function openCreate() {
  editingId.value = null;
  formTitle.value = '新增场馆';
  Object.assign(form, defaultForm());
  await ensureProvinces();
  selectedProvinceId.value = undefined;
  selectedCityId.value = undefined;
  selectedDistrictId.value = undefined;
  cityOptions.value = [];
  districtOptions.value = [];
  formDialogVisible.value = true;
}
async function openEdit(row: any) {
  editingId.value = row.id;
  formTitle.value = '编辑场馆';
  Object.assign(form, {
    name: row.name ?? '',
    address: row.address ?? '',
    phone: row.phone ?? '',
    longitude: row.longitude,
    latitude: row.latitude,
    businessHours: row.businessHours ?? '',
    intro: row.intro ?? '',
    province: row.province ?? null,
    city: row.city ?? null,
    district: row.district ?? null,
    provinceCode: row.provinceCode ?? null,
    cityCode: row.cityCode ?? null,
    districtCode: row.districtCode ?? null,
  });
  await restoreRegionSelection();
  formDialogVisible.value = true;
}
function resetForm() {
  formRef.value?.resetFields();
  Object.assign(form, defaultForm());
  editingId.value = null;
  selectedProvinceId.value = undefined;
  selectedCityId.value = undefined;
  selectedDistrictId.value = undefined;
  cityOptions.value = [];
  districtOptions.value = [];
}
async function submitForm() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      if (editingId.value) {
        await updateVenue(editingId.value, { ...form });
        ElMessage.success('更新成功');
      } else {
        await createVenue({ ...form });
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

/* ============================ 审核 ============================ */
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
      await auditVenue(auditTarget.value.id, {
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

/* ============================ 启用/禁用 ============================ */
async function toggleStatus(row: any) {
  const next = row.status === 1 ? 0 : 1;
  const action = next === 1 ? '启用' : '禁用';
  try {
    await ElMessageBox.confirm(`确定${action}场馆「${row.name}」？`, '提示', {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    await updateVenueStatus(row.id, next);
    ElMessage.success(`${action}成功`);
    loadData();
  } catch (e) {
    // 错误已在拦截器处理
  }
}

/* ============================ 删除 ============================ */
async function removeRow(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除场馆「${row.name}」？该操作不可恢复。`, '警告', {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    await deleteVenue(row.id);
    ElMessage.success('删除成功');
    loadData();
  } catch (e) {
    // 错误已在拦截器处理
  }
}

onMounted(loadData);
</script>

<style scoped>
.region-cascader {
  display: flex;
  gap: 8px;
  width: 100%;
}
</style>
