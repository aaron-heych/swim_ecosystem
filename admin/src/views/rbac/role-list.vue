<template>
  <div class="role-list-page">
    <el-card>
      <el-form :inline="true" :model="query">
        <el-form-item label="关键词">
          <el-input
            v-model="query.keyword"
            placeholder="角色名称 / 编码"
            clearable
            style="width: 240px"
            @keyup.enter="onSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">搜索</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <div class="toolbar">
        <el-button type="primary" @click="onAdd">新增角色</el-button>
      </div>
      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column label="ID" prop="id" width="80" />
        <el-table-column label="角色名称" prop="name" min-width="140" />
        <el-table-column label="角色编码" prop="code" width="160" />
        <el-table-column label="描述" prop="description" min-width="200" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getDict(ENABLE_STATUS, row.status).type">
              {{ getDict(ENABLE_STATUS, row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="onEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="onAssignPermissions(row)">
              分配权限
            </el-button>
            <el-button link type="danger" @click="onDelete(row)">删除</el-button>
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

    <!-- 新增/编辑角色 -->
    <el-dialog
      v-model="formDialog.visible"
      :title="formDialog.id ? '编辑角色' : '新增角色'"
      width="500px"
      @closed="onFormClosed"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="form.code" :disabled="!!formDialog.id" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="onSubmitForm">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 分配权限 -->
    <el-dialog
      v-model="permDialog.visible"
      title="分配权限"
      width="500px"
    >
      <el-tree
        ref="permTreeRef"
        :data="permTree"
        node-key="id"
        :props="{ label: 'name' }"
        show-checkbox
        check-strictly
        default-expand-all
        node-height="32"
      />
      <template #footer>
        <el-button @click="permDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="onSubmitPermissions">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue';
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from 'element-plus';
import {
  getRoleList,
  createRole,
  updateRole,
  deleteRole,
  getPermissionTree,
  updateRolePermissions,
} from '@/api/user';
import { ENABLE_STATUS, getDict } from '@/utils/dict';

const loading = ref(false);
const submitting = ref(false);
const list = ref<any[]>([]);
const total = ref(0);
const query = reactive({ page: 1, pageSize: 10, keyword: '' });

const formRef = ref<FormInstance>();
const permTreeRef = ref<any>();

const formDialog = reactive({ visible: false, id: 0 });
const form = reactive({ name: '', code: '', description: '' });
const rules: FormRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
};

const permDialog = reactive({ visible: false, id: 0 });
const permTree = ref<any[]>([]);

function formatTime(t: any) {
  if (!t) return '-';
  return new Date(t).toLocaleString('zh-CN');
}

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getRoleList(query);
    list.value = res.list || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
}

async function loadPermissionTree() {
  if (permTree.value.length) return;
  try {
    const res: any = await getPermissionTree();
    permTree.value = res || [];
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

function onAdd() {
  formRef.value?.resetFields();
  formDialog.id = 0;
  formDialog.visible = true;
}
function onEdit(row: any) {
  formRef.value?.resetFields();
  formDialog.id = row.id;
  form.name = row.name || '';
  form.code = row.code || '';
  form.description = row.description || '';
  formDialog.visible = true;
}
async function onSubmitForm() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      const payload = {
        name: form.name,
        code: form.code,
        description: form.description,
      };
      if (formDialog.id) {
        await updateRole(formDialog.id, payload);
        ElMessage.success('更新成功');
      } else {
        await createRole(payload);
        ElMessage.success('创建成功');
      }
      formDialog.visible = false;
      loadData();
    } finally {
      submitting.value = false;
    }
  });
}

async function onAssignPermissions(row: any) {
  await loadPermissionTree();
  permDialog.id = row.id;
  permDialog.visible = true;
  await nextTick();
  const ids: number[] =
    (row.permissions || []).map((p: any) => p.id) ||
    row.permissionIds ||
    [];
  permTreeRef.value?.setCheckedKeys(ids);
}
async function onSubmitPermissions() {
  const ids: number[] = permTreeRef.value?.getCheckedKeys() || [];
  submitting.value = true;
  try {
    await updateRolePermissions(permDialog.id, ids);
    ElMessage.success('权限分配成功');
    permDialog.visible = false;
    loadData();
  } finally {
    submitting.value = false;
  }
}

async function onDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      `确认删除角色 ${row.name} 吗？`,
      '提示',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  try {
    await deleteRole(row.id);
    ElMessage.success('删除成功');
    loadData();
  } catch {
    // ignore
  }
}

onMounted(loadData);
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
</style>
