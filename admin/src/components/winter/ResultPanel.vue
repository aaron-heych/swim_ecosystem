<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  createCompetitionResult,
  deleteCompetitionResult,
  downloadCompetitionResultsTemplate,
  getCompetitionGroups,
  getCompetitionResults,
  getTeamRanking,
  importCompetitionResults,
  updateCompetitionResult,
} from '@/api/competition';
import { getParticipantOptions } from '@/api/winter-participation';
import { useUserStore } from '@/store/user';
import AttachmentGallery from '@/components/winter/AttachmentGallery.vue';

const props = defineProps<{
  /** 赛事对象（至少含 id/title/status）；为 null 时显示空态 */
  competition: any;
}>();

/** 会长（swimming_sub_admin）只读预览：不能录入/编辑/删除成绩，附件仅可查看 */
const userStore = useUserStore();
const isSubAdmin = computed(() => userStore.isSubAdmin());

const competitionId = computed(() => props.competition?.id);
const tab = ref('individual');

/* ===================== 项目（组别） ===================== */
const groups = ref<any[]>([]);
/** 项目筛选：仅作用于个人成绩列表（团体总分榜为全项目汇总，不受筛选影响） */
const groupFilter = ref<number | undefined>(undefined);

async function loadGroups() {
  if (!competitionId.value) return;
  const res: any = await getCompetitionGroups(competitionId.value);
  groups.value = Array.isArray(res) ? res : [];
}

/* ===================== 个人成绩 ===================== */
const resultLoading = ref(false);
const results = ref<any[]>([]);
const importDialog = ref(false);
const importLoading = ref(false);
const templateLoading = ref(false);
const importFile = ref<File | null>(null);
const importUpload = ref<any>();

async function loadResults() {
  if (!competitionId.value) return;
  resultLoading.value = true;
  try {
    const params = groupFilter.value ? { groupId: groupFilter.value } : undefined;
    const res: any = await getCompetitionResults(competitionId.value, params);
    results.value = Array.isArray(res) ? res : [];
    // 全部模式：默认展开第一个项目分组
    if (!groupFilter.value) {
      const first = results.value[0];
      activeGroups.value = first ? [String(first.groupId)] : [];
    }
  } finally {
    resultLoading.value = false;
  }
}

/** 全部模式下按项目分组（组内按名次升序，无名次排最后；附冠军预览） */
const activeGroups = ref<string[]>([]);
const groupedResults = computed(() => {
  const map = new Map<number, { groupId: number; name: string; list: any[] }>();
  for (const r of results.value) {
    if (!map.has(r.groupId)) {
      map.set(r.groupId, {
        groupId: r.groupId,
        name: r.groupName || '未分组',
        list: [],
      });
    }
    map.get(r.groupId)!.list.push(r);
  }
  return [...map.values()].map((g) => {
    g.list.sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));
    return {
      ...g,
      champion: g.list.find((r) => r.rank === 1)?.participantName ?? '',
    };
  });
});

const participants = ref<any[]>([]);

async function loadParticipantOptions() {
  if (!competitionId.value) return;
  const res: any = await getParticipantOptions(1, competitionId.value);
  participants.value = Array.isArray(res) ? res : [];
}

