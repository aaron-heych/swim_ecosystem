<template>
  <div class="page-container">
    <div class="page-head">
      <div>
        <div class="page-title">行政区管理</div>
        <div class="page-sub">维护省、市、区县数据，保存后立即应用于地区选择器</div>
      </div>
      <div class="page-actions">
        <el-button :icon="Refresh" :loading="loading" @click="loadRegions">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate(1)">新增省份</el-button>
      </div>
    </div>

    <el-alert
      class="region-tip"
      type="info"
      :closable="false"
      show-icon
      title="地区 code 会被协会、场馆、赛事和活动引用；修改 code 或名称时，已有业务记录会同步更新。地区不提供删除操作，请停用不再使用的地区。"
    />

    <el-card shadow="never">
      <el-input
        v-model="keyword"
        clearable
        placeholder="按地区名称或 code 搜索"
        style="width: 320px; margin-bottom: 16px"
      />
      <el-table
        v-loading="loading"
        :data="filteredRegions"
        row-key="id"
        :tree-props="{ children: 'children' }"
        border
        :default-expand-all="Boolean(keyword.trim())"
      >
        <el-table-column prop="name" label="地区名称" min-width="220" />
        <el-table-column prop="code" label="行政区划 code" width="180" />
        <el-table-column label="层级" width="110">
          <template #default="{ row }">{{ levelName(row.level) }}</template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="90" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.level < 3"
              link
              type="primary"
              :disabled="row.status !== 1"
              @click="openCreateChild(row)"
            >
              新增下级
            </el-button>
            <el-button link type="primary" @click="editTableRow(row)">编辑</el-button>
            <el-button
              link
              :type="row.status === 1 ? 'danger' : 'success'"
              @click="toggleTableRowStatus(row)"
            >
              {{ row.status === 1 ? '停用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无行政区数据" />
        </template>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editingRegion ? '编辑行政区' : `新增${levelName(form.level)}`"
      width="520px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item v-if="!editingRegion && form.level > 1" label="上级地区">
          <el-input :model-value="parentLabel" disabled />
        </el-form-item>
        <el-form-item label="地区名称" prop="name">
          <el-input v-model="form.name" maxlength="64" placeholder="请输入地区名称" />
        </el-form-item>
        <el-form-item label="行政区划 code" prop="code">
          <el-input v-model="form.code" maxlength="9" placeholder="请输入 2-9 位数字 code" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="999999" />
        </el-form-item>
        <el-form-item v-if="editingRegion" label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Plus, Refresh } from '@element-plus/icons-vue';
import {
  createRegion,
  getAdminRegionTree,
  updateRegion,
  type RegionItem,
} from '@/api/region';
import { useUserStore } from '@/store/user';

const router = useRouter();
const userStore = useUserStore();
const isSuperAdmin = computed(() => userStore.roleCodes().includes('super_admin'));
const loading = ref(false);
const saving = ref(false);
const tree = ref<RegionItem[]>([]);
const keyword = ref('');
const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const editingRegion = ref<RegionItem | null>(null);
const parentRegion = ref<RegionItem | null>(null);
const form = reactive({
  code: '',
  name: '',
  level: 1,
  parentId: undefined as number | undefined,
  sort: 0,
  status: 1,
});
const rules: FormRules = {
  code: [
    { required: true, message: '请输入行政区划 code', trigger: 'blur' },
    {
      pattern: /^\d{2,9}$/,
      message: 'code 必须为 2-9 位数字',
      trigger: 'blur',
    },
  ],
  name: [{ required: true, message: '请输入地区名称', trigger: 'blur' }],
};
const parentLabel = computed(() =>
  parentRegion.value
    ? `${parentRegion.value.name}（${parentRegion.value.code}）`
    : '',
);

function levelName(level: number) {
  return ['', '省份', '城市', '区县'][level] ?? '未知';
}

function isRegionItem(value: unknown): value is RegionItem {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'number' &&
    typeof row.code === 'string' &&
    typeof row.name === 'string' &&
    typeof row.level === 'number' &&
    typeof row.sort === 'number' &&
    (row.parentId === null || typeof row.parentId === 'number')
  );
}

function openCreateChild(row: unknown) {
  if (isRegionItem(row)) openCreate(row.level + 1, row);
}

function editTableRow(row: unknown) {
  if (isRegionItem(row)) openEdit(row);
}

function toggleTableRowStatus(row: unknown) {
  if (isRegionItem(row)) toggleStatus(row);
}

function filterTree(nodes: RegionItem[], text: string): RegionItem[] {
  return nodes.reduce<RegionItem[]>((result, node) => {
    const children = filterTree(node.children ?? [], text);
    if (
      !text ||
      node.name.includes(text) ||
      node.code.includes(text) ||
      children.length
    ) {
      result.push({ ...node, children });
    }
    return result;
  }, []);
}

const filteredRegions = computed(() =>
  filterTree(tree.value, keyword.value.trim()),
);

async function loadRegions() {
  loading.value = true;
  try {
    tree.value = await getAdminRegionTree();
  } catch {
    // Errors are reported by the request interceptor.
  } finally {
    loading.value = false;
  }
}

function openCreate(level: number, parent?: RegionItem) {
  editingRegion.value = null;
  parentRegion.value = parent ?? null;
  Object.assign(form, {
    code: '',
    name: '',
    level,
    parentId: parent?.id,
    sort: 0,
    status: 1,
  });
  dialogVisible.value = true;
}

function openEdit(region: RegionItem) {
  editingRegion.value = region;
  parentRegion.value = null;
  Object.assign(form, {
    code: region.code,
    name: region.name,
    level: region.level,
    parentId: region.parentId ?? undefined,
    sort: region.sort,
    status: region.status ?? 1,
  });
  dialogVisible.value = true;
}

function resetForm() {
  formRef.value?.resetFields();
  editingRegion.value = null;
  parentRegion.value = null;
}

async function submitForm() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  saving.value = true;
  try {
    if (editingRegion.value) {
      await updateRegion(editingRegion.value.id, {
        code: form.code,
        name: form.name,
        sort: form.sort,
        status: form.status,
      });
      ElMessage.success('行政区已更新');
    } else {
      await createRegion({
        code: form.code,
        name: form.name,
        level: form.level,
        parentId: form.parentId,
        sort: form.sort,
      });
      ElMessage.success('行政区已新增');
    }
    dialogVisible.value = false;
    await loadRegions();
  } catch {
    // Errors are reported by the request interceptor.
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(region: RegionItem) {
  try {
    await updateRegion(region.id, { status: region.status === 1 ? 0 : 1 });
    ElMessage.success(region.status === 1 ? '行政区已停用' : '行政区已启用');
    await loadRegions();
  } catch {
    // Errors are reported by the request interceptor.
  }
}

onMounted(() => {
  if (!isSuperAdmin.value) {
    router.replace('/dashboard');
    return;
  }
  loadRegions();
});
</script>

<style scoped>
.page-head,
.page-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.page-head {
  margin-bottom: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.page-sub {
  margin-top: 6px;
  color: #909399;
  font-size: 13px;
}

.region-tip {
  margin-bottom: 16px;
}
</style>
