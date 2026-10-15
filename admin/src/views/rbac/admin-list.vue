<template>
  <div class="admin-list-page">
    <el-card>
      <el-form :inline="true" :model="query">
        <el-form-item label="关键词">
          <el-input
            v-model="query.keyword"
            placeholder="用户名 / 真实姓名 / 手机号"
            clearable
            style="width: 240px"
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
      <div class="toolbar">
        <el-button type="primary" @click="onAdd">新增管理员</el-button>
      </div>
      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column label="ID" prop="id" width="80" />
        <el-table-column label="用户名" prop="username" min-width="120" />
        <el-table-column label="真实姓名" prop="realName" min-width="120" />
        <el-table-column label="手机号" prop="phone" width="140" />
        <el-table-column label="角色" min-width="200">
          <template #default="{ row }">
            <template v-if="row.roles && row.roles.length">
              <el-tag
                v-for="r in row.roles"
                :key="r.id"
                class="role-tag"
                type="primary"
              >
                {{ r.name }}
              </el-tag>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getDict(ENABLE_STATUS, row.status).type">
              {{ getDict(ENABLE_STATUS, row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="onEdit(row)">编辑</el-button>
            <el-button link type="warning" @click="onResetPassword(row)">
              重置密码
            </el-button>
            <el-button link type="primary" @click="onAssignRoles(row)">
              分配角色
            </el-button>
            <el-button
              link
              :type="row.status === 1 ? 'danger' : 'success'"
              @click="onToggleStatus(row)"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
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

    <!-- 新增/编辑管理员 -->
    <el-dialog
      v-model="formDialog.visible"
      :title="formDialog.id ? '编辑管理员' : '新增管理员'"
      width="500px"
      @closed="onFormClosed"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="!!formDialog.id" />
        </el-form-item>
        <el-form-item v-if="!formDialog.id" label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="form.realName" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="onSubmitForm">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 重置密码 -->
    <el-dialog
      v-model="pwdDialog.visible"
      title="重置密码"
      width="420px"
      @closed="onPwdClosed"
    >
      <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="100px">
        <el-form-item label="新密码" prop="password">
          <el-input v-model="pwdForm.password" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="onSubmitPassword">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 分配角色 -->
    <el-dialog
      v-model="roleDialog.visible"
      title="分配角色"
      width="420px"
      @closed="onRoleClosed"
    >
      <el-checkbox-group v-model="roleForm.roleIds">
        <el-checkbox
          v-for="r in roleOptions"
          :key="r.id"
          :label="r.id"
          style="display: block; margin-bottom: 8px"
        >
          {{ r.name }}（{{ r.code }}）
        </el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="roleDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="onSubmitRoles">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from 'element-plus';
import {
  getAdminList,
  createAdmin,
  updateAdmin,
  resetAdminPassword,
  updateAdminRoles,
  updateAdminStatus,
  getRoleList,
} from '@/api/user';
import { ENABLE_STATUS, getDict } from '@/utils/dict';

const loading = ref(false);
const submitting = ref(false);
const list = ref<any[]>([]);
const total = ref(0);
const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  status: undefined as number | undefined,
});

const roleOptions = ref<any[]>([]);

const formRef = ref<FormInstance>();
const pwdFormRef = ref<FormInstance>();

const formDialog = reactive({ visible: false, id: 0 });
const form = reactive({
  username: '',
  password: '',
  realName: '',
  phone: '',
  email: '',
});
const rules = computed<FormRules>(() => {
  const base: FormRules = {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  };
  if (!formDialog.id) {
    base.password = [{ required: true, message: '请输入密码', trigger: 'blur' }];
  }
  return base;
});

const pwdDialog = reactive({ visible: false, id: 0 });
const pwdForm = reactive({ password: '' });
const pwdRules: FormRules = {
  password: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
};

const roleDialog = reactive({ visible: false, id: 0 });
const roleForm = reactive({ roleIds: [] as number[] });

function formatTime(t: any) {
  if (!t) return '-';
  return new Date(t).toLocaleString('zh-CN');
}

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getAdminList(query);
    list.value = res.list || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
}

async function loadRoleOptions() {
  try {
    const res: any = await getRoleList({ page: 1, pageSize: 1000 });
    roleOptions.value = res.list || [];
  } catch {
    // ignore
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

function onFormClosed() {
  formRef.value?.resetFields();
  formDialog.id = 0;
}
function onPwdClosed() {
  pwdFormRef.value?.resetFields();
  pwdDialog.id = 0;
}
function onRoleClosed() {
  roleForm.roleIds = [];
  roleDialog.id = 0;
}

function onAdd() {
  formRef.value?.resetFields();
  formDialog.id = 0;
  formDialog.visible = true;
}
function onEdit(row: any) {
  formRef.value?.resetFields();
  formDialog.id = row.id;
  form.username = row.username || '';
  form.password = '';
  form.realName = row.realName || '';
  form.phone = row.phone || '';
  form.email = row.email || '';
  formDialog.visible = true;
}
async function onSubmitForm() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      const payload: any = {
        username: form.username,
        realName: form.realName,
        phone: form.phone,
        email: form.email,
      };
      if (formDialog.id) {
        await updateAdmin(formDialog.id, payload);
        ElMessage.success('更新成功');
      } else {
        payload.password = form.password;
        await createAdmin(payload);
        ElMessage.success('创建成功');
      }
      formDialog.visible = false;
      loadData();
    } finally {
      submitting.value = false;
    }
  });
}

function onResetPassword(row: any) {
  pwdFormRef.value?.resetFields();
  pwdDialog.id = row.id;
  pwdDialog.visible = true;
}
async function onSubmitPassword() {
  if (!pwdFormRef.value) return;
  await pwdFormRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      await resetAdminPassword(pwdDialog.id, pwdForm.password);
      ElMessage.success('密码已重置');
      pwdDialog.visible = false;
    } finally {
      submitting.value = false;
    }
  });
}

async function onAssignRoles(row: any) {
  if (!roleOptions.value.length) {
    await loadRoleOptions();
  }
  roleDialog.id = row.id;
  roleForm.roleIds = (row.roles || []).map((r: any) => r.id);
  roleDialog.visible = true;
}
async function onSubmitRoles() {
  submitting.value = true;
  try {
    await updateAdminRoles(roleDialog.id, roleForm.roleIds);
    ElMessage.success('角色分配成功');
    roleDialog.visible = false;
    loadData();
  } finally {
    submitting.value = false;
  }
}

async function onToggleStatus(row: any) {
  const next = row.status === 1 ? 0 : 1;
  const action = next === 1 ? '启用' : '禁用';
  try {
    await ElMessageBox.confirm(
      `确认${action}管理员 ${row.username} 吗？`,
      '提示',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  try {
    await updateAdminStatus(row.id, next);
    row.status = next;
    ElMessage.success(`${action}成功`);
  } catch {
    // ignore
  }
}

onMounted(() => {
  loadData();
  loadRoleOptions();
});
</script>

<style scoped>
.table-card {
  margin-top: 16px;
}
.toolbar {
  margin-bottom: 12px;
}
.pager {
  margin-top: 16px;
  text-align: right;
}
.role-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}
</style>
