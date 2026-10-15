<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getAssociationList } from '@/api/association';
import {
  createParticipation,
  deleteParticipation,
  deleteParticipant,
  getMemberOptions,
  getParticipationList,
  getParticipationMembers,
  importMembers,
  updateParticipant,
  updateParticipation,
} from '@/api/winter-participation';
import {
  GENDER,
  PARTICIPANT_STATUS,
  PARTICIPATION_STATUS,
  getDict,
} from '@/utils/dict';

const props = defineProps<{
  modelValue: boolean;
  /** 1赛事 2活动 */
  targetType: number;
  targetId: number;
  targetName?: string;
  /** 只读预览（会长角色）：仅查看队伍与人员名单，不可增删改、不可导入 */
  readonly?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'changed'): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const noun = computed(() => (props.targetType === 1 ? '参赛' : '参与'));
const title = computed(
  () =>
    `${props.readonly ? noun.value + '队伍' : noun.value + '管理'}${props.targetName ? ' · ' + props.targetName : ''}`,
);

/* ===================== 参与协会 ===================== */
const loading = ref(false);
const rows = ref<any[]>([]);
const assocOptions = ref<any[]>([]);

const usedAssocIds = computed(() =>
  rows.value.map((r) => r.associationId),
);

async function loadList() {
  if (!props.targetId) return;
  loading.value = true;
  try {
    const res: any = await getParticipationList({
      targetType: props.targetType,
      targetId: props.targetId,
      page: 1,
      pageSize: 100,
    });
    rows.value = res?.list ?? [];
  } finally {
    loading.value = false;
  }
}

async function loadAssocOptions() {
  const res: any = await getAssociationList({ page: 1, pageSize: 100 });
  assocOptions.value = res?.list ?? [];
}

const assocDialog = ref(false);
const assocSaving = ref(false);
const assocEditingId = ref<number | null>(null);
const assocForm = reactive({
  associationId: undefined as number | undefined,
  teamName: '',
  leaderName: '',
  leaderPhone: '',
  status: 1,
  remark: '',
});

function resetAssocForm() {
  assocForm.associationId = undefined;
  assocForm.teamName = '';
  assocForm.leaderName = '';
  assocForm.leaderPhone = '';
  assocForm.status = 1;
  assocForm.remark = '';
}

function openCreateAssoc() {
  assocEditingId.value = null;
  resetAssocForm();
  assocDialog.value = true;
}

function openEditAssoc(row: any) {
  assocEditingId.value = row.id;
  assocForm.associationId = row.associationId;
  assocForm.teamName = row.teamName ?? '';
  assocForm.leaderName = row.leaderName ?? '';
  assocForm.leaderPhone = row.leaderPhone ?? '';
  assocForm.status = row.status;
  assocForm.remark = row.remark ?? '';
  assocDialog.value = true;
}

function onAssocChange(id: number | undefined) {
  const assoc = assocOptions.value.find((a) => a.id === id);
  if (!assoc) return;
  assocForm.teamName = assoc.name;
  assocForm.leaderName = assoc.contactName ?? '';
  assocForm.leaderPhone = assoc.contactPhone ?? '';
}

async function submitAssoc() {
  if (!assocForm.associationId) {
    ElMessage.warning('请选择冬泳协会');
    return;
  }
  assocSaving.value = true;
  try {
    const payload: any = {
      targetType: props.targetType,
      targetId: props.targetId,
      associationId: assocForm.associationId,
      teamName: assocForm.teamName,
      leaderName: assocForm.leaderName,
      leaderPhone: assocForm.leaderPhone,
      status: assocForm.status,
      remark: assocForm.remark,
    };
    if (assocEditingId.value) {
      await updateParticipation(assocEditingId.value, payload);
    } else {
      await createParticipation(payload);
    }
    ElMessage.success('保存成功');
    assocDialog.value = false;
    await loadList();
    emit('changed');
  } finally {
    assocSaving.value = false;
  }
}

async function removeAssoc(row: any) {
  await ElMessageBox.confirm(
    `确定删除「${row.associationName}」的${noun.value}记录？其人员将一并删除。`,
    '提示',
    { type: 'warning' },
  );
  await deleteParticipation(row.id);
  ElMessage.success('已删除');
  await loadList();
  emit('changed');
}

