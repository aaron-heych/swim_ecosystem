<template>
  <div class="page-container">
    <!-- 顶部标题 -->
    <div class="nav-bar">
      <span class="nav-name">{{ associationName }}</span>
      <el-tag v-if="!isSubAdmin" type="info" size="small" class="nav-tag">会员管理</el-tag>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :inline="true" :model="query">
        <el-form-item label="姓名">
          <el-input
            v-model="query.keyword"
            placeholder="请输入会员名称"
            clearable
            style="width: 160px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="电话">
          <el-input
            v-model="query.phone"
            placeholder="请输入电话"
            clearable
            style="width: 160px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 130px">
            <el-option
              v-for="opt in memberStatusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="query.gender" placeholder="全部" clearable style="width: 110px">
            <el-option label="男" :value="1" />
            <el-option label="女" :value="2" />
            <el-option label="未知" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否缴纳保险">
          <el-select v-model="query.hasInsurance" placeholder="全部" clearable style="width: 130px">
            <el-option label="已缴纳" :value="1" />
            <el-option label="未缴纳" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="入会时间">
          <el-date-picker
            v-model="joinedRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
            @change="onJoinedRangeChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 会员表格 -->
    <div class="table-container">
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column label="头像" width="70" align="center">
          <template #default="{ row }">
            <el-avatar :size="36" :src="row.user?.avatarUrl || undefined" class="member-avatar">
              <el-icon :size="18"><UserFilled /></el-icon>
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="realName" label="会员名称" width="110" />
        <el-table-column label="性别" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="genderTag(row.user?.gender)" size="small" effect="plain">
              {{ genderLabel(row.user?.gender) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="getDict(MEMBER_ROLE, row.role).type">
              {{ getDict(MEMBER_ROLE, row.role).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getDict(MEMBER_STATUS, row.status).type">
              {{ getDict(MEMBER_STATUS, row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="入会时间" width="110">
          <template #default="{ row }">{{ formatDate(row.joinedAt) }}</template>
        </el-table-column>
        <el-table-column label="是否缴纳保险" width="120">
          <template #default="{ row }">
            <el-tag :type="getDict(INSURANCE_STATUS, row.hasInsurance ?? 0).type">
              {{ getDict(INSURANCE_STATUS, row.hasInsurance ?? 0).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="保险状态" min-width="160">
          <template #default="{ row }">
            <div v-if="insuranceState(row) !== 'none'" class="insurance-cell">
              <el-tooltip
                :content="insuranceState(row) === 'warn' ? '保险将在一个月内到期（或已过期）' : '保险在有效期内'"
                placement="top"
              >
                <el-icon :size="20" :color="insuranceState(row) === 'warn' ? '#f56c6c' : '#67c23a'">
                  <WarningFilled v-if="insuranceState(row) === 'warn'" />
                  <CircleCheckFilled v-else />
                </el-icon>
              </el-tooltip>
              <span class="insurance-end" :class="{ warn: insuranceState(row) === 'warn' }">
                {{ formatDate(row.insuranceEndAt) }}
              </span>
            </div>
            <span v-else>-</span>
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
                  <el-dropdown-item command="detail" divided>详情</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
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

    <!-- 编辑 dialog -->
    <el-dialog v-model="editDialogVisible" title="编辑会员" width="680px" @closed="resetEditForm">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="110px">
        <el-form-item label="会员头像">
          <div class="avatar-edit">
            <el-avatar :size="64" :src="editForm.avatar || undefined" class="member-avatar">
              <el-icon :size="30"><UserFilled /></el-icon>
            </el-avatar>
            <div class="avatar-actions">
              <el-upload
                :show-file-list="false"
                :auto-upload="false"
                accept=".jpg,.jpeg,.png,.webp,.gif,.bmp"
                :on-change="onAvatarPick"
              >
                <el-button size="small" type="primary" plain :loading="avatarUploading">
                  {{ editForm.avatar ? '更换头像' : '上传头像' }}
                </el-button>
              </el-upload>
              <el-button
                v-if="editForm.avatar"
                size="small"
                link
                type="danger"
                @click="editForm.avatar = ''"
              >
                清除
              </el-button>
              <div class="avatar-tip">支持 jpg/png/webp/gif/bmp，不超过 2MB</div>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="editForm.gender">
            <el-radio :value="1">男</el-radio>
            <el-radio :value="2">女</el-radio>
            <el-radio :value="0">未知</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="协会内角色" prop="role">
          <el-select v-model="editForm.role" style="width: 200px">
            <el-option
              v-for="opt in memberRoleOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="editForm.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="editForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="身份证号" prop="idCard">
          <el-input v-model="editForm.idCard" placeholder="请输入身份证号（明文保存，AES 加密存储）" />
        </el-form-item>
        <el-form-item label="紧急联系人" prop="emergencyName">
          <el-input v-model="editForm.emergencyName" placeholder="请输入紧急联系人" />
        </el-form-item>
        <el-form-item label="紧急联系电话" prop="emergencyPhone">
          <el-input v-model="editForm.emergencyPhone" placeholder="请输入紧急联系电话" />
        </el-form-item>
        <el-form-item label="冬泳健康声明">
          <div class="health-block">
            <el-checkbox
              v-for="item in HEALTH_ITEMS"
              :key="item.key"
              v-model="editForm.health[item.key]"
            >
              {{ item.label }}
            </el-checkbox>
          </div>
        </el-form-item>
        <el-form-item label="已签署声明" prop="signed">
          <el-checkbox v-model="editForm.health.signed">会员已签署冬泳健康声明</el-checkbox>
        </el-form-item>
        <el-form-item label="报名留言" prop="applyRemark">
          <el-input v-model="editForm.applyRemark" type="textarea" :rows="2" placeholder="请输入报名留言" />
        </el-form-item>
        <el-form-item label="入会时间" prop="joinedAt">
          <el-date-picker
            v-model="editForm.joinedAt"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择入会时间"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="是否购买保险" prop="hasInsurance">
          <el-radio-group v-model="editForm.hasInsurance">
            <el-radio :value="1">已购买</el-radio>
            <el-radio :value="0">未购买</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="购买保险时间" prop="buyedInsuranceAt">
          <el-date-picker
            v-model="editForm.buyedInsuranceAt"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择购买保险时间"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="保险开始时间" prop="insuranceStartAt">
          <el-date-picker
            v-model="editForm.insuranceStartAt"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择保险开始时间"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="保险结束时间" prop="insuranceEndAt">
          <el-date-picker
            v-model="editForm.insuranceEndAt"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择保险结束时间"
            style="width: 200px"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitEdit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情 dialog -->
    <el-dialog v-model="detailDialogVisible" title="会员详情" width="720px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="头像">
          <el-avatar :size="48" :src="detailRow?.user?.avatarUrl || undefined" class="member-avatar">
            <el-icon :size="24"><UserFilled /></el-icon>
          </el-avatar>
        </el-descriptions-item>
        <el-descriptions-item label="性别">
          <el-tag :type="genderTag(detailRow?.user?.gender)" size="small" effect="plain">
            {{ genderLabel(detailRow?.user?.gender) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="会员名称">{{ detailRow?.realName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ detailRow?.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="协会内角色">
          <el-tag :type="getDict(MEMBER_ROLE, detailRow?.role).type">
            {{ getDict(MEMBER_ROLE, detailRow?.role).label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getDict(MEMBER_STATUS, detailRow?.status).type">
            {{ getDict(MEMBER_STATUS, detailRow?.status).label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ detailRow?.idCard || '-' }}</el-descriptions-item>
        <el-descriptions-item label="会员编号">{{ detailRow?.memberNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="紧急联系人">{{ detailRow?.emergencyName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="紧急联系电话">{{ detailRow?.emergencyPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="入会时间">{{ formatDate(detailRow?.joinedAt) }}</el-descriptions-item>
        <el-descriptions-item label="是否购买保险">
          <el-tag :type="getDict(INSURANCE_STATUS, detailRow?.hasInsurance ?? 0).type">
            {{ getDict(INSURANCE_STATUS, detailRow?.hasInsurance ?? 0).label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="购买保险时间">{{ formatDate(detailRow?.buyedInsuranceAt) }}</el-descriptions-item>
        <el-descriptions-item label="保险有效期">
          <template v-if="detailRow?.hasInsurance === 1 && (detailRow?.insuranceStartAt || detailRow?.insuranceEndAt)">
            {{ formatDate(detailRow?.insuranceStartAt) }} ~ {{ formatDate(detailRow?.insuranceEndAt) }}
          </template>
          <template v-else>-</template>
        </el-descriptions-item>
        <el-descriptions-item label="报名留言" :span="2">{{ detailRow?.applyRemark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="冬泳健康声明" :span="2">
          <template v-if="healthText(detailRow?.healthDeclaration)">
            <el-tag
              v-for="t in healthText(detailRow?.healthDeclaration)"
              :key="t"
              :type="t.includes('已签署') ? 'success' : 'warning'"
              size="small"
              class="health-tag"
            >
              {{ t }}
            </el-tag>
          </template>
          <template v-else>-</template>
        </el-descriptions-item>
        <el-descriptions-item label="申请时间" :span="2">{{ formatTime(detailRow?.createdAt) }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowDown, CircleCheckFilled, UserFilled, WarningFilled } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import {
  getMemberList,
  getMemberDetail,
  updateMember,
  deleteMember,
  getAssociationDetail,
  uploadMemberAvatar,
} from '@/api/association';
import { INSURANCE_STATUS, MEMBER_ROLE, MEMBER_STATUS, getDict } from '@/utils/dict';
import { useUserStore } from '@/store/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const isSubAdmin = computed(() => userStore.isSubAdmin());

/** 冬泳健康声明字段 */
const HEALTH_ITEMS = [
  { key: 'heart_disease', label: '心脏病' },
  { key: 'hypertension', label: '高血压' },
  { key: 'hepatitis', label: '肝炎' },
  { key: 'nephritis', label: '肾炎' },
  { key: 'epilepsy', label: '癫痫' },
  { key: 'asthma', label: '哮喘' },
] as const;

/** 会员状态检索：仅 正常 / 已退出 */
const memberStatusOptions = [
  { value: 1, label: '正常' },
  { value: 3, label: '已退出' },
];
const memberRoleOptions = Object.entries(MEMBER_ROLE).map(([k, v]) => ({
  value: Number(k),
  label: v.label,
}));

/* ============================ 协会上下文 ============================ */
const associationId = ref<number | null>(null);
const associationName = ref('');

/* ============================ 查询 ============================ */
const list = ref<any[]>([]);
const total = ref(0);
const loading = ref(false);
const joinedRange = ref<[string, string] | null>(null);
const query = reactive({
  keyword: '',
  phone: '',
  status: undefined as number | undefined,
  hasInsurance: undefined as number | undefined,
  gender: undefined as number | undefined,
  joinedStart: '',
  joinedEnd: '',
  page: 1,
  pageSize: 10,
});

/** 性别展示：0未知 1男 2女 */
function genderLabel(g?: number | null) {
  return g === 1 ? '男' : g === 2 ? '女' : '未知';
}
function genderTag(g?: number | null) {
  return (g === 1 ? 'primary' : g === 2 ? 'danger' : 'info') as any;
}

function onJoinedRangeChange(v: [string, string] | null) {
  query.joinedStart = v?.[0] ?? '';
  query.joinedEnd = v?.[1] ?? '';
}

async function loadData() {
  if (!associationId.value) return;
  loading.value = true;
  try {
    const res: any = await getMemberList(associationId.value, query);
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
  query.phone = '';
  query.status = undefined;
  query.hasInsurance = undefined;
  query.gender = undefined;
  query.joinedStart = '';
  query.joinedEnd = '';
  joinedRange.value = null;
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

/* ============================ 保险状态图标 ============================ */
/** none=未投保 warn=一个月内到期（红色警告） ok=正常 */
function insuranceState(row: any): 'none' | 'warn' | 'ok' {
  if (row.hasInsurance !== 1) return 'none';
  if (!row.insuranceEndAt) return 'ok';
  const end = new Date(row.insuranceEndAt).getTime();
  if (isNaN(end)) return 'ok';
  const month = 30 * 24 * 3600 * 1000;
  return end - Date.now() <= month ? 'warn' : 'ok';
}

/* ============================ 健康声明展示 ============================ */
function healthText(hd: any): string[] {
  if (!hd || typeof hd !== 'object') return [];
  const tags: string[] = [];
  for (const item of HEALTH_ITEMS) {
    if (hd[item.key]) tags.push(item.label);
  }
  if (hd.signed) tags.push('已签署');
  return tags.length ? tags : [];
}

/* ============================ 编辑 ============================ */
const editDialogVisible = ref(false);
const editFormRef = ref<FormInstance>();
const submitting = ref(false);
const editingMemberId = ref<number | null>(null);
const defaultHealth = () => ({
  heart_disease: false,
  hypertension: false,
  hepatitis: false,
  nephritis: false,
  epilepsy: false,
  asthma: false,
  signed: false,
});
const defaultEditForm = () => ({
  role: 3 as number,
  realName: '',
  phone: '',
  idCard: '',
  emergencyName: '',
  emergencyPhone: '',
  health: defaultHealth() as Record<string, boolean>,
  applyRemark: '',
  joinedAt: '',
  hasInsurance: 0 as number,
  buyedInsuranceAt: '',
  insuranceStartAt: '',
  insuranceEndAt: '',
  avatar: '',
  gender: 0 as number,
});
const editForm = reactive(defaultEditForm());

/* ============================ 头像上传 ============================ */
const avatarUploading = ref(false);
async function onAvatarPick(uploadFile: any) {
  const file: File | undefined = uploadFile?.raw;
  if (!file) return;
  if (!/^image\//.test(file.type)) {
    ElMessage.warning('仅支持图片文件');
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.warning('头像文件不能超过 2MB');
    return;
  }
  avatarUploading.value = true;
  try {
    const res: any = await uploadMemberAvatar(file);
    editForm.avatar = res?.url ?? '';
    ElMessage.success('头像已上传，点击确定后保存');
  } catch {
    // 错误已在拦截器处理
  } finally {
    avatarUploading.value = false;
  }
}
const editRules: FormRules = {
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
};

async function openEdit(row: any) {
  editingMemberId.value = row.id;
  try {
    const detail: any = await getMemberDetail(row.id);
    const hd = detail?.healthDeclaration ?? {};
    const health: Record<string, boolean> = defaultHealth();
    for (const item of HEALTH_ITEMS) {
      health[item.key] = !!hd[item.key];
    }
    health.signed = !!hd.signed;
    Object.assign(editForm, {
      role: detail?.role ?? 3,
      realName: detail?.realName ?? '',
      phone: detail?.phone ?? '',
      idCard: detail?.idCard ?? '',
      emergencyName: detail?.emergencyName ?? '',
      emergencyPhone: detail?.emergencyPhone ?? '',
      health,
      applyRemark: detail?.applyRemark ?? '',
      joinedAt: formatDate(detail?.joinedAt),
      hasInsurance: detail?.hasInsurance ?? 0,
      buyedInsuranceAt: formatDate(detail?.buyedInsuranceAt),
      insuranceStartAt: formatDate(detail?.insuranceStartAt),
      insuranceEndAt: formatDate(detail?.insuranceEndAt),
      avatar: detail?.user?.avatarUrl ?? '',
      gender: detail?.user?.gender ?? 0,
    });
  } catch (e) {
    return;
  }
  editDialogVisible.value = true;
}
function resetEditForm() {
  editFormRef.value?.resetFields();
  Object.assign(editForm, defaultEditForm());
  editingMemberId.value = null;
}
async function submitEdit() {
  if (!editFormRef.value) return;
  await editFormRef.value.validate(async (valid) => {
    if (!valid) return;
    if (!editingMemberId.value) return;
    submitting.value = true;
    try {
      const healthDeclaration: Record<string, number> = {};
      for (const item of HEALTH_ITEMS) {
        healthDeclaration[item.key] = editForm.health[item.key] ? 1 : 0;
      }
      healthDeclaration.signed = editForm.health.signed ? 1 : 0;
      const payload: any = {
        role: editForm.role,
        realName: editForm.realName,
        phone: editForm.phone,
        emergencyName: editForm.emergencyName || null,
        emergencyPhone: editForm.emergencyPhone || null,
        healthDeclaration,
        applyRemark: editForm.applyRemark || null,
        hasInsurance: editForm.hasInsurance,
        avatar: editForm.avatar || '',
        gender: editForm.gender,
      };
      if (editForm.idCard) payload.idCard = editForm.idCard;
      if (editForm.joinedAt) payload.joinedAt = editForm.joinedAt;
      if (editForm.buyedInsuranceAt) payload.buyedInsuranceAt = editForm.buyedInsuranceAt;
      if (editForm.insuranceStartAt) payload.insuranceStartAt = editForm.insuranceStartAt;
      if (editForm.insuranceEndAt) payload.insuranceEndAt = editForm.insuranceEndAt;
      await updateMember(editingMemberId.value, payload);
      ElMessage.success('保存成功');
      editDialogVisible.value = false;
      loadData();
    } catch (e) {
      // 错误已在拦截器处理
    } finally {
      submitting.value = false;
    }
  });
}

/* ============================ 详情 ============================ */
const detailDialogVisible = ref(false);
const detailRow = ref<any>(null);
async function openDetail(row: any) {
  try {
    detailRow.value = await getMemberDetail(row.id);
    detailDialogVisible.value = true;
  } catch (e) {
    // 错误已在拦截器处理
  }
}

/* ============================ 操作下拉 ============================ */
function onCommand(row: any, cmd: string) {
  if (cmd === 'edit') openEdit(row);
  else if (cmd === 'detail') openDetail(row);
  else if (cmd === 'delete') removeMember(row);
}

/* ============================ 删除（逻辑删除） ============================ */
async function removeMember(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定删除会员「${row.realName ?? ''}」？`,
      '警告',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  try {
    await deleteMember(row.id);
    ElMessage.success('删除成功');
    loadData();
  } catch (e) {
    // 错误已在拦截器处理
  }
}

/* ============================ 初始化 ============================ */
onMounted(async () => {
  const id = Number(route.query.associationId);
  if (!id) {
    router.push('/winter/association');
    return;
  }
  associationId.value = id;
  associationName.value = String(route.query.name ?? '');
  if (!associationName.value) {
    try {
      const detail: any = await getAssociationDetail(id);
      associationName.value = detail?.name ?? '';
    } catch (e) {
      router.push('/winter/association');
      return;
    }
  }
  loadData();
});
</script>

<style scoped>
.nav-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.nav-name {
  font-size: 16px;
  font-weight: 600;
}
.nav-tag {
  margin-left: 4px;
}
.insurance-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}
.insurance-end {
  font-size: 12px;
  color: #909399;
}
.insurance-end.warn {
  color: #f56c6c;
}
.health-block {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
}
.health-tag {
  margin-right: 6px;
  margin-bottom: 4px;
}
.member-avatar {
  background: linear-gradient(135deg, #c2e9fb 0%, #a1c4fd 100%);
  color: #fff;
}
.avatar-edit {
  display: flex;
  align-items: center;
  gap: 14px;
}
.avatar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.avatar-tip {
  width: 100%;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}
</style>
