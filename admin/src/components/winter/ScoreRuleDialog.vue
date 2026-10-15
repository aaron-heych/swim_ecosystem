<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getCompetitionScoreRules,
  saveCompetitionScoreRules,
} from '@/api/competition';

/**
 * 赛事积分设置弹窗（赛事级配置）：
 *  - 无自定义规则时展示全局默认并提示；保存后成为该赛事自定义规则
 *  - 整体替换式保存；恢复默认 = 传空数组清除自定义
 *  - 规则不回溯已有成绩
 */
const props = defineProps<{
  modelValue: boolean;
  competition: any;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
}>();

const visible = ref(false);
const saving = ref(false);
const isDefault = ref(true);
const rules = ref<{ rankNo: number | undefined; score: number | undefined }[]>(
  [],
);

async function loadRules() {
  if (!props.competition?.id) return;
  const res: any = await getCompetitionScoreRules(props.competition.id);
  isDefault.value = !!res?.isDefault;
  rules.value = (res?.rules ?? []).map((r: any) => ({ ...r }));
}

function addRow() {
  const maxRank = Math.max(0, ...rules.value.map((r) => r.rankNo ?? 0));
  rules.value.push({ rankNo: maxRank + 1, score: 0 });
}

function removeRow(index: number) {
  rules.value.splice(index, 1);
}

async function submit() {
  const rows = rules.value.filter((r) => r.rankNo);
  const ranks = rows.map((r) => r.rankNo);
  if (new Set(ranks).size !== ranks.length) {
    ElMessage.warning('名次不能重复');
    return;
  }
  saving.value = true;
  try {
    await saveCompetitionScoreRules(
      props.competition.id,
      rows.map((r) => ({ rankNo: r.rankNo, score: r.score ?? 0 })),
    );
    ElMessage.success('积分规则已保存，对之后新增/编辑的成绩生效（已有成绩不变）');
    visible.value = false;
  } finally {
    saving.value = false;
  }
}

/** 恢复默认：清空自定义规则（后端空数组即回落全局默认） */
async function resetToDefault() {
  await ElMessageBox.confirm(
    '确定清除该赛事的自定义积分规则，恢复默认 9/7/6/5/4/3/2/1？',
    '提示',
    { type: 'warning' },
  );
  saving.value = true;
  try {
    const res: any = await saveCompetitionScoreRules(props.competition.id, []);
    isDefault.value = !!res?.isDefault;
    rules.value = (res?.rules ?? []).map((r: any) => ({ ...r }));
    ElMessage.success('已恢复默认积分规则');
  } finally {
    saving.value = false;
  }
}

watch(
  () => props.modelValue,
  (v) => {
    visible.value = v;
    if (v) loadRules();
  },
);
watch(visible, (v) => emit('update:modelValue', v));
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="`积分设置 - ${competition?.title ?? ''}`"
    width="480px"
  >
    <el-alert
      v-if="isDefault"
      type="info"
      :closable="false"
      show-icon
      title="当前使用默认规则，修改并保存后将成为该赛事的自定义规则"
      style="margin-bottom: 12px"
    />
    <el-alert
      v-else
      type="success"
      :closable="false"
      show-icon
      title="当前为该赛事的自定义积分规则"
      style="margin-bottom: 12px"
    />
    <el-table :data="rules" border size="small">
      <el-table-column label="名次" width="160" align="center">
        <template #default="{ row }">
          <el-input-number v-model="row.rankNo" :min="1" :precision="0" size="small" />
        </template>
      </el-table-column>
      <el-table-column label="积分" width="160" align="center">
        <template #default="{ row }">
          <el-input-number v-model="row.score" :min="0" :precision="2" size="small" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center">
        <template #default="{ $index }">
          <el-button link type="danger" size="small" @click="removeRow($index)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="actions">
      <el-button size="small" @click="addRow">添加名次</el-button>
      <el-button size="small" :disabled="isDefault" @click="resetToDefault">
        恢复默认
      </el-button>
    </div>
    <div class="tip">规则仅影响之后新增/编辑的成绩，已有成绩的积分不变</div>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}
.tip {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}
</style>