/** 参赛人员按协会分组（成绩表单下拉用） */
const participantGroups = computed(() => {
  const map = new Map<string, any[]>();
  for (const p of participants.value) {
    const key = p.associationName || '未分组';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return [...map.entries()].map(([name, list]) => ({ name, list }));
});

/* ===================== 成绩表单 ===================== */
const rDialog = ref(false);
const rSaving = ref(false);
const rEditingId = ref<number | null>(null);
const rForm = reactive({
  groupId: undefined as number | undefined,
  /** 参赛人员类型：member=泳协会员（下拉选择）/ guest=非泳协会员（手工输入姓名） */
  participantType: 'member' as 'member' | 'guest',
  participantId: undefined as number | undefined,
  participantName: '',
  rank: undefined as number | undefined,
  resultValue: '',
  remark: '',
});

function resetResultForm() {
  rForm.groupId = groupFilter.value ?? undefined;
  rForm.participantType = 'member';
  rForm.participantId = undefined;
  rForm.participantName = '';
  rForm.rank = undefined;
  rForm.resultValue = '';
  rForm.remark = '';
}

/** 新增成绩：无项目则提示去赛事管理添加（项目管理归属赛事侧，本页只录成绩） */
function openCreateResult() {
  if (!groups.value.length) {
    ElMessage.warning('该赛事还没有比赛项目，请先在「赛事管理 → 比赛项目」中添加');
    return;
  }
  rEditingId.value = null;
  resetResultForm();
  rDialog.value = true;
}

function openEditResult(row: any) {
  rEditingId.value = row.id;
  rForm.groupId = row.groupId;
  rForm.participantType = row.participantId ? 'member' : 'guest';
  rForm.participantId = row.participantId ?? undefined;
  rForm.participantName = row.participantId ? '' : (row.participantName ?? '');
  rForm.rank = row.rank ?? undefined;
  rForm.resultValue = row.resultValue ?? '';
  rForm.remark = row.remark ?? '';
  rDialog.value = true;
}

async function submitResult() {
  if (!rForm.groupId) {
    ElMessage.warning('请选择项目');
    return;
  }
  if (rForm.participantType === 'member' && !rForm.participantId) {
    ElMessage.warning('请选择参赛会员');
    return;
  }
  if (rForm.participantType === 'guest' && !rForm.participantName.trim()) {
    ElMessage.warning('请输入选手姓名');
    return;
  }
  rSaving.value = true;
  try {
    const payload: any = {
      groupId: rForm.groupId,
      rank: rForm.rank,
      resultValue: rForm.resultValue,
      remark: rForm.remark,
    };
    // 积分由后端按赛事积分规则自动计算，前端不传
    if (rForm.participantType === 'member') {
      payload.participantId = rForm.participantId;
    } else {
      payload.participantName = rForm.participantName.trim();
    }
    if (rEditingId.value) {
      await updateCompetitionResult(rEditingId.value, payload);
    } else {
      await createCompetitionResult(competitionId.value, payload);
    }
    ElMessage.success('保存成功');
    rDialog.value = false;
    await loadResults();
    await loadRanking();
  } finally {
    rSaving.value = false;
  }
}

async function removeResult(row: any) {
  await ElMessageBox.confirm(`确定删除「${row.participantName}」的成绩？`, '提示', {
    type: 'warning',
  });
  await deleteCompetitionResult(row.id);
  ElMessage.success('已删除');
  await loadResults();
  await loadRanking();
}

async function downloadResultsTemplate() {
  if (!competitionId.value) return;
  templateLoading.value = true;
  try {
    const blob = await downloadCompetitionResultsTemplate(competitionId.value);
    const url = URL.createObjectURL(blob as Blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '个人成绩导入模板.xlsx';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } finally {
    templateLoading.value = false;
  }
}

function onImportFileChange(uploadFile: any) {
  const file: File | undefined = uploadFile.raw;
  if (!file) return;
  if (!/\.(xlsx|xls)$/i.test(file.name)) {
    ElMessage.warning('请选择 .xls 或 .xlsx 格式的 Excel 文件');
    importUpload.value?.clearFiles();
    importFile.value = null;
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('Excel 文件不能超过 5MB');
    importUpload.value?.clearFiles();
    importFile.value = null;
    return;
  }
  importFile.value = file;
}

function onImportFileRemove() {
  importFile.value = null;
}

function resetImportFile() {
  importUpload.value?.clearFiles();
  importFile.value = null;
}

async function submitImportResults() {
  if (!competitionId.value || !importFile.value) {
    ElMessage.warning('请先选择 Excel 文件');
    return;
  }
  importLoading.value = true;
  try {
    const response: any = await importCompetitionResults(
      competitionId.value,
      importFile.value,
    );
    ElMessage.success(`成功导入 ${response.importedCount} 条个人成绩`);
    importDialog.value = false;
    resetImportFile();
    await Promise.all([loadResults(), loadRanking()]);
  } finally {
    importLoading.value = false;
  }
}

/* ===================== 团体总分榜 ===================== */
const rankingLoading = ref(false);
const ranking = ref<any[]>([]);

async function loadRanking() {
  if (!competitionId.value) return;
  rankingLoading.value = true;
  try {
    const res: any = await getTeamRanking(competitionId.value);
    ranking.value = Array.isArray(res) ? res : [];
  } finally {
    rankingLoading.value = false;
  }
}

function participantLabel(p: any) {
  const extra = [p.bibNo ? `号码 ${p.bibNo}` : '', p.phone || '']
    .filter(Boolean)
    .join(' · ');
  return extra ? `${p.realName}（${extra}）` : p.realName;
}

async function reloadAll() {
  groupFilter.value = undefined;
  await Promise.all([
    loadGroups(),
    loadResults(),
    loadRanking(),
    loadParticipantOptions(),
  ]);
}

watch(
  competitionId,
  (v) => {
    if (v) {
      tab.value = 'individual';
      reloadAll();
    } else {
      groups.value = [];
      results.value = [];
      ranking.value = [];
      participants.value = [];
    }
  },
  { immediate: true },
);

watch(groupFilter, () => loadResults());
</script>

<template>
  <div class="result-panel">
    <el-tabs v-model="tab">
      <!-- 个人成绩 -->
      <el-tab-pane label="个人成绩" name="individual">
        <div class="toolbar">
          <el-select
            v-model="groupFilter"
            placeholder="全部项目"
            clearable
            filterable
            style="width: 220px"
            @change="loadResults"
          >  <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
          </el-select>
          <el-button
            v-if="!isSubAdmin"
            type="success"
            plain
            :disabled="!groups.length"
            @click="importDialog = true"
          >
            批量导入成绩
          </el-button>
          <el-button v-if="!isSubAdmin" type="primary" @click="openCreateResult">新增成绩</el-button>
        </div>

        <!-- 全部模式：按项目分组折叠展示（避免多项目×多名次时列表过长） -->
        <template v-if="!groupFilter">
          <el-collapse
            v-if="groupedResults.length"
            v-model="activeGroups"
            class="group-collapse"
          >
            <el-collapse-item
              v-for="g in groupedResults"
              :key="g.groupId"
              :name="String(g.groupId)"
            >
              <template #title>
                <div class="group-title">
                  <span class="group-name">{{ g.name }}</span>
                  <el-tag size="small" effect="plain" round>{{ g.list.length }} 条</el-tag>
                  <span v-if="g.champion" class="group-champion">
                    冠军：{{ g.champion }}
                  </span>
                </div>
              </template>
              <el-table :data="g.list" border size="small">
                <el-table-column label="名次" width="70" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="row.rank === 1" type="danger" size="small">1</el-tag>
                    <span v-else>{{ row.rank ?? '-' }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="participantName" label="选手" width="110" />
                <el-table-column prop="associationName" label="所属协会" min-width="150" />
                <el-table-column prop="resultValue" label="成绩" width="110">
                  <template #default="{ row }">{{ row.resultValue || '-' }}</template>
                </el-table-column>
                <el-table-column prop="score" label="积分" width="80" align="center" />
                <el-table-column prop="remark" label="备注" width="90">
                  <template #default="{ row }">{{ row.remark || '-' }}</template>
                </el-table-column>
                <el-table-column v-if="!isSubAdmin" label="操作" width="130">
                  <template #default="{ row }">
                    <el-button link type="primary" size="small" @click="openEditResult(row)">
                      编辑
                    </el-button>
                    <el-button link type="danger" size="small" @click="removeResult(row)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-collapse-item>
          </el-collapse>
          <el-empty v-else-if="!resultLoading" description="暂无成绩" :image-size="60" />
        </template>

        <!-- 指定项目：平铺表格 -->
        <el-table
          v-else
          v-loading="resultLoading"
          :data="results"
          border
          size="small"
          max-height="520"
        >
          <el-table-column prop="groupName" label="项目" min-width="150" />
          <el-table-column label="名次" width="70" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.rank === 1" type="danger" size="small">1</el-tag>
              <span v-else>{{ row.rank ?? '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="participantName" label="选手" width="110" />
          <el-table-column prop="associationName" label="所属协会" min-width="150" />
          <el-table-column prop="resultValue" label="成绩" width="110">
            <template #default="{ row }">{{ row.resultValue || '-' }}</template>
          </el-table-column>
          <el-table-column prop="score" label="积分" width="80" align="center" />
          <el-table-column prop="remark" label="备注" width="90">
            <template #default="{ row }">{{ row.remark || '-' }}</template>
          </el-table-column>
          <el-table-column v-if="!isSubAdmin" label="操作" width="130" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openEditResult(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="removeResult(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 团体总分榜 -->
      <el-tab-pane label="团体总分榜" name="team">
        <el-alert
          type="info"
          :closable="false"
          show-icon
          title="团体总分由个人积分自动汇总（积分规则在赛事管理 → 积分设置中配置），无需手工录入"
          style="margin-bottom: 12px"
        />
        <el-table v-loading="rankingLoading" :data="ranking" border size="small">
          <el-table-column label="名次" width="80" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.rank === 1" type="danger" size="small">1</el-tag>
              <el-tag v-else-if="row.rank === 2" type="warning" size="small">2</el-tag>
              <el-tag v-else-if="row.rank === 3" type="success" size="small">3</el-tag>
              <span v-else>{{ row.rank }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="associationName" label="冬泳协会" min-width="180" />
          <el-table-column prop="teamName" label="代表队" min-width="150">
            <template #default="{ row }">{{ row.teamName || '-' }}</template>
          </el-table-column>
          <el-table-column prop="totalScore" label="团体总分" width="110" align="center" />
          <el-table-column prop="goldCount" label="第一名次数" width="110" align="center" />
          <el-table-column prop="resultCount" label="成绩条数" width="110" align="center" />
        </el-table>
      </el-tab-pane>

      <!-- 比赛附件：赛事花絮照片 + 比赛成绩单（两个独立存储区） -->
      <el-tab-pane label="比赛附件" name="attachments" lazy>
        <AttachmentGallery
          :competition-id="competitionId"
          kind="gallery"
          title="赛事花絮照片"
          subtitle="比赛现场、颁奖等花絮照片，仅支持图片，单张 ≤2MB，最多 50 张"
          image-only
          :readonly="isSubAdmin"
          :hide-header-details="isSubAdmin"
        />
        <AttachmentGallery
          :competition-id="competitionId"
          kind="result"
          title="比赛成绩单"
          subtitle="成绩单照片或 zip/7z 打包文件，最多 20 个"
          style="margin-top: 16px"
          :readonly="isSubAdmin"
          :hide-header-details="isSubAdmin"
        />
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      v-model="importDialog"
      title="批量导入个人成绩"
      width="560px"
      append-to-body
      @closed="resetImportFile"
    >
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="项目名称需与本赛事项目一致；报名选手按姓名及所属协会匹配，未匹配到的选手将作为非会员导入。"
      >
        <template #default>
          <span>模板已附本赛事项目参考表，请按表头填写：</span>
          <el-link
            type="primary"
            :underline="false"
            :disabled="templateLoading"
            @click="downloadResultsTemplate"
          >
            {{ templateLoading ? '正在生成模板…' : '下载导入模板' }}
          </el-link>
        </template>
      </el-alert>
      <div class="import-help">
        名次、成绩、备注至少填写一项。重复成绩或任意行校验失败时，整份文件不会导入。最多 5000 条，支持 .xls 和 .xlsx 文件。
      </div>
      <el-upload
        ref="importUpload"
        drag
        :auto-upload="false"
        :limit="1"
        accept=".xls,.xlsx"
        :on-change="onImportFileChange"
        :on-remove="onImportFileRemove"
      >
        <div class="upload-copy">
          <div>拖拽 Excel 文件到此处，或点击选择</div>
          <div class="upload-format">支持 .xls、.xlsx，文件大小不超过 5MB</div>
        </div>
      </el-upload>
      <template #footer>
        <el-button @click="importDialog = false">取消</el-button>
        <el-button
          type="primary"
          :loading="importLoading"
          :disabled="!importFile"
          @click="submitImportResults"
        >
          开始导入
        </el-button>
      </template>
    </el-dialog>

    <!-- 成绩表单 -->
    <el-dialog
      v-model="rDialog"
      :title="rEditingId ? '编辑成绩' : '新增成绩'"
      width="560px"
      append-to-body
    >
      <el-alert
        v-if="!participants.length && rForm.participantType === 'member'"
        type="warning"
        :closable="false"
        show-icon
        title="该赛事还没有参赛人员"
        description="请先到「赛事管理 → 参赛管理」中为该赛事导入会员，再回来录入成绩。"
        style="margin-bottom: 16px"
      />
      <el-form label-width="90px">
        <el-form-item label="项目" required>
          <el-select
            v-model="rForm.groupId"
            placeholder="请选择，可输入搜索"
            filterable
            style="width: 100%"
          >
            <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="参赛人员" required>
          <el-radio-group v-model="rForm.participantType">
            <el-radio value="member">泳协会员</el-radio>
            <el-radio value="guest">非泳协会员</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="rForm.participantType === 'member'" label="选择会员" required>
          <el-select
            v-model="rForm.participantId"
            placeholder="按协会分组选择，可输入姓名搜索"
            filterable
            style="width: 100%"
          >
            <el-option-group
              v-for="grp in participantGroups"
              :key="grp.name"
              :label="grp.name"
            >
              <el-option
                v-for="p in grp.list"
                :key="p.id"
                :label="participantLabel(p)"
                :value="p.id"
              />
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-form-item v-else label="选手姓名" required>
          <el-input
            v-model="rForm.participantName"
            placeholder="请输入非泳协会员选手姓名"
            maxlength="50"
          />
        </el-form-item>
        <el-form-item label="名次 / 成绩">
          <div class="inline-fields">
            <el-input-number v-model="rForm.rank" :min="1" placeholder="名次" />
            <el-input
              v-model="rForm.resultValue"
              placeholder="成绩 如 00:32.15"
              style="flex: 1"
            />
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="rForm.remark" placeholder="DNS 未出发 / DNF 未完成 / DSQ 犯规" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rDialog = false">取消</el-button>
        <el-button
          type="primary"
          :loading="rSaving"
          :disabled="rForm.participantType === 'member' && !participants.length"
          @click="submitResult"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.import-help {
  margin: 12px 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
}
.upload-copy {
  line-height: 1.8;
}
.upload-format {
  color: #909399;
  font-size: 12px;
}
.inline-fields {
  display: flex;
  gap: 12px;
  width: 100%;
}
/* ---- 按项目分组折叠 ---- */
.group-collapse {
  border-top: none;
}
.group-collapse :deep(.el-collapse-item__header) {
  font-size: 14px;
  height: 48px;
  padding: 0 4px;
}
.group-collapse :deep(.el-collapse-item__wrap) {
  border-bottom: none;
}
.group-collapse :deep(.el-collapse-item__content) {
  padding-bottom: 16px;
}
.group-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.group-name {
  font-weight: 600;
  color: #303133;
}
.group-champion {
  font-size: 12px;
  color: #e6a23c;
  font-weight: 500;
}
</style>
