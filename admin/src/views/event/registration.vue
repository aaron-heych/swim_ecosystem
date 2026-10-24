<template>
  <div class="page">
    <!-- 搜索 -->
    <el-form :inline="true" :model="query" class="search-form">
      <el-form-item label="选手/手机">
        <el-input
          v-model="query.keyword"
          placeholder="选手姓名或手机号"
          clearable
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="赛事ID">
        <el-input-number
          v-model="query.eventId"
          :min="1"
          controls-position="right"
          placeholder="可选"
          style="width: 140px"
        />
      </el-form-item>
      <el-form-item label="支付状态">
        <el-select v-model="query.payStatus" placeholder="全部" clearable style="width: 140px">
          <el-option
            v-for="(item, k) in PAY_STATUS"
            :key="k"
            :label="item.label"
            :value="Number(k)"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">搜索</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="eventTitle" label="赛事" min-width="160" show-overflow-tooltip />
      <el-table-column prop="userDisplayName" label="报名账号" min-width="120" />
      <el-table-column prop="groupName" label="组别" min-width="120" show-overflow-tooltip />
      <el-table-column prop="playerName" label="选手姓名" min-width="120" />
      <el-table-column prop="phone" label="手机" min-width="130" />
      <el-table-column label="性别" width="80">
        <template #default="{ row }">
          <el-tag :type="row.gender === 1 ? 'primary' : 'warning'">
            {{ row.gender === 1 ? '男' : '女' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="age" label="年龄" width="80" />
      <el-table-column label="支付状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getDict(PAY_STATUS, row.payStatus).type">
            {{ getDict(PAY_STATUS, row.payStatus).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="报名费" width="100">
        <template #default="{ row }">¥{{ row.fee ?? 0 }}</template>
      </el-table-column>
      <el-table-column label="报名时间" width="180">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            :disabled="row.payStatus === 1"
            @click="onMarkPaid(row)"
          >
            标记已支付
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pager">
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="loadData"
        @current-change="loadData"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getRegistrationList, updateRegistrationPayStatus } from '@/api/event';
import { PAY_STATUS, getDict } from '@/utils/dict';

function formatTime(t: any) {
  if (!t) return '-';
  return new Date(t).toLocaleString('zh-CN');
}

const loading = ref(false);
const list = ref<any[]>([]);
const total = ref(0);
const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  eventId: undefined as number | undefined,
  payStatus: undefined as number | undefined,
});

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getRegistrationList({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword || undefined,
      eventId: query.eventId,
      payStatus: query.payStatus,
    });
    list.value = res.list || [];
    total.value = res.total || 0;
  } catch (e) {
    // 拦截器已提示
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
  query.eventId = undefined;
  query.payStatus = undefined;
  query.page = 1;
  loadData();
}

async function onMarkPaid(row: any) {
  try {
    await ElMessageBox.confirm(
      `确认将「${row.playerName}」的报名标记为已支付？`,
      '提示',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  try {
    await updateRegistrationPayStatus(row.id, {
      payStatus: 1,
      transactionId: 'OFFLINE_' + Date.now(),
    });
    ElMessage.success('已标记为已支付');
    loadData();
  } catch (e) {
    // 拦截器已提示
  }
}

onMounted(loadData);
</script>

<style scoped>
.page {
  padding: 16px;
}
.search-form {
  margin-bottom: 12px;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
