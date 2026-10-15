<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :inline="true" :model="query">
        <el-form-item label="赛事名称">
          <el-input
            v-model="query.keyword"
            placeholder="请输入赛事名称"
            clearable
            style="width: 200px"
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
          <el-icon><Plus /></el-icon>新增赛事
        </el-button>
      </div>
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column prop="title" label="赛事名称" min-width="180" show-overflow-tooltip />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getDict(COMPETITION_TYPE, row.type).type">
              {{ getDict(COMPETITION_TYPE, row.type).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="级别" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.level" :type="getDict(COMPETITION_LEVEL, row.level).type">
              {{ getDict(COMPETITION_LEVEL, row.level).label }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="比赛时间" width="290">
          <template #default="{ row }">
            {{ formatTime(row.startAt) }} ~ {{ formatTime(row.endAt) }}
          </template>
        </el-table-column>
        <el-table-column label="地点" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.location || '-' }}</template>
        </el-table-column>
        <el-table-column label="名额" width="90" align="center">
          <template #default="{ row }">
            {{ row.joinedCount ?? 0 }}/{{ row.capacity ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getDict(COMPETITION_STATUS, row.status).type">
              {{ getDict(COMPETITION_STATUS, row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发布时间" width="150">
          <template #default="{ row }">{{ formatTime(row.publishAt) }}</template>
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
                  <el-dropdown-item command="detail">详情</el-dropdown-item>
                  <el-dropdown-item v-if="!isSubAdmin" command="participation" divided>参赛管理</el-dropdown-item>
                  <el-dropdown-item v-if="isSubAdmin" command="participation" divided>参赛队伍</el-dropdown-item>
                  <el-dropdown-item v-if="!isSubAdmin" command="group">比赛项目</el-dropdown-item>
                  <el-dropdown-item v-if="!isSubAdmin" command="scoreRule">积分设置</el-dropdown-item>
                  <el-dropdown-item v-if="!isSubAdmin && row.status === 0" command="publish" divided>发布</el-dropdown-item>
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
        <el-form-item label="赛事名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入赛事名称" />
        </el-form-item>
        <el-form-item label="赛事类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%">
            <el-option
              v-for="opt in typeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="赛事级别" prop="level">
          <el-select v-model="form.level" placeholder="请选择级别" clearable style="width: 100%">
            <el-option
              v-for="opt in levelOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
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
        <el-form-item label="比赛地点" prop="location">
          <el-input v-model="form.location" placeholder="请输入比赛地点" />
        </el-form-item>
        <el-form-item label="比赛时间" prop="startAt">
          <el-date-picker
            v-model="compTimeRange"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="报名时间" prop="regStartAt">
          <el-date-picker
            v-model="regTimeRange"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="报名开始"
            end-placeholder="报名截止"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="报名费用" prop="fee">
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
        <el-form-item label="赛事详情" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入赛事详情" />
        </el-form-item>
        <el-form-item label="赞助商">
          <div class="sponsor-block">
            <el-table :data="sponsors" border size="small">
              <el-table-column label="公司名称" min-width="160">
                <template #default="{ row }">
                  <el-input v-model="row.name" placeholder="公司名称" size="small" @blur="autoSaveSponsor(row)" />
                </template>
              </el-table-column>
              <el-table-column label="公司主页" min-width="180">
                <template #default="{ row }">
                  <el-input v-model="row.website" placeholder="https://" size="small" @blur="autoSaveSponsor(row)" />
                </template>
              </el-table-column>
              <el-table-column label="主营业务" min-width="160">
                <template #default="{ row }">
                  <el-input
                    v-model="row.business"
                    type="textarea"
                    :autosize="{ minRows: 1, maxRows: 4 }"
                    placeholder="主营业务"
                    size="small"
                    @blur="autoSaveSponsor(row)"
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="60" align="center">
                <template #default="{ row, $index }">
                  <el-button link type="danger" size="small" @click="removeSponsor(row, $index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button class="sponsor-add" size="small" @click="addSponsorRow">
              <el-icon><Plus /></el-icon>添加赞助商
            </el-button>
            <div class="sponsor-tip">
              {{ editingId ? '填写公司名称后失焦自动保存' : '赞助商随赛事一起保存' }}
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情 dialog -->
    <el-dialog v-model="detailDialogVisible" title="赛事详情" width="720px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="赛事名称" :span="2">{{ detailRow?.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="赛事类型">
          <el-tag :type="getDict(COMPETITION_TYPE, detailRow?.type).type">
            {{ getDict(COMPETITION_TYPE, detailRow?.type).label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="赛事级别">
          <el-tag v-if="detailRow?.level" :type="getDict(COMPETITION_LEVEL, detailRow?.level).type">
            {{ getDict(COMPETITION_LEVEL, detailRow?.level).label }}
          </el-tag>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="所在地区" :span="2">
          {{ [detailRow?.province, detailRow?.city, detailRow?.district].filter(Boolean).join(' / ') || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="比赛地点" :span="2">{{ detailRow?.location || '-' }}</el-descriptions-item>
        <el-descriptions-item label="比赛开始">{{ formatTime(detailRow?.startAt) }}</el-descriptions-item>
        <el-descriptions-item label="比赛结束">{{ formatTime(detailRow?.endAt) }}</el-descriptions-item>
        <el-descriptions-item label="报名开始">{{ formatTime(detailRow?.regStartAt) }}</el-descriptions-item>
        <el-descriptions-item label="报名截止">{{ formatTime(detailRow?.regEndAt) }}</el-descriptions-item>
        <el-descriptions-item label="报名费用">{{ detailRow?.fee != null ? `¥${detailRow.fee}` : '-' }}</el-descriptions-item>
        <el-descriptions-item label="名额">{{ detailRow?.joinedCount ?? 0 }}/{{ detailRow?.capacity ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ detailRow?.contactName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ detailRow?.contactPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getDict(COMPETITION_STATUS, detailRow?.status).type">
            {{ getDict(COMPETITION_STATUS, detailRow?.status).label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发布时间">{{ formatTime(detailRow?.publishAt) }}</el-descriptions-item>
        <el-descriptions-item label="赛事详情" :span="2">{{ detailRow?.description || '-' }}</el-descriptions-item>
      </el-descriptions>
      <div class="detail-sponsors">
        <div class="detail-sponsors-title">赞助商</div>
        <el-table v-if="detailSponsors.length" :data="detailSponsors" border size="small">
          <el-table-column prop="name" label="公司名称" min-width="160" />
          <el-table-column label="公司主页" min-width="180">
            <template #default="{ row }">
              <el-link v-if="row.website" :href="row.website" target="_blank" type="primary">
                {{ row.website }}
              </el-link>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="主营业务" min-width="160">
            <template #default="{ row }">
              <span class="pre-wrap">{{ row.business || '-' }}</span>
            </template>
          </el-table-column>
        </el-table>
        <span v-else class="sponsor-tip">暂无赞助商</span>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 参赛管理 dialog -->
    <ParticipationDialog
      v-model="participationVisible"
      :target-type="1"
      :target-id="participationRow?.id ?? 0"
      :target-name="participationRow?.title"
      :readonly="isSubAdmin"
      @changed="loadData"
    />

    <!-- 比赛项目 dialog -->
    <GroupDialog v-model="groupVisible" :competition="groupRow" />

    <!-- 积分设置 -->
    <ScoreRuleDialog v-model="scoreRuleVisible" :competition="scoreRuleRow" />

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ArrowDown, Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import {
  getCompetitionList,
  createCompetition,
  updateCompetition,
  updateCompetitionStatus,
  deleteCompetition,
  getCompetitionSponsors,
  createCompetitionSponsor,
  updateCompetitionSponsor,
  deleteCompetitionSponsor,
} from '@/api/competition';
import { getProvinces, getRegionChildren, type RegionItem } from '@/api/region';
import { useUserStore } from '@/store/user';
import ParticipationDialog from '@/components/winter/ParticipationDialog.vue';
import GroupDialog from '@/components/winter/GroupDialog.vue';
import ScoreRuleDialog from '@/components/winter/ScoreRuleDialog.vue';
import {
  COMPETITION_TYPE,
  COMPETITION_LEVEL,
  COMPETITION_STATUS,
  getDict,
} from '@/utils/dict';

const typeOptions = Object.entries(COMPETITION_TYPE).map(([k, v]) => ({
  value: Number(k),
  label: v.label,
}));
const levelOptions = Object.entries(COMPETITION_LEVEL).map(([k, v]) => ({
  value: Number(k),
  label: v.label,
}));
const statusOptions = Object.entries(COMPETITION_STATUS).map(([k, v]) => ({
  value: Number(k),
  label: v.label,
}));

/* 主列表 */
const list = ref<any[]>([]);
const total = ref(0);
const loading = ref(false);
const query = reactive({
  keyword: '',
  type: undefined as number | undefined,
  status: undefined as number | undefined,
  page: 1,
  pageSize: 10,
});

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getCompetitionList(query);
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
  query.type = undefined;
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
const formTitle = ref('新增赛事');
/** 会长（swimming_sub_admin）只读预览：无新增/编辑/参赛/项目/积分/发布/删除操作 */
const userStore = useUserStore();
const isSubAdmin = computed(() => userStore.isSubAdmin());
const submitting = ref(false);
const formRef = ref<FormInstance>();
const editingId = ref<number | null>(null);
const defaultForm = () => ({
  title: '',
  type: 1 as number,
  level: undefined as number | undefined,
  location: '',
  description: '',
  fee: undefined as number | undefined,
  capacity: undefined as number | undefined,
  contactName: '',
  contactPhone: '',
  status: 0 as number,
  startAt: '',
  endAt: '',
  regStartAt: '',
  regEndAt: '',
  province: null as string | null,
  city: null as string | null,
  district: null as string | null,
  provinceCode: null as string | null,
  cityCode: null as string | null,
  districtCode: null as string | null,
});
const form = reactive(defaultForm());

/** 比赛时间范围（双向同步 startAt/endAt） */
const compTimeRange = computed<string[]>({
  get: () => {
    if (!form.startAt && !form.endAt) return [] as string[];
    return [form.startAt, form.endAt].filter(Boolean) as string[];
  },
  set: (v: string[] | null) => {
    form.startAt = v?.[0] ?? '';
    form.endAt = v?.[1] ?? '';
  },
});
/** 报名时间范围（双向同步 regStartAt/regEndAt） */
const regTimeRange = computed<string[]>({
  get: () => {
    if (!form.regStartAt && !form.regEndAt) return [] as string[];
    return [form.regStartAt, form.regEndAt].filter(Boolean) as string[];
  },
  set: (v: string[] | null) => {
    form.regStartAt = v?.[0] ?? '';
    form.regEndAt = v?.[1] ?? '';
  },
});

const rules: FormRules = {
  title: [{ required: true, message: '请输入赛事名称', trigger: 'blur' }],
  provinceCode: [{ required: true, message: '请选择所在地区', trigger: 'change' }],
};

async function openCreate() {
  editingId.value = null;
  formTitle.value = '新增赛事';
  Object.assign(form, defaultForm());
  sponsors.value = [];
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
  formTitle.value = '编辑赛事';
  Object.assign(form, {
    title: row.title ?? '',
    type: row.type ?? 1,
    level: row.level ?? undefined,
    location: row.location ?? '',
    description: row.description ?? '',
    fee: row.fee ?? undefined,
    capacity: row.capacity ?? undefined,
    contactName: row.contactName ?? '',
    contactPhone: row.contactPhone ?? '',
    status: row.status ?? 0,
    startAt: toLocalInput(row.startAt),
    endAt: toLocalInput(row.endAt),
    regStartAt: toLocalInput(row.regStartAt),
    regEndAt: toLocalInput(row.regEndAt),
    province: row.province ?? null,
    city: row.city ?? null,
    district: row.district ?? null,
    provinceCode: row.provinceCode ?? null,
    cityCode: row.cityCode ?? null,
    districtCode: row.districtCode ?? null,
  });
  await restoreRegionSelection();
  await loadSponsors(row.id);
  formDialogVisible.value = true;
}
function resetForm() {
  formRef.value?.resetFields();
  Object.assign(form, defaultForm());
  editingId.value = null;
  sponsors.value = [];
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
        await updateCompetition(editingId.value, { ...form });
        ElMessage.success('更新成功');
      } else {
        const created: any = await createCompetition({ ...form });
        // 新增场景：赞助商行本地暂存，赛事创建成功后批量落库
        const newId = created?.id;
        const rows = sponsors.value.filter((s) => s.name && s.name.trim());
        for (const s of rows) {
          await createCompetitionSponsor(newId, {
            name: s.name.trim(),
            website: s.website || null,
            business: s.business || null,
            sort: s.sort ?? 0,
          });
        }
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

/* ============================ 赛事详情 ============================ */
const detailDialogVisible = ref(false);
const detailRow = ref<any>(null);
const detailSponsors = ref<any[]>([]);
async function openDetail(row: any) {
  detailRow.value = row;
  detailDialogVisible.value = true;
  detailSponsors.value = [];
  try {
    const res: any = await getCompetitionSponsors(row.id);
    detailSponsors.value = Array.isArray(res) ? res : [];
  } catch (e) {
    // 错误已在拦截器处理
  }
}

/* ============================ 操作下拉 ============================ */
const participationVisible = ref(false);
const participationRow = ref<any>(null);
// 项目管理
const groupVisible = ref(false);
const groupRow = ref<any>(null);

// 积分设置
const scoreRuleVisible = ref(false);
const scoreRuleRow = ref<any>(null);

function onCommand(row: any, cmd: string) {
  if (cmd === 'edit') openEdit(row);
  else if (cmd === 'detail') openDetail(row);
  else if (cmd === 'participation') {
    participationRow.value = row;
    participationVisible.value = true;
  } else if (cmd === 'group') {
    groupRow.value = row;
    groupVisible.value = true;
  } else if (cmd === 'scoreRule') {
    scoreRuleRow.value = row;
    scoreRuleVisible.value = true;
  } else if (cmd === 'publish') {
    publishRow(row);
  } else if (cmd === 'delete') {
    removeRow(row);
  }
}

/* ============================ 赞助商 ============================ */
const sponsors = ref<any[]>([]);

async function loadSponsors(competitionId: number) {
  const res: any = await getCompetitionSponsors(competitionId);
  sponsors.value = Array.isArray(res) ? res : [];
}

function addSponsorRow() {
  sponsors.value.push({
    id: null,
    name: '',
    website: '',
    business: '',
    sort: sponsors.value.length,
  });
}

/** 失焦自动保存：有名称才落库；新行创建后回填 id，后续失焦走更新 */
async function autoSaveSponsor(row: any) {
  if (!row.name || !row.name.trim() || !editingId.value) return;
  const payload = {
    name: row.name.trim(),
    website: row.website || null,
    business: row.business || null,
    sort: row.sort ?? 0,
  };
  if (row.id) {
    await updateCompetitionSponsor(row.id, payload);
  } else {
    const created: any = await createCompetitionSponsor(editingId.value, payload);
    row.id = created?.id;
  }
}

async function removeSponsor(row: any, index: number) {
  if (!row.id) {
    sponsors.value.splice(index, 1);
    return;
  }
  await ElMessageBox.confirm(`确定删除赞助商「${row.name}」？`, '提示', { type: 'warning' });
  await deleteCompetitionSponsor(row.id);
  ElMessage.success('已删除');
  if (editingId.value) await loadSponsors(editingId.value);
}

/* ============================ 发布赛事 ============================ */
async function publishRow(row: any) {
  try {
    await ElMessageBox.confirm(`确定发布赛事「${row.title}」？发布后进入报名中状态。`, '提示', {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    await updateCompetitionStatus(row.id, 1);
    ElMessage.success('发布成功');
    loadData();
  } catch (e) {
    // 错误已在拦截器处理
  }
}

/* ============================ 删除赛事 ============================ */
async function removeRow(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除赛事「${row.title}」？`, '警告', {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    await deleteCompetition(row.id);
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
.sponsor-block {
  width: 100%;
}
.sponsor-add {
  margin-top: 8px;
}
.sponsor-tip {
  color: #909399;
  font-size: 13px;
}
.detail-sponsors {
  margin-top: 16px;
}
.detail-sponsors-title {
  font-weight: 600;
  margin-bottom: 8px;
}
.pre-wrap {
  white-space: pre-wrap;
}
</style>
