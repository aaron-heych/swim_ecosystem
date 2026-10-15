<template>
  <div class="page">
    <!-- 搜索 -->
    <el-form :inline="true" :model="query" class="search-form">
      <el-form-item label="赛事名">
        <el-input
          v-model="query.keyword"
          placeholder="请输入赛事名"
          clearable
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="审核状态">
        <el-select v-model="query.auditStatus" placeholder="全部" clearable style="width: 140px">
          <el-option
            v-for="(item, k) in AUDIT_STATUS"
            :key="k"
            :label="item.label"
            :value="Number(k)"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 140px">
          <el-option
            v-for="(item, k) in ENABLE_STATUS"
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

    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="openCreate">新增赛事</el-button>
    </div>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
      <el-table-column prop="organizer" label="主办方" min-width="140" show-overflow-tooltip />
      <el-table-column prop="location" label="地点" min-width="140" show-overflow-tooltip />
      <el-table-column label="开始时间" width="160">
        <template #default="{ row }">{{ formatTime(row.startTime) }}</template>
      </el-table-column>
      <el-table-column label="结束时间" width="160">
        <template #default="{ row }">{{ formatTime(row.endTime) }}</template>
      </el-table-column>
      <el-table-column label="报名截止" width="160">
        <template #default="{ row }">{{ formatTime(row.enrollDeadline) }}</template>
      </el-table-column>
      <el-table-column label="审核状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getDict(AUDIT_STATUS, row.auditStatus).type">
            {{ getDict(AUDIT_STATUS, row.auditStatus).label }}
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
      <el-table-column label="热门" width="80">
        <template #default="{ row }">
          <el-tag :type="row.isHot ? 'danger' : 'info'">
            {{ row.isHot ? '热门' : '普通' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="160">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="360" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openGroupDrawer(row)">组别管理</el-button>
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="warning" @click="openAudit(row)">审核</el-button>
          <el-button
            link
            :type="row.status === 1 ? 'danger' : 'success'"
            @click="onToggleStatus(row)"
          >
            {{ row.status === 1 ? '禁用' : '启用' }}
          </el-button>
          <el-button
            link
            :type="row.isHot ? 'info' : 'danger'"
            @click="onToggleHot(row)"
          >
            {{ row.isHot ? '取消热门' : '设为热门' }}
          </el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
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

    <!-- 赛事编辑/新增 -->
    <el-dialog
      v-model="formVisible"
      :title="form.id ? '编辑赛事' : '新增赛事'"
      width="640px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入赛事标题" />
        </el-form-item>
        <el-form-item label="主办方" prop="organizer">
          <el-input v-model="form.organizer" placeholder="请输入主办方" />
        </el-form-item>
        <el-form-item label="地点" prop="location">
          <el-input v-model="form.location" placeholder="请输入赛事地点" />
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="form.startTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择开始时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
            v-model="form.endTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择结束时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="报名截止" prop="enrollDeadline">
          <el-date-picker
            v-model="form.enrollDeadline"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择报名截止时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="赛事描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="onSubmitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 审核 -->
    <el-dialog
      v-model="auditVisible"
      title="赛事审核"
      width="480px"
      @closed="resetAudit"
    >
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="赛事标题">
          <span>{{ auditForm.title }}</span>
        </el-form-item>
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.auditStatus">
            <el-radio :value="1">通过</el-radio>
            <el-radio :value="2">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核备注">
          <el-input v-model="auditForm.auditRemark" type="textarea" :rows="3" placeholder="审核备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="onSubmitAudit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 组别管理 -->
    <el-drawer
      v-model="groupDrawerVisible"
      :title="`组别管理 - ${currentEvent?.title || ''}`"
      size="900px"
      direction="rtl"
    >
      <div class="drawer-toolbar">
        <el-button type="primary" :icon="Plus" @click="openGroupCreate">新增组别</el-button>
      </div>
      <el-table v-loading="groupLoading" :data="groupList" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column label="性别限制" width="100">
          <template #default="{ row }">{{ formatGenderLimit(row.genderLimit) }}</template>
        </el-table-column>
        <el-table-column prop="minAge" label="年龄下限" width="100" />
        <el-table-column prop="maxAge" label="年龄上限" width="100" />
        <el-table-column label="费用" width="100">
          <template #default="{ row }">¥{{ row.fee ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openGroupEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="onDeleteGroup(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 组别编辑/新增 -->
      <el-dialog
        v-model="groupFormVisible"
        :title="groupForm.id ? '编辑组别' : '新增组别'"
        width="480px"
        append-to-body
        @closed="resetGroupForm"
      >
        <el-form :model="groupForm" label-width="100px">
          <el-form-item label="名称">
            <el-input v-model="groupForm.name" placeholder="组别名称" />
          </el-form-item>
          <el-form-item label="性别限制">
            <el-select v-model="groupForm.genderLimit" placeholder="不限" clearable style="width: 100%">
              <el-option label="不限" :value="0" />
              <el-option label="仅男" :value="1" />
              <el-option label="仅女" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="年龄下限">
            <el-input-number v-model="groupForm.minAge" :min="0" :max="100" />
          </el-form-item>
          <el-form-item label="年龄上限">
            <el-input-number v-model="groupForm.maxAge" :min="0" :max="100" />
          </el-form-item>
          <el-form-item label="费用">
            <el-input-number v-model="groupForm.fee" :min="0" :precision="2" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="groupFormVisible = false">取消</el-button>
          <el-button type="primary" :loading="groupSubmitting" @click="onSubmitGroup">确定</el-button>
        </template>
      </el-dialog>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import {
  getEventList,
  createEvent,
  updateEvent,
  auditEvent,
  updateEventStatus,
  updateEventHot,
  deleteEvent,
  getGroupList,
  createGroup,
  updateGroup,
  deleteGroup,
} from '@/api/event';
import { AUDIT_STATUS, ENABLE_STATUS, getDict } from '@/utils/dict';

function formatTime(t: any) {
  if (!t) return '-';
  return new Date(t).toLocaleString('zh-CN');
}

function formatGenderLimit(v: any) {
  const m: Record<number, string> = { 0: '不限', 1: '仅男', 2: '仅女' };
  return m[v] ?? '不限';
}

const loading = ref(false);
const list = ref<any[]>([]);
const total = ref(0);
const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  auditStatus: undefined as number | undefined,
  status: undefined as number | undefined,
});

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getEventList({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword || undefined,
      auditStatus: query.auditStatus,
      status: query.status,
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
  query.auditStatus = undefined;
  query.status = undefined;
  query.page = 1;
  loadData();
}

/* 赛事表单 */
const formVisible = ref(false);
const formRef = ref<FormInstance>();
const submitting = ref(false);
const form = reactive({
  id: 0,
  title: '',
  organizer: '',
  location: '',
  startTime: '',
  endTime: '',
  enrollDeadline: '',
  description: '',
});

function resetForm() {
  form.id = 0;
  form.title = '';
  form.organizer = '';
  form.location = '';
  form.startTime = '';
  form.endTime = '';
  form.enrollDeadline = '';
  form.description = '';
  formRef.value?.resetFields();
}

function openCreate() {
  resetForm();
  formVisible.value = true;
}

function openEdit(row: any) {
  resetForm();
  Object.assign(form, {
    id: row.id,
    title: row.title || '',
    organizer: row.organizer || '',
    location: row.location || '',
    startTime: row.startTime || '',
    endTime: row.endTime || '',
    enrollDeadline: row.enrollDeadline || '',
    description: row.description || '',
  });
  formVisible.value = true;
}

async function onSubmitForm() {
  submitting.value = true;
  try {
    if (form.id) {
      await updateEvent(form.id, { ...form });
      ElMessage.success('编辑成功');
    } else {
      await createEvent({ ...form });
      ElMessage.success('新增成功');
    }
    formVisible.value = false;
    loadData();
  } catch (e) {
    // 拦截器已提示
  } finally {
    submitting.value = false;
  }
}

/* 审核 */
const auditVisible = ref(false);
const auditForm = reactive({
  id: 0,
  title: '',
  auditStatus: 1,
  auditRemark: '',
});

function resetAudit() {
  auditForm.id = 0;
  auditForm.title = '';
  auditForm.auditStatus = 1;
  auditForm.auditRemark = '';
}

function openAudit(row: any) {
  resetAudit();
  auditForm.id = row.id;
  auditForm.title = row.title;
  auditVisible.value = true;
}

async function onSubmitAudit() {
  submitting.value = true;
  try {
    await auditEvent(auditForm.id, {
      auditStatus: auditForm.auditStatus,
      auditRemark: auditForm.auditRemark,
    });
    ElMessage.success('审核完成');
    auditVisible.value = false;
    loadData();
  } catch (e) {
    // 拦截器已提示
  } finally {
    submitting.value = false;
  }
}

/* 启用/禁用 */
async function onToggleStatus(row: any) {
  const target = row.status === 1 ? 0 : 1;
  const text = target === 1 ? '启用' : '禁用';
  try {
    await ElMessageBox.confirm(`确认${text}赛事「${row.title}」？`, '提示', {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    await updateEventStatus(row.id, target);
    ElMessage.success(`${text}成功`);
    loadData();
  } catch (e) {
    // 拦截器已提示
  }
}

/* 设为热门/取消 */
async function onToggleHot(row: any) {
  const target = row.isHot ? 0 : 1;
  const text = target === 1 ? '设为热门' : '取消热门';
  try {
    await ElMessageBox.confirm(`确认${text}赛事「${row.title}」？`, '提示', {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    await updateEventHot(row.id, target);
    ElMessage.success(`${text}成功`);
    loadData();
  } catch (e) {
    // 拦截器已提示
  }
}

/* 删除 */
async function onDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      `确认删除赛事「${row.title}」？删除后不可恢复`,
      '危险操作',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  try {
    await deleteEvent(row.id);
    ElMessage.success('删除成功');
    loadData();
  } catch (e) {
    // 拦截器已提示
  }
}

/* 组别管理 */
const groupDrawerVisible = ref(false);
const groupLoading = ref(false);
const groupList = ref<any[]>([]);
const currentEvent = ref<any>(null);

async function loadGroupList(eventId: number) {
  groupLoading.value = true;
  try {
    const res: any = await getGroupList(eventId);
    groupList.value = Array.isArray(res) ? res : res.list || [];
  } catch (e) {
    // 拦截器已提示
  } finally {
    groupLoading.value = false;
  }
}

function openGroupDrawer(row: any) {
  currentEvent.value = row;
  groupDrawerVisible.value = true;
  loadGroupList(row.id);
}

/* 组别表单 */
const groupFormVisible = ref(false);
const groupSubmitting = ref(false);
const groupForm = reactive({
  id: 0,
  name: '',
  genderLimit: 0,
  minAge: 0,
  maxAge: 0,
  fee: 0,
});

function resetGroupForm() {
  groupForm.id = 0;
  groupForm.name = '';
  groupForm.genderLimit = 0;
  groupForm.minAge = 0;
  groupForm.maxAge = 0;
  groupForm.fee = 0;
}

function openGroupCreate() {
  resetGroupForm();
  groupFormVisible.value = true;
}

function openGroupEdit(row: any) {
  resetGroupForm();
  Object.assign(groupForm, {
    id: row.id,
    name: row.name || '',
    genderLimit: row.genderLimit ?? 0,
    minAge: row.minAge ?? 0,
    maxAge: row.maxAge ?? 0,
    fee: row.fee ?? 0,
  });
  groupFormVisible.value = true;
}

async function onSubmitGroup() {
  if (!currentEvent.value) return;
  const eventId = currentEvent.value.id;
  groupSubmitting.value = true;
  try {
    if (groupForm.id) {
      await updateGroup(eventId, groupForm.id, { ...groupForm });
      ElMessage.success('编辑成功');
    } else {
      await createGroup(eventId, { ...groupForm });
      ElMessage.success('新增成功');
    }
    groupFormVisible.value = false;
    loadGroupList(eventId);
  } catch (e) {
    // 拦截器已提示
  } finally {
    groupSubmitting.value = false;
  }
}

async function onDeleteGroup(row: any) {
  if (!currentEvent.value) return;
  const eventId = currentEvent.value.id;
  try {
    await ElMessageBox.confirm(`确认删除组别「${row.name}」？`, '危险操作', {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    await deleteGroup(eventId, row.id);
    ElMessage.success('删除成功');
    loadGroupList(eventId);
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
.toolbar {
  margin-bottom: 12px;
  display: flex;
  justify-content: flex-end;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.drawer-toolbar {
  margin-bottom: 12px;
}
</style>
