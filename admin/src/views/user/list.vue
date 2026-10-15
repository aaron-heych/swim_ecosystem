<template>
  <div class="user-list-page">
    <el-card>
      <el-form :inline="true" :model="query">
        <el-form-item label="关键词">
          <el-input
            v-model="query.keyword"
            placeholder="用户名 / 手机号"
            clearable
            style="width: 220px"
            @keyup.enter="onSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="query.status"
            placeholder="全部"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="(v, k) in ENABLE_STATUS"
              :key="k"
              :label="v.label"
              :value="Number(k)"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">搜索</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column label="ID" prop="id" width="80" />
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :src="row.avatar" :size="36" />
          </template>
        </el-table-column>
        <el-table-column label="用户名" prop="username" min-width="120" />
        <el-table-column label="手机号" prop="phone" width="140" />
        <el-table-column label="昵称" prop="nickname" min-width="120" />
        <el-table-column label="性别" width="90">
          <template #default="{ row }">
            <el-tag :type="getDict(GENDER, row.gender).type">
              {{ getDict(GENDER, row.gender).label }}
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
        <el-table-column label="注册时间" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="110" fixed="right">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 1"
              active-text="启用"
              inactive-text="禁用"
              @change="onToggleStatus(row)"
            />
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pager"
        :total="total"
        :current-page="query.page"
        :page-size="query.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="onSizeChange"
        @current-change="onPageChange"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getUserList, updateUserStatus } from '@/api/user';
import { GENDER, ENABLE_STATUS, getDict } from '@/utils/dict';

const loading = ref(false);
const list = ref<any[]>([]);
const total = ref(0);
const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  status: undefined as number | undefined,
});

function formatTime(t: any) {
  if (!t) return '-';
  return new Date(t).toLocaleString('zh-CN');
}

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getUserList(query);
    list.value = res.list || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  query.page = 1;
  loadData();
}
function onReset() {
  query.keyword = '';
  query.status = undefined;
  query.page = 1;
  loadData();
}
function onSizeChange(size: number) {
  query.pageSize = size;
  query.page = 1;
  loadData();
}
function onPageChange(p: number) {
  query.page = p;
  loadData();
}

async function onToggleStatus(row: any) {
  const next = row.status === 1 ? 0 : 1;
  const action = next === 1 ? '启用' : '禁用';
  try {
    await ElMessageBox.confirm(
      `确认${action}用户 ${row.username || row.phone} 吗？`,
      '提示',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  try {
    await updateUserStatus(row.id, next);
    row.status = next;
    ElMessage.success(`${action}成功`);
  } catch {
    // 错误已统一处理
  }
}

onMounted(loadData);
</script>

<style scoped>
.table-card {
  margin-top: 16px;
}
.pager {
  margin-top: 16px;
  text-align: right;
}
</style>
