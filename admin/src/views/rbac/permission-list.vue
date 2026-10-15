<template>
  <div class="permission-list-page">
    <el-card>
      <div class="toolbar">
        <el-button type="primary" @click="onAddRoot">新增顶级权限</el-button>
      </div>
      <el-table
        v-loading="loading"
        :data="tree"
        row-key="id"
        :tree-props="{ children: 'children' }"
        default-expand-all
        border
      >
        <el-table-column label="名称" prop="name" min-width="220" />
        <el-table-column label="编码" prop="code" width="200" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 1 ? 'primary' : 'warning'">
              {{ row.type === 1 ? '菜单' : '按钮' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="描述" prop="description" min-width="200" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="onAddChild(row)">
              新增子权限
            </el-button>
            <el-button link type="primary" @click="onEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="formDialog.visible"
      :title="formDialog.title"
      width="500px"
      @closed="onFormClosed"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="父级">
          <el-input :model-value="parentLabel" disabled />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="编码" prop="code">
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio :label="1">菜单</el-radio>
            <el-radio :label="2">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述">
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
  getPermissionTree,
  createPermission,
  updatePermission,
  deletePermission,
} from '@/api/user';

const loading = ref(false);
const submitting = ref(false);
const tree = ref<any[]>([]);

const formRef = ref<FormInstance>();
const formDialog = reactive({
  visible: false,
  title: '新增权限',
  id: 0,
});
const form = reactive({
  name: '',
  code: '',
  type: 1,
  description: '',
  parentId: 0,
});
const rules: FormRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入编码', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
};

const parentMap = ref<Record<number, string>>({});
const parentLabel = computed(
  () => (form.parentId ? parentMap.value[form.parentId] : '顶级') || '顶级',
);

function buildParentMap(nodes: any[]): Record<number, string> {
  const map: Record<number, string> = {};
  function walk(ns: any[]) {
    for (const n of ns || []) {
      map[n.id] = n.name;
      if (n.children && n.children.length) walk(n.children);
    }
  }
  walk(nodes);
  return map;
}

function formatTime(t: any) {
  if (!t) return '-';
  return new Date(t).toLocaleString('zh-CN');
}

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getPermissionTree();
    tree.value = res || [];
    parentMap.value = buildParentMap(tree.value);
  } finally {
    loading.value = false;
  }
}

function onFormClosed() {
  formRef.value?.resetFields();
  formDialog.id = 0;
  formDialog.parentId = 0;
}

function resetForm() {
  form.name = '';
  form.code = '';
  form.type = 1;
  form.description = '';
  form.parentId = 0;
}

function onAddRoot() {
  resetForm();
  formRef.value?.resetFields();
  formDialog.id = 0;
  formDialog.title = '新增顶级权限';
  formDialog.visible = true;
}
function onAddChild(row: any) {
  resetForm();
  formRef.value?.resetFields();
  form.parentId = row.id;
  formDialog.id = 0;
  formDialog.title = `新增子权限 - ${row.name}`;
  formDialog.visible = true;
}
function onEdit(row: any) {
  resetForm();
  formRef.value?.resetFields();
  form.name = row.name || '';
  form.code = row.code || '';
  form.type = row.type ?? 1;
  form.description = row.description || '';
  form.parentId = row.parentId || 0;
  formDialog.id = row.id;
  formDialog.title = `编辑权限 - ${row.name}`;
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
        type: form.type,
        description: form.description,
        parentId: form.parentId,
      };
      if (formDialog.id) {
        await updatePermission(formDialog.id, payload);
        ElMessage.success('更新成功');
      } else {
        await createPermission(payload);
        ElMessage.success('创建成功');
      }
      formDialog.visible = false;
      loadData();
    } finally {
      submitting.value = false;
    }
  });
}

async function onDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      `确认删除权限 ${row.name} 吗？子权限也会一并删除。`,
      '提示',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  try {
    await deletePermission(row.id);
    ElMessage.success('删除成功');
    loadData();
  } catch {
    // ignore
  }
}

onMounted(loadData);
</script>

<style scoped>
.toolbar {
  margin-bottom: 12px;
}
</style>
