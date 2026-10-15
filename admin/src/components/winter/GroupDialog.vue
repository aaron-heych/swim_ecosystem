<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  createCompetitionGroup,
  deleteCompetitionGroup,
  getCompetitionGroups,
  updateCompetitionGroup,
} from '@/api/competition';
import { GENDER, getDict } from '@/utils/dict';

const props = defineProps<{
  modelValue: boolean;
  /** 赛事对象（至少含 id/title） */
  competition: any;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  /** 项目有增删改后通知父级（可用于刷新成绩页的项目下拉） */
  (e: 'changed'): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const title = computed(
  () => `比赛项目${props.competition?.title ? ' · ' + props.competition.title : ''}`,
);
const competitionId = computed(() => props.competition?.id);

const loading = ref(false);
const groups = ref<any[]>([]);

async function loadGroups() {
  if (!competitionId.value) return;
  loading.value = true;
  try {
    const res: any = await getCompetitionGroups(competitionId.value);
    groups.value = Array.isArray(res) ? res : [];
  } finally {
    loading.value = false;
  }
}

/* ===================== 项目表单 ===================== */
const formVisible = ref(false);
const saving = ref(false);
const editingId = ref<number | null>(null);
const form = reactive({
  name: '',
  genderLimit: 0,
  ageMin: undefined as number | undefined,
  ageMax: undefined as number | undefined,
  stroke: '',
  distanceM: undefined as number | undefined,
  sort: 0,
});

function resetForm() {
  form.name = '';
  form.genderLimit = 0;
  form.ageMin = undefined;
  form.ageMax = undefined;
  form.stroke = '';
  form.distanceM = undefined;
  form.sort = groups.value.length;
}

function openCreate() {
  editingId.value = null;
  resetForm();
  formVisible.value = true;
}

function openEdit(row: any) {
  editingId.value = row.id;
  form.name = row.name;
  form.genderLimit = row.genderLimit ?? 0;
  form.ageMin = row.ageMin ?? undefined;
  form.ageMax = row.ageMax ?? undefined;
  form.stroke = row.stroke ?? '';
  form.distanceM = row.distanceM ?? undefined;
  form.sort = row.sort ?? 0;
  formVisible.value = true;
}

async function submit() {
  if (!form.name) {
    ElMessage.warning('请填写项目名称');
    return;
  }
  saving.value = true;
  try {
    if (editingId.value) {
      await updateCompetitionGroup(editingId.value, { ...form });
    } else {
      await createCompetitionGroup(competitionId.value, { ...form });
    }
    ElMessage.success('保存成功');
    formVisible.value = false;
    await loadGroups();
    emit('changed');
  } finally {
    saving.value = false;
  }
}

async function remove(row: any) {
  await ElMessageBox.confirm(
    `确定删除项目「${row.name}」？该项目下的成绩将一并删除。`,
    '提示',
    { type: 'warning' },
  );
  await deleteCompetitionGroup(row.id);
  ElMessage.success('已删除');
  await loadGroups();
  emit('changed');
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) loadGroups();
  },
);
</script>

<template>
  <el-dialog v-model="visible" :title="title" width="760px" append-to-body destroy-on-close>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新增项目</el-button>
    </div>
    <el-table v-loading="loading" :data="groups" border size="small">
      <el-table-column prop="name" label="项目名称" min-width="160" />
      <el-table-column label="性别" width="80">
        <template #default="{ row }">
          {{ getDict(GENDER, row.genderLimit ?? 0).label }}
        </template>
      </el-table-column>
      <el-table-column prop="stroke" label="泳姿" width="100">
        <template #default="{ row }">{{ row.stroke || '-' }}</template>
      </el-table-column>
      <el-table-column label="距离(米)" width="90" align="center">
        <template #default="{ row }">{{ row.distanceM ?? '-' }}</template>
      </el-table-column>
      <el-table-column prop="resultCount" label="成绩数" width="80" align="center" />
      <el-table-column label="操作" width="130" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 项目表单 -->
    <el-dialog
      v-model="formVisible"
      :title="editingId ? '编辑项目' : '新增项目'"
      width="520px"
      append-to-body
    >
      <el-form label-width="90px">
        <el-form-item label="项目名称" required>
          <el-input v-model="form.name" placeholder="如 男子50米自由泳" />
        </el-form-item>
        <el-form-item label="性别要求">
          <el-select v-model="form.genderLimit" style="width: 100%">
            <el-option
              v-for="(v, k) in GENDER"
              :key="k"
              :label="v.label"
              :value="Number(k)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="泳姿">
          <el-input v-model="form.stroke" placeholder="自由泳 / 蛙泳 / 蝶泳 / 仰泳" />
        </el-form-item>
        <el-form-item label="距离(米)">
          <el-input-number v-model="form.distanceM" :min="0" :step="50" />
        </el-form-item>
        <el-form-item label="年龄范围">
          <el-input-number v-model="form.ageMin" :min="0" />
          <span style="margin: 0 8px">-</span>
          <el-input-number v-model="form.ageMax" :min="0" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">确定</el-button>
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
</style>
