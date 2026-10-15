<template>
  <div class="page-container">
    <el-form :inline="true" :model="query" class="search-form" @submit.prevent="search">
      <el-form-item label="关键词">
        <el-input
          v-model="query.keyword"
          placeholder="标题 / 正文"
          clearable
          style="width: 200px"
          @keyup.enter="search"
        />
      </el-form-item>
      <el-form-item label="分类">
        <el-select v-model="query.category" clearable placeholder="全部分类" style="width: 150px">
          <el-option v-for="item in categories" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable placeholder="全部状态" style="width: 130px">
          <el-option label="草稿" :value="0" />
          <el-option label="已发布" :value="1" />
          <el-option label="已撤回" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="search">搜索</el-button>
        <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="openCreate">发布通知</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column label="标题" min-width="230">
        <template #default="{ row }">
          {{ row.title }}
        </template>
      </el-table-column>
      <el-table-column label="发布选项" min-width="190">
        <template #default="{ row }">
          <el-tag v-if="row.isPinned" type="warning" size="small">置顶</el-tag>
          <el-tag v-if="row.isImportant" type="danger" size="small">重要</el-tag>
          <el-tag v-if="row.requiresAttendance" type="success" size="small">
            需要确认参加
          </el-tag>
          <span
            v-if="!row.isPinned && !row.isImportant && !row.requiresAttendance"
            class="muted-text"
          >
            -
          </span>
        </template>
      </el-table-column>
      <el-table-column label="发布时间" width="170">
        <template #default="{ row }">{{ formatTime(row.publishedAt) }}</template>
      </el-table-column>
      <el-table-column label="分类" prop="category" width="110" />
      <el-table-column label="接收范围" width="150">
        <template #default="{ row }">{{ audienceLabel(row.audienceType) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
          <el-dropdown trigger="click" @command="(command: string) => onCommand(row, command)">
            <el-button link type="primary">
              操作
              <el-icon style="margin-left: 4px"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">编辑</el-dropdown-item>
                <el-dropdown-item command="copy" divided>复制</el-dropdown-item>
                <el-dropdown-item
                  v-if="row.status === 0 || row.status === 2"
                  command="publish"
                  divided
                >
                  {{ row.status === 2 ? '重新发布' : '发布' }}
                </el-dropdown-item>
                <el-dropdown-item v-if="row.status === 1" command="withdraw" divided>
                  撤回
                </el-dropdown-item>
                <el-dropdown-item v-if="row.status !== 0" command="recipients" divided>
                  阅读/参加情况
                </el-dropdown-item>
                <el-dropdown-item v-if="row.status !== 1" command="delete" divided>
                  删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="query.page"
      v-model:page-size="query.pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      background
      class="pagination"
      @size-change="loadData"
      @current-change="loadData"
    />

    <el-dialog
      v-model="formVisible"
      :title="editingId ? '编辑通知' : '新建通知'"
      width="760px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="通知标题" prop="title">
          <el-input v-model="form.title" maxlength="200" show-word-limit />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select
                v-model="form.category"
                filterable
                allow-create
                default-first-option
                style="width: 100%"
              >
                <el-option v-for="item in categories" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发布单位">
              <el-input v-model="form.publisherUnit" maxlength="150" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="通知正文" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="8" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="活动时间" prop="activityAt">
              <el-date-picker
                v-model="form.activityAt"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ss"
                placeholder="请选择活动时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动地点">
              <el-input v-model="form.location" maxlength="200" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="参加人员">
          <el-input v-model="form.participants" maxlength="500" />
        </el-form-item>
        <el-form-item label="发布范围" prop="audienceType">
          <el-radio-group v-model="form.audienceType" @change="onAudienceChange">
            <el-radio value="all_members">全部有效会员</el-radio>
            <el-radio value="association_presidents">冬泳协会会长</el-radio>
            <el-radio value="selected_members">指定会员</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-if="form.audienceType === 'association_presidents'"
          label="指定会长"
          prop="userIds"
        >
          <el-select
            v-model="form.userIds"
            multiple
            filterable
            remote
            reserve-keyword
            :remote-method="searchMembers"
            :loading="memberLoading"
            placeholder="不指定时发送给全部冬泳协会会长"
            style="width: 100%"
          >
            <el-option
              v-for="member in memberOptions"
              :key="member.userId"
              :label="memberLabel(member)"
              :value="member.userId"
            />
          </el-select>
          <div class="el-upload__tip">
            不选择会长时发送给全部有效冬泳协会会长；选择后仅发送给所选会长。
          </div>
        </el-form-item>
        <el-form-item v-if="form.audienceType === 'selected_members'" label="选择会员" prop="userIds">
          <el-select
            v-model="form.userIds"
            multiple
            filterable
            remote
            reserve-keyword
            :remote-method="searchMembers"
            :loading="memberLoading"
            placeholder="输入姓名或手机号搜索"
            style="width: 100%"
          >
            <el-option
              v-for="member in memberOptions"
              :key="member.userId"
              :label="memberLabel(member)"
              :value="member.userId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="发布选项">
          <el-checkbox v-model="form.isPinned">置顶</el-checkbox>
          <el-checkbox v-model="form.isImportant">重要</el-checkbox>
          <el-checkbox v-model="form.requiresAttendance">需要确认参加</el-checkbox>
        </el-form-item>
        <el-form-item label="附件">
          <el-upload
            ref="attachmentUpload"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="uploadAttachment"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
          >
            <el-button :loading="attachmentLoading">上传附件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 PDF、Office 文档和图片，单个文件最大 10MB，最多 10 个。</div>
            </template>
          </el-upload>
          <div v-for="(file, index) in form.attachments" :key="file.url" class="attachment-row">
            <a :href="file.url" target="_blank" rel="noreferrer">{{ file.name }}</a>
            <el-button link type="danger" @click="removeAttachment(index)">移除</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button :loading="saving" @click="save(false)">保存草稿</el-button>
        <el-button type="primary" :loading="saving" @click="save(true)">保存并发布</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="recipientsVisible" title="通知阅读与参加情况" width="820px">
      <div class="recipient-toolbar">
        <el-input
          v-model="recipientQuery.keyword"
          placeholder="姓名 / 手机号"
          clearable
          style="width: 220px"
          @keyup.enter="loadRecipients"
        />
        <el-select
          v-model="recipientQuery.isRead"
          clearable
          placeholder="全部阅读状态"
          style="width: 150px"
          @change="loadRecipients"
        >
          <el-option label="已读" :value="1" />
          <el-option label="未读" :value="0" />
        </el-select>
        <el-select
          v-model="recipientQuery.attendanceStatus"
          clearable
          placeholder="全部参加状态"
          style="width: 160px"
          @change="loadRecipients"
        >
          <el-option label="参加" :value="1" />
          <el-option label="不参加" :value="2" />
          <el-option label="未反馈" :value="0" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="loadRecipients">搜索</el-button>
        <el-button :icon="Download" @click="exportAttendance">导出名单</el-button>
      </div>
      <el-table v-loading="recipientLoading" :data="recipients" border>
        <el-table-column label="姓名" prop="realName" min-width="120" />
        <el-table-column label="手机号" prop="phone" min-width="130" />
        <el-table-column label="阅读状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isRead ? 'success' : 'info'">{{ row.isRead ? '已读' : '未读' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="阅读时间" min-width="170">
          <template #default="{ row }">{{ formatTime(row.readAt) }}</template>
        </el-table-column>
        <el-table-column label="参加状态" width="110">
          <template #default="{ row }">{{ attendanceLabel(row.attendanceStatus) }}</template>
        </el-table-column>
        <el-table-column label="反馈时间" min-width="170">
          <template #default="{ row }">{{ formatTime(row.respondedAt) }}</template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="recipientQuery.page"
        v-model:page-size="recipientQuery.pageSize"
        :total="recipientTotal"
        layout="total, prev, pager, next"
        class="pagination"
        @current-change="loadRecipients"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from 'element-plus';
import { ArrowDown, Download, Plus, Refresh, Search } from '@element-plus/icons-vue';
import {
  createAnnouncement,
  deleteAnnouncement,
  exportAnnouncementAttendance,
  getAnnouncement,
  getAnnouncementList,
  getAnnouncementMembers,
  getAnnouncementRecipients,
  publishAnnouncement,
  updateAnnouncement,
  uploadAnnouncementAttachment,
  withdrawAnnouncement,
} from '@/api/notification';

type AnnouncementAttachment = { name: string; url: string; size?: number };
type MemberOption = {
  userId: number;
  realName: string;
  phone: string;
  associationName: string;
};

const categories = ['党建通知', '活动通知', '会议通知', '安全通知'];
const loading = ref(false);
const saving = ref(false);
const attachmentLoading = ref(false);
const memberLoading = ref(false);
const recipientLoading = ref(false);
const formVisible = ref(false);
const recipientsVisible = ref(false);
const editingId = ref<number | null>(null);
const recipientAnnouncementId = ref<number | null>(null);
const formRef = ref<FormInstance>();
const attachmentUpload = ref<any>();
const list = ref<any[]>([]);
const total = ref(0);
const recipients = ref<any[]>([]);
const recipientTotal = ref(0);
const memberOptions = ref<MemberOption[]>([]);
const dateRange = ref<string[]>();
const query = reactive<any>({
  keyword: '',
  category: '',
  status: '',
  page: 1,
  pageSize: 10,
});
const recipientQuery = reactive<any>({
  keyword: '',
  isRead: '',
  attendanceStatus: '',
  page: 1,
  pageSize: 10,
});
const form = reactive({
  title: '',
  category: '',
  publisherUnit: '',
  content: '',
  activityAt: '',
  location: '',
  participants: '',
  attachments: [] as AnnouncementAttachment[],
  audienceType: 'all_members',
  userIds: [] as number[],
  isPinned: false,
  isImportant: false,
  requiresAttendance: false,
});
const rules: FormRules = {
  title: [{ required: true, message: '请输入通知标题', trigger: 'blur' }],
  category: [{ required: true, message: '请选择通知分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入通知正文', trigger: 'blur' }],
  activityAt: [{ required: true, message: '请选择活动时间', trigger: 'change' }],
  audienceType: [{ required: true, message: '请选择发布范围', trigger: 'change' }],
  userIds: [
    {
      validator: (_rule, value, callback) => {
        if (form.audienceType === 'selected_members' && !value?.length) {
          callback(new Error('请选择接收会员'));
        } else callback();
      },
      trigger: 'change',
    },
  ],
};

const formatTime = (value?: string | number | Date) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('zh-CN', { hour12: false });
};
const statusLabel = (status: number) => ({ 0: '草稿', 1: '已发布', 2: '已撤回' })[status] || '-';
const statusTag = (status: number) => ({ 0: 'info', 1: 'success', 2: 'warning' } as any)[status] || 'info';
const audienceLabel = (type: string) =>
  ({
    all_members: '全部有效会员',
    association_presidents: '冬泳协会会长',
    association_admins: '协会会长/管理员',
    selected_members: '指定会员',
  })[type] || type;
const attendanceLabel = (status: number | null) =>
  status === 1 ? '参加' : status === 2 ? '不参加' : '未反馈';
const memberLabel = (member: MemberOption) =>
  `${member.realName}（${member.associationName || '未分组'} · ${member.phone || '无手机号'}）`;

async function loadData() {
  loading.value = true;
  try {
    const params: any = { page: query.page, pageSize: query.pageSize };
    if (query.keyword) params.keyword = query.keyword;
    if (query.category) params.category = query.category;
    if (query.status !== '') params.status = query.status;
    if (dateRange.value?.[0]) params.startDate = dateRange.value[0];
    if (dateRange.value?.[1]) params.endDate = dateRange.value[1];
    const response: any = await getAnnouncementList(params);
    list.value = response.list || [];
    total.value = response.total || 0;
  } finally {
    loading.value = false;
  }
}
function search() {
  query.page = 1;
  loadData();
}
function resetSearch() {
  query.keyword = '';
  query.category = '';
  query.status = '';
  dateRange.value = undefined;
  search();
}
function resetForm() {
  editingId.value = null;
  memberOptions.value = [];
  Object.assign(form, {
    title: '',
    category: '',
    publisherUnit: '',
    content: '',
    activityAt: '',
    location: '',
    participants: '',
    attachments: [],
    audienceType: 'all_members',
    userIds: [],
    isPinned: false,
    isImportant: false,
    requiresAttendance: false,
  });
}
function onAudienceChange() {
  form.userIds = [];
  memberOptions.value = [];
}
function openCreate() {
  resetForm();
  formVisible.value = true;
}
async function openEdit(row: any) {
  const data: any = await getAnnouncement(row.id);
  editingId.value = row.id;
  memberOptions.value = data.selectedMembers || [];
  Object.assign(form, {
    title: data.title,
    category: data.category,
    publisherUnit: data.publisherUnit || '',
    content: data.content,
    activityAt: data.activityAt || '',
    location: data.location || '',
    participants: data.participants || '',
    attachments: data.attachments || [],
    audienceType: data.audienceType,
    userIds: data.userIds || [],
    isPinned: Boolean(data.isPinned),
    isImportant: Boolean(data.isImportant),
    requiresAttendance: Boolean(data.requiresAttendance),
  });
  formVisible.value = true;
}
async function copyAnnouncement(row: any) {
  const data: any = await getAnnouncement(row.id);
  editingId.value = null;
  memberOptions.value = data.selectedMembers || [];
  Object.assign(form, {
    title: data.title,
    category: data.category,
    publisherUnit: data.publisherUnit || '',
    content: data.content,
    activityAt: data.activityAt || '',
    location: data.location || '',
    participants: data.participants || '',
    attachments: data.attachments || [],
    audienceType: data.audienceType,
    userIds: data.userIds || [],
    isPinned: Boolean(data.isPinned),
    isImportant: Boolean(data.isImportant),
    requiresAttendance: Boolean(data.requiresAttendance),
  });
  formVisible.value = true;
}
function onCommand(row: any, command: string) {
  switch (command) {
    case 'edit':
      return openEdit(row);
    case 'copy':
      return copyAnnouncement(row);
    case 'publish':
      return publish(row);
    case 'withdraw':
      return withdraw(row);
    case 'recipients':
      return openRecipients(row);
    case 'delete':
      return remove(row);
  }
}
function payload() {
  return {
    ...form,
    userIds: ['selected_members', 'association_presidents'].includes(form.audienceType)
      ? form.userIds
      : [],
  };
}
async function save(publishAfter: boolean) {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    let id = editingId.value;
    if (id) await updateAnnouncement(id, payload());
    else {
      const created: any = await createAnnouncement(payload());
      id = created.id;
      editingId.value = id;
    }
    if (publishAfter && id) await publishAnnouncement(id);
    ElMessage.success(publishAfter ? '通知已发布' : '草稿已保存');
    formVisible.value = false;
    await loadData();
  } finally {
    saving.value = false;
  }
}
async function publish(row: any) {
  const isRepublish = row.status === 2;
  const message = isRepublish
    ? '重新发布后，当前接收范围内的会员可再次查看通知；已有接收人的阅读和参加记录会保留。确认重新发布？'
    : '发布后接收会员可在通知公告中查看，确认发布？';
  await ElMessageBox.confirm(message, isRepublish ? '重新发布通知' : '发布通知', {
    type: 'warning',
  });
  await publishAnnouncement(row.id);
  ElMessage.success(isRepublish ? '通知已重新发布' : '通知已发布');
  await loadData();
}
async function withdraw(row: any) {
  await ElMessageBox.confirm('撤回后会员将无法继续查看该通知，确认撤回？', '撤回通知', {
    type: 'warning',
  });
  await withdrawAnnouncement(row.id);
  ElMessage.success('通知已撤回');
  await loadData();
}
async function remove(row: any) {
  await ElMessageBox.confirm('确认删除该通知？', '删除通知', { type: 'warning' });
  await deleteAnnouncement(row.id);
  ElMessage.success('通知已删除');
  await loadData();
}
async function searchMembers(keyword: string) {
  memberLoading.value = true;
  try {
    const response: any = await getAnnouncementMembers({
      page: 1,
      pageSize: 50,
      keyword: keyword || undefined,
      role: form.audienceType === 'association_presidents' ? 1 : undefined,
    });
    const byId = new Map(memberOptions.value.map((member) => [member.userId, member]));
    (response.list || []).forEach((member: MemberOption) => byId.set(member.userId, member));
    memberOptions.value = [...byId.values()];
  } finally {
    memberLoading.value = false;
  }
}
async function uploadAttachment(uploadFile: any) {
  const file: File | undefined = uploadFile.raw;
  if (!file) return;
  if (form.attachments.length >= 10) {
    ElMessage.warning('最多上传 10 个附件');
    attachmentUpload.value?.clearFiles();
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.warning('单个附件不能超过 10MB');
    attachmentUpload.value?.clearFiles();
    return;
  }
  attachmentLoading.value = true;
  try {
    const result: any = await uploadAnnouncementAttachment(file);
    form.attachments.push(result);
  } finally {
    attachmentLoading.value = false;
    attachmentUpload.value?.clearFiles();
  }
}
function removeAttachment(index: number) {
  form.attachments.splice(index, 1);
}
async function openRecipients(row: any) {
  recipientAnnouncementId.value = row.id;
  recipientQuery.keyword = '';
  recipientQuery.isRead = '';
  recipientQuery.attendanceStatus = '';
  recipientQuery.page = 1;
  recipientsVisible.value = true;
  await loadRecipients();
}
async function loadRecipients() {
  if (!recipientAnnouncementId.value) return;
  recipientLoading.value = true;
  try {
    const params: any = {
      page: recipientQuery.page,
      pageSize: recipientQuery.pageSize,
    };
    if (recipientQuery.keyword) params.keyword = recipientQuery.keyword;
    if (recipientQuery.isRead !== '') params.isRead = recipientQuery.isRead;
    if (recipientQuery.attendanceStatus !== '') {
      params.attendanceStatus = recipientQuery.attendanceStatus;
    }
    const response: any = await getAnnouncementRecipients(
      recipientAnnouncementId.value,
      params,
    );
    recipients.value = response.list || [];
    recipientTotal.value = response.total || 0;
  } finally {
    recipientLoading.value = false;
  }
}
async function exportAttendance() {
  if (!recipientAnnouncementId.value) return;
  const blob = await exportAnnouncementAttendance(recipientAnnouncementId.value);
  const url = URL.createObjectURL(blob as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `通知参加名单-${recipientAnnouncementId.value}.csv`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

onMounted(loadData);
</script>

<style scoped>
.page-container {
  padding: 16px;
}
.search-form {
  margin-bottom: 16px;
}
.toolbar {
  margin-bottom: 12px;
}
.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
.muted-text {
  color: var(--el-text-color-placeholder);
}
.attachment-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 28px;
}
.recipient-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
</style>