/* ===================== 参与人员 ===================== */
const memberDialog = ref(false);
const memberLoading = ref(false);
const memberRows = ref<any[]>([]);
const currentParticipation = ref<any>(null);

async function loadMembers() {
  if (!currentParticipation.value) return;
  memberLoading.value = true;
  try {
    const res: any = await getParticipationMembers(currentParticipation.value.id);
    memberRows.value = Array.isArray(res) ? res : [];
  } finally {
    memberLoading.value = false;
  }
}

async function openMembers(row: any) {
  currentParticipation.value = row;
  memberDialog.value = true;
  await loadMembers();
}

async function removeMemberRow(row: any) {
  await ElMessageBox.confirm(`确定移除人员「${row.realName}」？`, '提示', {
    type: 'warning',
  });
  await deleteParticipant(row.id);
  ElMessage.success('已移除');
  await loadMembers();
  await loadList();
  emit('changed');
}

/* 编辑人员（号码 / 状态） */
const pDialog = ref(false);
const pSaving = ref(false);
const pForm = reactive({
  id: 0,
  realName: '',
  phone: '',
  bibNo: '',
  status: 1,
});

function openEditMember(row: any) {
  pForm.id = row.id;
  pForm.realName = row.realName ?? '';
  pForm.phone = row.phone ?? '';
  pForm.bibNo = row.bibNo ?? '';
  pForm.status = row.status;
  pDialog.value = true;
}

async function submitMemberEdit() {
  pSaving.value = true;
  try {
    await updateParticipant(pForm.id, {
      realName: pForm.realName,
      phone: pForm.phone,
      bibNo: pForm.bibNo,
      status: pForm.status,
    });
    ElMessage.success('保存成功');
    pDialog.value = false;
    await loadMembers();
  } finally {
    pSaving.value = false;
  }
}

/* ===================== 从会员导入 ===================== */
const importDialog = ref(false);
const importLoading = ref(false);
const importSaving = ref(false);
const memberOptions = ref<any[]>([]);
const selectedMembers = ref<any[]>([]);

async function openImport() {
  if (!currentParticipation.value) return;
  importDialog.value = true;
  importLoading.value = true;
  selectedMembers.value = [];
  try {
    const res: any = await getMemberOptions(currentParticipation.value.id);
    memberOptions.value = Array.isArray(res) ? res : [];
  } finally {
    importLoading.value = false;
  }
}

function onSelectionChange(rows: any[]) {
  selectedMembers.value = rows;
}

async function submitImport() {
  if (!selectedMembers.value.length) {
    ElMessage.warning('请勾选要导入的会员');
    return;
  }
  importSaving.value = true;
  try {
    const ids = selectedMembers.value.map((m) => m.id);
    const res: any = await importMembers(currentParticipation.value.id, ids);
    ElMessage.success(`导入 ${res?.imported ?? 0} 人，跳过 ${res?.skipped ?? 0} 人`);
    importDialog.value = false;
    await loadMembers();
    await loadList();
    emit('changed');
  } finally {
    importSaving.value = false;
  }
}

