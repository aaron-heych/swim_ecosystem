<template>
  <div class="page-container">
    <!-- 搜索 -->
    <el-form :inline="true" :model="query" class="search-form" @submit.prevent="onSearch">
      <el-form-item label="关键词">
        <el-input
          v-model="query.keyword"
          placeholder="Banner 标题"
          clearable
          style="width: 200px"
          @clear="onSearch"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="位置">
        <el-select
          v-model="query.position"
          placeholder="全部位置"
          clearable
          style="width: 140px"
          @change="onSearch"
        >
          <el-option
            v-for="item in POSITION_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="onSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 顶部操作 -->
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="openCreate">新增 Banner</el-button>
    </div>

    <!-- 表格 -->
    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column label="ID" prop="id" width="70" />
      <el-table-column label="标题" prop="title" min-width="160" show-overflow-tooltip />
      <el-table-column label="图片" width="120" align="center">
        <template #default="{ row }">
          <el-image
            v-if="row.image"
            :src="row.image"
            :preview-src-list="[row.image]"
            fit="cover"
            style="width: 80px; height: 45px; border-radius: 4px"
            preview-teleported
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="链接" prop="url" min-width="180" show-overflow-tooltip />
      <el-table-column label="位置" width="100" align="center">
        <template #default="{ row }">{{ getPosition(row.position) }}</template>
      </el-table-column>
      <el-table-column label="排序" prop="sort" width="80" align="center" />
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="getDict(ENABLE_STATUS, row.status).type">
            {{ getDict(ENABLE_STATUS, row.status).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="起止时间" width="320">
        <template #default="{ row }">
          <div class="time-range">
            <span>{{ formatTime(row.startTime) }}</span>
            <span class="sep">至</span>
            <span>{{ formatTime(row.endTime) }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
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

    <!-- 编辑/新增弹窗 -->
    <el-dialog
      v-model="formVisible"
      :title="formRow ? '编辑 Banner' : '新增 Banner'"
      width="560px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入 Banner 标题" />
        </el-form-item>
        <el-form-item label="图片地址" prop="image">
          <el-input v-model="form.image" placeholder="请输入图片 URL" />
        </el-form-item>
        <el-form-item label="链接" prop="url">
          <el-input v-model="form.url" placeholder="请输入跳转链接" />
        </el-form-item>
        <el-form-item label="位置" prop="position">
          <el-select v-model="form.position" placeholder="请选择位置" style="width: 100%">
            <el-option
              v-for="item in POSITION_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="form.startTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择开始时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
            v-model="form.endTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择结束时间"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="submitForm">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Search, Refresh, Plus } from '@element-plus/icons-vue';
import { getBannerList, createBanner, updateBanner, deleteBanner } from '@/api/system';
import { ENABLE_STATUS, getDict } from '@/utils/dict';

const POSITION_OPTIONS = [
  { value: 1, label: '首页' },
  { value: 2, label: '赛事' },
  { value: 3, label: '协会' },
];
function getPosition(p: number) {
  return POSITION_OPTIONS.find((i) => i.value === p)?.label || '-';
}

function formatTime(t?: string | number | Date) {
  if (!t) return '-';
  const d = new Date(t);
  if (isNaN(d.getTime())) return '-';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const loading = ref(false);
const list = ref<any[]>([]);
const total = ref(0);
const query = reactive({
  keyword: '',
  position: undefined as number | undefined,
  page: 1,
  pageSize: 10,
});

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getBannerList(query);
    list.value = res?.list || [];
    total.value = res?.total || 0;
  } catch (e) {
    // 拦截器已处理
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
  query.position = undefined;
  query.page = 1;
  loadData();
}

async function onDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除 Banner「${row.title}」吗？`, '删除确认', {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    await deleteBanner(row.id);
    ElMessage.success('删除成功');
    if (list.value.length === 1 && query.page > 1) query.page -= 1;
    loadData();
  } catch (e) {
    // 拦截器已处理
  }
}

/* 编辑/新增 */
const formVisible = ref(false);
const formLoading = ref(false);
const formRef = ref<FormInstance>();
const formRow = ref<any>(null);
const defaultForm = () => ({
  title: '',
  image: '',
  url: '',
  position: 1 as number,
  sort: 0 as number,
  status: 1 as number,
  startTime: '',
  endTime: '',
});
const form = reactive(defaultForm());
const formRules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  position: [{ required: true, message: '请选择位置', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
};

function openCreate() {
  formRow.value = null;
  Object.assign(form, defaultForm());
  formVisible.value = true;
}

function openEdit(row: any) {
  formRow.value = row;
  Object.assign(form, {
    title: row.title ?? '',
    image: row.image ?? '',
    url: row.url ?? '',
    position: row.position ?? 1,
    sort: row.sort ?? 0,
    status: row.status ?? 1,
    startTime: row.startTime ?? '',
    endTime: row.endTime ?? '',
  });
  formVisible.value = true;
}

function resetForm() {
  Object.assign(form, defaultForm());
  formRow.value = null;
  formRef.value?.clearValidate();
}

async function submitForm() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    formLoading.value = true;
    try {
      if (formRow.value) {
        await updateBanner(formRow.value.id, { ...form });
        ElMessage.success('更新成功');
      } else {
        await createBanner({ ...form });
        ElMessage.success('创建成功');
      }
      formVisible.value = false;
      loadData();
    } catch (e) {
      // 拦截器已处理
    } finally {
      formLoading.value = false;
    }
  });
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
.time-range {
  display: flex;
  flex-direction: column;
  line-height: 1.6;
  font-size: 12px;
}
.time-range .sep {
  color: #909399;
}
</style>
