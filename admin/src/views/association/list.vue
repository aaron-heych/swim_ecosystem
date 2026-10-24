<template>
  <div class="page-container">
    <!-- 会长视角：我的协会（不展示协会列表，直接呈现所属协会信息） -->
    <div v-if="isSubAdmin" class="table-container">
      <el-card v-loading="loading" class="my-assoc-card" shadow="never">
        <template #header>
          <div class="my-assoc-header">
            <div class="my-assoc-title">
              <span class="my-assoc-name">{{ myAssoc?.name || '我的协会' }}</span>
              <el-tag
                v-if="myAssoc"
                :type="getDict(ASSOC_STATUS, myAssoc.status).type"
                size="small"
              >
                {{ getDict(ASSOC_STATUS, myAssoc.status).label }}
              </el-tag>
            </div>
            <div class="my-assoc-actions">
              <el-button type="primary" :disabled="!myAssoc" @click="openEdit(myAssoc)">
                编辑协会信息
              </el-button>
              <el-button :disabled="!myAssoc" @click="goMembers(myAssoc)">会员管理</el-button>
            </div>
          </div>
        </template>
        <el-descriptions v-if="myAssoc" :column="2" border>
          <el-descriptions-item label="协会名称">{{ myAssoc.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="协会简称">{{ myAssoc.shortName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="所在地区" :span="2">
            {{ [myAssoc.province, myAssoc.city, myAssoc.district].filter(Boolean).join(' / ') || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="详细地址" :span="2">{{ myAssoc.address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="负责人微信">{{ myAssoc.wechat || '-' }}</el-descriptions-item>
          <el-descriptions-item label="教练员">{{ myAssoc.coach || '-' }}</el-descriptions-item>
          <el-descriptions-item label="成立日期">{{ formatDate(myAssoc.establishDate) }}</el-descriptions-item>
          <el-descriptions-item label="会员数">{{ myAssoc.memberCount ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="审核状态">
            <el-tag :type="getDict(AUDIT_STATUS, myAssoc.auditStatus).type">
              {{ getDict(AUDIT_STATUS, myAssoc.auditStatus).label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatTime(myAssoc.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="协会简介" :span="2">{{ myAssoc.intro || '-' }}</el-descriptions-item>
        </el-descriptions>
        <el-empty v-else-if="!loading" description="未找到所属协会，请联系管理员分配" />
      </el-card>
    </div>

    <template v-else>
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :inline="true" :model="query">
        <el-form-item v-if="!isSubAdmin" label="协会名称">
          <el-input
            v-model="query.keyword"
            placeholder="请输入协会名称/简称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item v-if="!isSubAdmin" label="负责人">
          <el-input
            v-model="query.contactName"
            placeholder="请输入负责人"
            clearable
            style="width: 150px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item v-if="!isSubAdmin" label="负责人电话">
          <el-input
            v-model="query.contactPhone"
            placeholder="请输入电话"
            clearable
            style="width: 150px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="成立日期">
          <el-date-picker
            v-model="establishDateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            range-separator="至"
            clearable
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="query.status"
            placeholder="全部"
            clearable
            style="width: 130px"
          >
            <el-option
              v-for="opt in assocStatusOptions"
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
        <el-button v-if="!isSubAdmin" @click="openImport">
          批量导入
        </el-button>
        <el-button v-if="!isSubAdmin" type="primary" @click="openCreate">
          <el-icon><Plus /></el-icon>新增协会
        </el-button>
      </div>
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column
          v-if="!isSubAdmin"
          prop="name"
          label="协会名称"
          min-width="170"
          show-overflow-tooltip
        />
        <el-table-column prop="shortName" label="协会简称" width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.shortName || '-' }}</template>
        </el-table-column>
        <el-table-column v-if="!isSubAdmin" prop="contactName" label="负责人" width="100">
          <template #default="{ row }">{{ row.contactName || '-' }}</template>
        </el-table-column>
        <el-table-column v-if="!isSubAdmin" prop="contactPhone" label="负责人电话" width="130">
          <template #default="{ row }">{{ row.contactPhone || '-' }}</template>
        </el-table-column>
        <el-table-column label="成立日期" width="110">
          <template #default="{ row }">{{ formatDate(row.establishDate) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getDict(ASSOC_STATUS, row.status).type">
              {{ getDict(ASSOC_STATUS, row.status).label }}
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
                  <el-dropdown-item command="edit">编辑</el-dropdown-item>
                  <el-dropdown-item command="members" divided>查看会员</el-dropdown-item>
                  <el-dropdown-item command="detail" divided>详情</el-dropdown-item>
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
    </template>

    <!-- 新增/编辑 dialog -->
    <el-dialog
      v-model="formDialogVisible"
      :title="formTitle"
      width="720px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item v-if="!isSubAdmin" label="协会名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入协会名称" />
        </el-form-item>
        <el-form-item label="协会简称" prop="shortName">
          <el-input v-model="form.shortName" placeholder="请输入协会简称" />
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
        <el-form-item v-if="!isSubAdmin" label="负责人" prop="contactName">
          <el-input v-model="form.contactName" placeholder="请输入负责人姓名" />
        </el-form-item>
        <el-form-item v-if="!isSubAdmin" label="负责人电话" prop="contactPhone">
          <el-input v-model="form.contactPhone" placeholder="请输入负责人电话" />
        </el-form-item>
        <el-form-item label="负责人微信" prop="wechat">
          <el-input v-model="form.wechat" placeholder="请输入微信号" />
        </el-form-item>
        <el-form-item label="教练员" prop="coach">
          <el-input v-model="form.coach" placeholder="请输入教练员姓名" />
        </el-form-item>
        <el-form-item label="成立日期" prop="establishDate">
          <el-date-picker
            v-model="form.establishDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择成立日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item v-if="editingId" label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">活跃中</el-radio>
            <el-radio :value="0">已解散</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="协会简介" prop="intro">
          <el-input v-model="form.intro" type="textarea" :rows="3" placeholder="请输入协会简介" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情 dialog -->
    <el-dialog v-model="detailDialogVisible" title="协会详情" width="680px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="协会名称">{{ detailRow?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="协会简称">{{ detailRow?.shortName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="所在地区" :span="2">
          {{ [detailRow?.province, detailRow?.city, detailRow?.district].filter(Boolean).join(' / ') || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="详细地址" :span="2">{{ detailRow?.address || '-' }}</el-descriptions-item>
        <el-descriptions-item v-if="!isSubAdmin" label="负责人">{{ detailRow?.contactName || '-' }}</el-descriptions-item>
        <el-descriptions-item v-if="!isSubAdmin" label="负责人电话">{{ detailRow?.contactPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="负责人微信">{{ detailRow?.wechat || '-' }}</el-descriptions-item>
        <el-descriptions-item label="教练员">{{ detailRow?.coach || '-' }}</el-descriptions-item>
        <el-descriptions-item label="成立日期">{{ formatDate(detailRow?.establishDate) }}</el-descriptions-item>
        <el-descriptions-item label="会员数">{{ detailRow?.memberCount ?? 0 }}</el-descriptions-item>
        <el-descriptions-item label="审核状态">
          <el-tag :type="getDict(AUDIT_STATUS, detailRow?.auditStatus).type">
            {{ getDict(AUDIT_STATUS, detailRow?.auditStatus).label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getDict(ASSOC_STATUS, detailRow?.status).type">
            {{ getDict(ASSOC_STATUS, detailRow?.status).label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ formatTime(detailRow?.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="协会简介" :span="2">{{ detailRow?.intro || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="importDialogVisible"
      title="批量导入协会"
      width="560px"
      @closed="resetImport"
    >
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="请先下载模板并按表头填写。省份 code 必填；城市和区县 code 请按实际地区填写。"
      >
        <template #default>
          导入成功的数据会立即保存；失败行会单独生成 Excel 错误报告。
          <el-link
            type="primary"
            :underline="false"
            :disabled="templateLoading"
            @click="downloadImportTemplate"
          >
            {{ templateLoading ? '正在生成模板…' : '下载导入模板' }}
          </el-link>
        </template>
      </el-alert>
      <el-upload
        ref="importUpload"
        drag
        :auto-upload="false"
        :limit="1"
        accept=".xlsx"
        :on-change="onImportFileChange"
        :on-remove="onImportFileRemove"
      >
        <div class="upload-copy">
          <div>拖拽 Excel 文件到此处，或点击选择</div>
          <div class="upload-format">仅支持 .xlsx，文件大小不超过 5MB</div>
        </div>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="importLoading"
          :disabled="!importFile"
          @click="submitImport"
        >
          开始导入
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowDown } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import {
  getAssociationList,
  downloadAssociationImportTemplate,
  importAssociations,
  createAssociation,
  updateAssociation,
  updateAssociationStatus,
  deleteAssociation,
} from '@/api/association';
import { getProvinces, getRegionChildren, type RegionItem } from '@/api/region';
import { ASSOC_STATUS, AUDIT_STATUS, getDict } from '@/utils/dict';
import { useUserStore } from '@/store/user';

const router = useRouter();
const userStore = useUserStore();
/** 协会会长：仅能管理所属协会，隐藏创建/删除按钮与协会名称 */
const isSubAdmin = computed(() => userStore.isSubAdmin());

const assocStatusOptions = Object.entries(ASSOC_STATUS).map(([k, v]) => ({
  value: Number(k),
  label: v.label,
}));

/* 主列表 */
const list = ref<any[]>([]);
/** 会长视角：后端已按 associationId 隔离，列表只会返回所属协会 */
const myAssoc = computed(() => list.value[0] ?? null);
const total = ref(0);
const loading = ref(false);
const query = reactive({
  keyword: '',
  contactName: '',
  contactPhone: '',
  establishStart: undefined as string | undefined,
  establishEnd: undefined as string | undefined,
  status: undefined as number | undefined,
  page: 1,
  pageSize: 10,
});
const establishDateRange = computed<[string, string] | null>({
  get() {
    return query.establishStart && query.establishEnd
      ? [query.establishStart, query.establishEnd]
      : null;
  },
  set(range) {
    query.establishStart = range?.[0];
    query.establishEnd = range?.[1];
  },
});

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getAssociationList(query);
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
  query.contactName = '';
  query.contactPhone = '';
  query.establishStart = undefined;
  query.establishEnd = undefined;
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
const formTitle = ref('新增协会');
const submitting = ref(false);
const formRef = ref<FormInstance>();
const editingId = ref<number | null>(null);
const originalStatus = ref<number | null>(null);
const defaultForm = () => ({
  name: '',
  shortName: '',
  address: '',
  contactName: '',
  contactPhone: '',
  wechat: '',
  coach: '',
  establishDate: '',
  intro: '',
  status: 1 as number,
  province: null as string | null,
  city: null as string | null,
  district: null as string | null,
  provinceCode: null as string | null,
  cityCode: null as string | null,
  districtCode: null as string | null,
});
const form = reactive(defaultForm());
/** 校验规则：会长（swimming_sub_admin）不维护负责人/负责人电话，隐藏对应表单项并跳过必填校验 */
const rules = computed<FormRules>(() => {
  const base: FormRules = {
    name: [{ required: true, message: '请输入协会名称', trigger: 'blur' }],
    provinceCode: [{ required: true, message: '请选择所在地区', trigger: 'change' }],
  };
  if (!isSubAdmin.value) {
    base.contactName = [{ required: true, message: '请输入负责人', trigger: 'blur' }];
    base.contactPhone = [{ required: true, message: '请输入负责人电话', trigger: 'blur' }];
  }
  base.establishDate = [{ required: true, message: '请选择成立日期', trigger: 'change' }];
  return base;
});

async function openCreate() {
  editingId.value = null;
  originalStatus.value = null;
  formTitle.value = '新增协会';
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
  originalStatus.value = row.status ?? 1;
  formTitle.value = '编辑协会';
  Object.assign(form, {
    name: row.name ?? '',
    shortName: row.shortName ?? '',
    address: row.address ?? '',
    contactName: row.contactName ?? '',
    contactPhone: row.contactPhone ?? '',
    wechat: row.wechat ?? '',
    coach: row.coach ?? '',
    establishDate: row.establishDate ?? '',
    intro: row.intro ?? '',
    status: row.status ?? 1,
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
  originalStatus.value = null;
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
      const { status, ...associationData } = form;
      if (editingId.value) {
        await updateAssociation(editingId.value, { ...associationData });
        if (status !== originalStatus.value) {
          await updateAssociationStatus(editingId.value, status);
        }
        ElMessage.success('更新成功');
      } else {
        await createAssociation({ ...associationData });
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

/* ============================ 协会详情 ============================ */
const detailDialogVisible = ref(false);
const detailRow = ref<any>(null);
function openDetail(row: any) {
  detailRow.value = row;
  detailDialogVisible.value = true;
}

const importDialogVisible = ref(false);
const templateLoading = ref(false);
const importLoading = ref(false);
const importFile = ref<File | null>(null);
const importUpload = ref();

function openImport() {
  importDialogVisible.value = true;
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function downloadImportTemplate() {
  templateLoading.value = true;
  try {
    const blob = await downloadAssociationImportTemplate() as Blob;
    saveBlob(blob, '冬泳协会批量导入模板.xlsx');
  } catch {
    // 错误已在拦截器处理
  } finally {
    templateLoading.value = false;
  }
}

function onImportFileChange(uploadFile: any) {
  importFile.value = uploadFile.raw ?? null;
}

function onImportFileRemove() {
  importFile.value = null;
}

function resetImport() {
  importFile.value = null;
  importUpload.value?.clearFiles();
}

async function submitImport() {
  if (!importFile.value) return;
  importLoading.value = true;
  try {
    const result = await importAssociations(importFile.value) as Blob;
    if (result.type.includes('spreadsheetml')) {
      saveBlob(result, '冬泳协会导入失败明细.xlsx');
      ElMessage.warning('导入已完成，失败行已下载错误报告');
    } else {
      const response = JSON.parse(await result.text());
      ElMessage.success(`导入成功，共导入 ${response.data.importedCount} 条`);
    }
    importDialogVisible.value = false;
    await loadData();
  } catch {
    // 错误已在拦截器处理
  } finally {
    importLoading.value = false;
  }
}

/* ============================ 操作下拉 ============================ */
function onCommand(row: any, cmd: string) {
  if (cmd === 'edit') openEdit(row);
  else if (cmd === 'members') goMembers(row);
  else if (cmd === 'detail') openDetail(row);
  else if (cmd === 'delete') removeRow(row);
}

/* ============================ 查看会员 ============================ */
function goMembers(row: any) {
  router.push({
    path: '/winter/members',
    query: { associationId: row.id, name: row.name ?? '' },
  });
}

/* ============================ 删除协会 ============================ */
async function removeRow(row: any) {
  const label = isSubAdmin.value ? row.shortName || '该协会' : row.name;
  try {
    await ElMessageBox.confirm(`确定删除协会「${label}」？`, '警告', {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    await deleteAssociation(row.id);
    ElMessage.success('删除成功');
    loadData();
  } catch (e) {
    // 错误已在拦截器处理
  }
}

onMounted(loadData);
</script>

<style scoped>
.my-assoc-card {
  border-radius: 10px;
}
.my-assoc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.my-assoc-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.my-assoc-name {
  font-size: 17px;
  font-weight: 600;
  color: #303133;
}
.region-cascader {
  display: flex;
  gap: 8px;
  width: 100%;
}
</style>
