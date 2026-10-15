<template>
  <div class="page-container">
    <!-- 赛事选择 -->
    <div class="search-bar">
      <el-form :inline="true">
        <el-form-item label="选择赛事">
          <el-select
            v-model="selectedId"
            placeholder="请选择赛事（仅比赛中/已结束）"
            filterable
            style="width: 360px"
          >
            <el-option
              v-for="c in competitions"
              :key="c.id"
              :label="c.title"
              :value="c.id"
            >
              <span>{{ c.title }}</span>
              <span class="opt-status">
                <el-tag :type="getDict(COMPETITION_STATUS, c.status).type" size="small">
                  {{ getDict(COMPETITION_STATUS, c.status).label }}
                </el-tag>
              </span>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <template v-if="current">
        <div class="comp-title">
          <span class="name">{{ current.title }}</span>
          <el-tag :type="getDict(COMPETITION_STATUS, current.status).type" size="small">
            {{ getDict(COMPETITION_STATUS, current.status).label }}
          </el-tag>
        </div>
        <ResultPanel :competition="current" />
      </template>
      <el-empty v-else description="请先选择赛事（草稿/报名中的赛事不提供成绩管理）" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getCompetitionList } from '@/api/competition';
import ResultPanel from '@/components/winter/ResultPanel.vue';
import { COMPETITION_STATUS, getDict } from '@/utils/dict';

/** 仅「比赛中(2)/已结束(3)」的赛事可做成绩管理（草稿/报名中/已取消不提供） */
const competitions = ref<any[]>([]);
const selectedId = ref<number | undefined>(undefined);

const current = computed(
  () => competitions.value.find((c) => c.id === selectedId.value) ?? null,
);

async function loadCompetitions() {
  const res: any = await getCompetitionList({ page: 1, pageSize: 100 });
  const list: any[] = res?.list ?? [];
  competitions.value = list.filter((c) => c.status === 2 || c.status === 3);
  // 默认选中第一个
  if (competitions.value.length && !selectedId.value) {
    selectedId.value = competitions.value[0].id;
  }
}

onMounted(loadCompetitions);
</script>

<style scoped>
.opt-status {
  float: right;
}
.comp-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.comp-title .name {
  font-size: 16px;
  font-weight: 600;
}
</style>