/* ===================== 生命周期 ===================== */
watch(
  () => props.modelValue,
  async (v) => {
    if (!v) return;
    currentParticipation.value = null;
    memberRows.value = [];
    await Promise.all([loadList(), loadAssocOptions()]);
  },
);
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="960px"
    append-to-body
    destroy-on-close
  >
    <div class="toolbar">
      <el-button v-if="!readonly" type="primary" @click="openCreateAssoc">
        新增参与协会
      </el-button>
      <span class="tip">共 {{ rows.length }} 个协会</span>
    </div>

    <el-table v-loading="loading" :data="rows" border size="small">
      <el-table-column prop="associationName" label="冬泳协会" min-width="160" />
      <el-table-column prop="teamName" label="代表队" min-width="140" />
      <el-table-column prop="leaderName" label="领队" width="100" />
      <el-table-column prop="leaderPhone" label="联系电话" width="130" />
      <el-table-column label="人数" width="80" align="center">
        <template #default="{ row }">{{ row.participantCount ?? 0 }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="getDict(PARTICIPATION_STATUS, row.status).type" size="small">
            {{ getDict(PARTICIPATION_STATUS, row.status).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" :width="readonly ? 90 : 200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openMembers(row)">
            人员名单
          </el-button>
          <template v-if="!readonly">
            <el-button link type="primary" size="small" @click="openEditAssoc(row)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="removeAssoc(row)">
              删除
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 参与协会表单 -->
    <el-dialog
      v-model="assocDialog"
      :title="assocEditingId ? '编辑参与协会' : '新增参与协会'"
      width="560px"
      append-to-body
    >
      <el-form label-width="90px">
        <el-form-item label="冬泳协会" required>
          <el-select
            v-model="assocForm.associationId"
            placeholder="请选择"
            filterable
            style="width: 100%"
            @change="onAssocChange"
          >
            <el-option
              v-for="a in assocOptions"
              :key="a.id"
              :label="a.name"
              :value="a.id"
              :disabled="
                !assocEditingId ? usedAssocIds.includes(a.id) : a.id !== assocForm.associationId && usedAssocIds.includes(a.id)
              "
            />
          </el-select>
        </el-form-item>
        <el-form-item label="代表队名">
          <el-input v-model="assocForm.teamName" placeholder="默认取协会名" />
        </el-form-item>
        <el-form-item label="领队">
          <el-input v-model="assocForm.leaderName" />
        </el-form-item>
        <el-form-item label="领队电话">
          <el-input v-model="assocForm.leaderPhone" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="assocForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assocDialog = false">取消</el-button>
        <el-button type="primary" :loading="assocSaving" @click="submitAssoc">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 人员列表 -->
    <el-dialog
      v-model="memberDialog"
      :title="`参与人员${currentParticipation ? ' · ' + currentParticipation.associationName : ''}`"
      width="820px"
      append-to-body
    >
      <div class="toolbar">
        <el-button v-if="!readonly" type="primary" @click="openImport">从会员导入</el-button>
        <span class="tip">共 {{ memberRows.length }} 人</span>
      </div>
      <el-table v-loading="memberLoading" :data="memberRows" border size="small">
        <el-table-column prop="realName" label="姓名" width="110" />
        <el-table-column label="性别" width="70">
          <template #default="{ row }">
            {{ getDict(GENDER, row.gender ?? 0).label }}
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="idCardMasked" label="身份证号" min-width="150">
          <template #default="{ row }">{{ row.idCardMasked || '-' }}</template>
        </el-table-column>
        <el-table-column prop="bibNo" label="号码" width="90">
          <template #default="{ row }">{{ row.bibNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getDict(PARTICIPANT_STATUS, row.status).type" size="small">
              {{ getDict(PARTICIPANT_STATUS, row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="!readonly" label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEditMember(row)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="removeMemberRow(row)">
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 人员编辑 -->
      <el-dialog v-model="pDialog" title="编辑参与人员" width="480px" append-to-body>
        <el-form label-width="80px">
          <el-form-item label="姓名">
            <el-input v-model="pForm.realName" />
          </el-form-item>
          <el-form-item label="电话">
            <el-input v-model="pForm.phone" />
          </el-form-item>
          <el-form-item label="参赛号码">
            <el-input v-model="pForm.bibNo" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="pForm.status" style="width: 100%">
              <el-option
                v-for="(v, k) in PARTICIPANT_STATUS"
                :key="k"
                :label="v.label"
                :value="Number(k)"
              />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="pDialog = false">取消</el-button>
          <el-button type="primary" :loading="pSaving" @click="submitMemberEdit">
            确定
          </el-button>
        </template>
      </el-dialog>
    </el-dialog>

    <!-- 会员导入 -->
    <el-dialog v-model="importDialog" title="从协会会员导入" width="720px" append-to-body>
      <el-table
        v-loading="importLoading"
        :data="memberOptions"
        border
        size="small"
        @selection-change="onSelectionChange"
      >
        <el-table-column
          type="selection"
          width="50"
          :selectable="(row: any) => !row.imported"
        />
        <el-table-column prop="memberNo" label="会员编号" width="130" />
        <el-table-column prop="realName" label="姓名" width="110" />
        <el-table-column label="性别" width="70">
          <template #default="{ row }">
            {{ getDict(GENDER, row.gender ?? 0).label }}
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.imported" type="info" size="small">已导入</el-tag>
            <el-tag v-else type="success" size="small">可导入</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="importDialog = false">取消</el-button>
        <el-button type="primary" :loading="importSaving" @click="submitImport">
          导入选中（{{ selectedMembers.length }}）
        </el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.tip {
  color: #909399;
  font-size: 13px;
}
</style>
