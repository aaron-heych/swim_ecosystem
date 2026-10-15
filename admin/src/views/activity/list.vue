<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :inline="true" :model="query">
        <el-form-item label="活动名称">
          <el-input
            v-model="query.keyword"
            placeholder="请输入活动名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="活动时间">
          <el-date-picker
            v-model="activityDateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            clearable
          />
        </el-form-item>
        <el-form-item label="组织方">
          <el-input
            v-model="query.organizer"
            placeholder="请输入组织方"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="query.type"
            placeholder="全部"
            clearable
            style="width: 130px"
          >
            <el-option
              v-for="opt in typeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="query.status"
            placeholder="全部"
            clearable
            style="width: 130px"
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

    <!-- 主表格 -->
    <div class="table-container">
      <div class="mb-16">
        <el-button v-if="!isSubAdmin" type="primary" @click="openCreate">
          <el-icon><Plus /></el-icon>新增活动
        </el-button>
      </div>
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column prop="title" label="活动名称" min-width="180" show-overflow-tooltip />
        <el-table-column label="类型" width="110">
          <template #default="{ row }">
            <el-tag :type="getDict(ACTIVITY_TYPE, row.type).type">
              {{ getDict(ACTIVITY_TYPE, row.type).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="活动时间" width="290">
          <template #default="{ row }">
            {{ formatTime(row.startAt) }} ~ {{ formatTime(row.endAt) }}
          </template>
        </el-table-column>
        <el-table-column label="地点" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.location || '-' }}</template>
        </el-table-column>
        <el-table-column label="组织方" width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.organizer || '-' }}</template>
        </el-table-column>
        <el-table-column label="名额" width="90" align="center">
          <template #default="{ row }">
            {{ row.joinedCount ?? 0 }}/{{ row.capacity ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getDict(ACTIVITY_STATUS, row.status).type">
              {{ getDict(ACTIVITY_STATUS, row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-dropdown trigger="click" @command="(cmd: string) => onCommand(row, cmd)">
              <el-button link type="primary" size="small">
                操作
                <el-icon style="margin-left: 4px"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="!isSubAdmin" command="edit">编辑</el-dropdown-item>
                  <el-dropdown-item command="detail" divided>详情</el-dropdown-item>
                  <el-dropdown-item v-if="!isSubAdmin" command="participation" divided>参与管理</el-dropdown-item>
                  <el-dropdown-item v-if="isSubAdmin" command="participation" divided>参与队伍</el-dropdown-item>
                  <el-dropdown-item v-if="!isSubAdmin" command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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
      width="720px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="活动名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入活动名称" />
        </el-form-item>
        <el-form-item label="活动类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%">
            <el-option
              v-for="opt in typeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="组织方" prop="organizer">
          <el-input v-model="form.organizer" placeholder="请输入组织方（如协会名称）" />
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
                :label="cityOptionLabel(c)"
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
        <el-form-item label="活动地点" prop="location">
          <el-input v-model="form.location" placeholder="请输入活动地点" />
        </el-form-item>
        <el-form-item label="活动时间" prop="startAt">
          <el-date-picker
            v-model="actTimeRange"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="报名截止" prop="regEndAt">
          <el-date-picker
            v-model="form.regEndAt"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择报名截止时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="参与费用" prop="fee">
          <el-input-number v-model="form.fee" :min="0" :precision="2" :step="10" style="width: 200px" />
          <span class="unit">元</span>
        </el-form-item>
        <el-form-item label="名额上限" prop="capacity">
          <el-input-number v-model="form.capacity" :min="0" :step="10" style="width: 200px" />
          <span class="unit">人</span>
        </el-form-item>
        <el-form-item label="联系人" prop="contactName">
          <el-input v-model="form.contactName" placeholder="请输入联系人姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item v-if="editingId" label="状态" prop="status">
          <el-select v-model="form.status" style="width: 100%">
            <el-option
              v-for="opt in statusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="活动介绍" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入活动介绍" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情 dialog -->
    <el-dialog v-model="detailDialogVisible" title="活动详情" width="720px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="活动名称" :span="2">{{ detailRow?.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="活动类型">
          <el-tag :type="getDict(ACTIVITY_TYPE, detailRow?.type).type">
            {{ getDict(ACTIVITY_TYPE, detailRow?.type).label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="组织方">{{ detailRow?.organizer || '-' }}</el-descriptions-item>
        <el-descriptions-item label="所在地区" :span="2">
          {{ [detailRow?.province, detailRow?.city, detailRow?.district].filter(Boolean).join(' / ') || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="活动地点" :span="2">{{ detailRow?.location || '-' }}</el-descriptions-item>
        <el-descriptions-item label="活动开始">{{ formatTime(detailRow?.startAt) }}</el-descriptions-item>
        <el-descriptions-item label="活动结束">{{ formatTime(detailRow?.endAt) }}</el-descriptions-item>
        <el-descriptions-item label="报名截止">{{ formatTime(detailRow?.regEndAt) }}</el-descriptions-item>
        <el-descriptions-item label="名额">{{ detailRow?.joinedCount ?? 0 }}/{{ detailRow?.capacity ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="参与费用">{{ detailRow?.fee != null ? `¥${detailRow.fee}` : '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ detailRow?.contactName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ detailRow?.contactPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getDict(ACTIVITY_STATUS, detailRow?.status).type">
            {{ getDict(ACTIVITY_STATUS, detailRow?.status).label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(detailRow?.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="活动介绍" :span="2">{{ detailRow?.description || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 参与管理 dialog -->
    <ParticipationDialog
      v-model="participationVisible"
      :target-type="2"
      :target-id="participationRow?.id ?? 0"
      :target-name="participationRow?.title"
      :readonly="isSubAdmin"
      @changed="loadData"
    />

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ArrowDown, Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import {
  getActivityList,
  createActivity,
  updateActivity,
  deleteActivity,
} from '@/api/activity';
import { getProvinces, getRegionChildren, type RegionItem } from '@/api/region';
import { useUserStore } from '@/store/user';
import ParticipationDialog from '@/components/winter/ParticipationDialog.vue';
import {
  ACTIVITY_TYPE,
  ACTIVITY_STATUS,
  getDict,
} from '@/utils/dict';

const typeOptions = Object.entries(ACTIVITY_TYPE).map(([k, v]) => ({
  value: Number(k),
  label: v.label,
}));
const statusOptions = Object.entries(ACTIVITY_STATUS).map(([k, v]) => ({
  value: Number(k),
  label: v.label,
}));

/* 主列表 */
const list = ref<any[]>([]);
const total = ref(0);
const loading = ref(false);
const activityDateRange = ref<string[]>();
const query = reactive({
  keyword: '',
  organizer: '',
  type: undefined as number | undefined,
  status: undefined as number | undefined,
  page: 1,
  pageSize: 10,
});

async function loadData() {
  loading.value = true;
  try {
    const params = {
      ...query,
      startDate: activityDateRange.value?.[0],
      endDate: activityDateRange.value?.[1],
    };
    const res: any = await getActivityList(params);
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
  query.organizer = '';
  query.type = undefined;
  query.status = undefined;
  activityDateRange.value = undefined;
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

function formatDate(d?: string | number | Date | null) {
  if (!d) return '-';
  const t = new Date(d);
  if (isNaN(t.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}
function formatTime(t?: string | number | Date | null) {
  if (!t) return '-';
  const d = new Date(t);
  if (isNaN(d.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
/** 直辖市的市级在区划表中叫「市辖区」，下拉显示为省名 */
function cityOptionLabel(c: RegionItem): string {
  if (c.name !== '市辖区') return c.name;
  return (
    provinceOptions.value.find((p) => p.id === selectedProvinceId.value)
      ?.name ?? c.name
  );
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
  form.city = cityOptionLabel(c);
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

/** 编辑回显：按 code 反查 region.id 并逐级加载子级 */
async function restoreRegionSelection() {
  selectedProvinceId.value = undefined;
  selectedCityId.value = undefined;
  selectedDistrictId.value = undefined;
  cityOptions.value = [];
  districtOptions.value = [];

  await ensureProvinces();

  if (!form.provinceCode) return;
  const p = provinceOptions.value.find((o) => o.code === form.provinceCode);
  if (!p) return;
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
const formTitle = ref('新增活动');
/** 会长（swimming_sub_admin）只读预览：无新增/编辑/参与管理/删除操作 */
const userStore = useUserStore();
const isSubAdmin = computed(() => userStore.isSubAdmin());
const submitting = ref(false);
const formRef = ref<FormInstance>();
const editingId = ref<number | null>(null);
const defaultForm = () => ({
  title: '',
  type: 1 as number,
  organizer: '',
  location: '',
  description: '',
  fee: undefined as number | undefined,
  capacity: undefined as number | undefined,
  contactName: '',
  contactPhone: '',
  status: 0 as number,
  startAt: '',
  endAt: '',
  regEndAt: '',
  province: null as string | null,
  city: null as string | null,
  district: null as string | null,
  provinceCode: null as string | null,
  cityCode: null as string | null,
  districtCode: null as string | null,
});
const form = reactive(defaultForm());

/** 活动时间范围（双向同步 startAt/endAt） */
const actTimeRange = computed<string[]>({
  get: () => {
    if (!form.startAt && !form.endAt) return [] as string[];
    return [form.startAt, form.endAt].filter(Boolean) as string[];
  },
  set: (v: string[] | null) => {
    form.startAt = v?.[0] ?? '';
    form.endAt = v?.[1] ?? '';
  },
});

const rules: FormRules = {
  title: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  provinceCode: [{ required: true, message: '请选择所在地区', trigger: 'change' }],
};

async function openCreate() {
  editingId.value = null;
  formTitle.value = '新增活动';
  Object.assign(form, defaultForm());
  await ensureProvinces();
  selectedProvinceId.value = undefined;
  selectedCityId.value = undefined;
  selectedDistrictId.value = undefined;
  cityOptions.value = [];
  districtOptions.value = [];
  formDialogVisible.value = true;
}
/** ISO 时间转 el-date-picker 本地时区输入格式，避免回显成 UTC */
function toLocalInput(v?: string | null): string {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
async function openEdit(row: any) {
  editingId.value = row.id;
  formTitle.value = '编辑活动';
  Object.assign(form, {
    title: row.title ?? '',
    type: row.type ?? 1,
    organizer: row.organizer ?? '',
    location: row.location ?? '',
    description: row.description ?? '',
    fee: row.fee ?? undefined,
    capacity: row.capacity ?? undefined,
    contactName: row.contactName ?? '',
    contactPhone: row.contactPhone ?? '',
    status: row.status ?? 0,
    startAt: toLocalInput(row.startAt),
    endAt: toLocalInput(row.endAt),
    regEndAt: toLocalInput(row.regEndAt),
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
        await updateActivity(editingId.value, { ...form });
        ElMessage.success('更新成功');
      } else {
        await createActivity({ ...form });
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

/* ============================ 活动详情 ============================ */
const detailDialogVisible = ref(false);
const detailRow = ref<any>(null);
function openDetail(row: any) {
  detailRow.value = row;
  detailDialogVisible.value = true;
}

/* ============================ 操作下拉 ============================ */
const participationVisible = ref(false);
const participationRow = ref<any>(null);

function onCommand(row: any, cmd: string) {
  if (cmd === 'edit') openEdit(row);
  else if (cmd === 'detail') openDetail(row);
  else if (cmd === 'participation') {
    participationRow.value = row;
    participationVisible.value = true;
  } else if (cmd === 'delete') removeRow(row);
}

/* ============================ 删除活动 ============================ */
async function removeRow(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除活动「${row.title}」？`, '警告', {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    await deleteActivity(row.id);
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
.unit {
  margin-left: 8px;
  color: #909399;
}
</style>
