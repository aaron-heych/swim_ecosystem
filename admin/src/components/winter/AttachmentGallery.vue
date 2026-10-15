<template>
  <div class="attach-panel">
    <div class="attach-panel-header">
      <div class="attach-panel-title">
        <div class="attach-icon-box">
          <el-icon :size="18"><FolderOpened /></el-icon>
        </div>
        <div>
          <div class="attach-title-main">{{ title }}</div>
          <div v-if="!hideHeaderDetails" class="attach-title-sub">{{ subtitle }}</div>
        </div>
      </div>
      <div class="attach-panel-actions">
        <el-tag v-if="!hideHeaderDetails" size="small" effect="plain" round class="attach-count">
          {{ attachments.length }} / {{ maxCount }}
        </el-tag>
        <el-button
          v-if="!readonly"
          type="primary"
          round
          :icon="Upload"
          :disabled="!competitionId"
          @click="openUploadDialog"
        >
          上传比赛附件
        </el-button>
      </div>
    </div>

    <div v-if="attachments.length" class="attach-grid">
      <div
        v-for="(row, i) in attachments"
        :key="row.url"
        class="attach-card"
        :class="{ dragging: dragIndex === i, 'drag-over': dragOverIndex === i && dragIndex !== i }"
        :draggable="!readonly"
        :title="readonly ? '' : '拖拽可调整顺序'"
        @dragstart="onDragStart(i)"
        @dragover.prevent="onDragOver(i)"
        @drop.prevent="onDrop(i)"
        @dragend="onDragEnd"
      >
        <div class="attach-card-preview">
          <el-image
            v-if="isImage(row.url)"
            :src="row.url"
            :preview-src-list="imagePreviewList"
            :initial-index="imagePreviewList.indexOf(row.url)"
            fit="cover"
            preview-teleported
            class="attach-card-img"
          />
          <div
            v-else
            class="attach-card-pack"
            :class="{ sevenz: attachType(row) === '7Z' }"
            @click="openFile(row)"
          >
            <span class="pack-ext">{{ attachType(row) }}</span>
            <span class="pack-label">压缩包，点击下载</span>
          </div>
          <div class="attach-card-mask">
            <el-icon class="mask-icon" title="查看" @click.stop="openFile(row)">
              <View />
            </el-icon>
            <el-icon class="mask-icon" title="下载" @click.stop="downloadAttachment(row)">
              <Download />
            </el-icon>
            <el-icon
              v-if="!readonly"
              class="mask-icon"
              title="编辑"
              @click.stop="openEditAttachment(row, i)"
            >
              <EditPen />
            </el-icon>
            <el-icon
              v-if="!readonly"
              class="mask-icon danger"
              title="删除"
              @click.stop="removeAttachment(i)"
            >
              <Delete />
            </el-icon>
          </div>
        </div>
        <div class="attach-card-body">
          <div class="attach-card-name" :title="row.name">{{ row.name }}</div>
          <div class="attach-card-meta">
            <el-tag
              size="small"
              effect="light"
              :type="attachType(row) === '图片' ? 'success' : 'warning'"
            >
              {{ attachType(row) }}
            </el-tag>
            <span class="attach-card-size">{{ formatSize(row.size) }}</span>
          </div>
          <div v-if="row.remark" class="attach-card-remark" :title="row.remark">
            {{ row.remark }}
          </div>
        </div>
      </div>
      <div
        v-if="!readonly && attachments.length < maxCount"
        class="attach-card attach-add"
        @click="openUploadDialog"
      >
        <el-icon :size="22"><Plus /></el-icon>
        <span>继续上传</span>
      </div>
    </div>

    <div v-else class="attach-empty" :class="{ readonly }" @click="openUploadDialog">
      <div v-if="!readonly" class="attach-empty-icon">
        <el-icon :size="24"><Upload /></el-icon>
      </div>
      <div class="attach-empty-title">暂无{{ title }}</div>
      <div v-if="!readonly" class="attach-empty-sub">
        点击上传{{ imageOnly ? '照片' : '照片或 zip/7z 打包文件' }}，单个 ≤{{ maxFileSizeLabel }}
      </div>
    </div>

    <!-- 批量上传对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      :title="`上传${title}`"
      width="600px"
      @closed="pendingFiles = []"
    >
      <el-alert type="info" :closable="false" class="mb-12">
        <template #title>
          单个文件最大 {{ maxFileSizeLabel }}；支持 {{ imageOnly ? 'jpg / jpeg / png / webp / gif / bmp' : 'jpg / jpeg / png / webp / gif / bmp / zip / 7z' }}；最多
          {{ maxCount }} 个附件{{ imageOnly ? '' : '，超出请打包上传' }}
        </template>
      </el-alert>
      <el-upload
        drag
        multiple
        :show-file-list="false"
        :auto-upload="false"
        :accept="acceptAttr"
        :on-change="onPickFiles"
        class="upload-dragger"
      >
        <div class="upload-dragger-inner">
          <el-icon :size="36" color="#909399"><Upload /></el-icon>
          <div class="upload-dragger-title">拖拽文件到这里，或点击选择（可多选）</div>
          <div class="upload-dragger-tip">
            {{ imageOnly ? '仅支持图片' : '图片或 zip / 7z 压缩包' }}，单个 ≤{{ maxFileSizeLabel }}
          </div>
        </div>
      </el-upload>

      <el-table v-if="pendingFiles.length" :data="pendingFiles" size="small" class="mt-12">
        <el-table-column label="文件名称（可自定义）" min-width="220">
          <template #default="{ row }">
            <el-input v-model="row.customName" size="small" placeholder="文件名称" />
          </template>
        </el-table-column>
        <el-table-column label="类型" width="80" align="center">
          <template #default="{ row }">{{ fileKindLabel(row.file.name) }}</template>
        </el-table-column>
        <el-table-column label="大小" width="90" align="center">
          <template #default="{ row }">{{ formatSize(row.file.size) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="60" align="center">
          <template #default="{ $index }">
            <el-button link type="danger" size="small" @click="pendingFiles.splice($index, 1)">
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="uploading"
          :disabled="!pendingFiles.length || !competitionId"
          @click="submitBatchUpload"
        >
          开始上传{{ pendingFiles.length ? `（${pendingFiles.length} 个文件）` : '' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 附件编辑对话框 -->
    <el-dialog v-model="attachEditVisible" title="编辑附件" width="440px">
      <el-form label-width="80px">
        <el-form-item label="文件名称">
          <el-input v-model="attachEditForm.name" placeholder="附件显示名称" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input
            v-model="attachEditForm.remark"
            type="textarea"
            :rows="2"
            placeholder="附件说明（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="attachEditVisible = false">取消</el-button>
        <el-button type="primary" :loading="attachEditSaving" @click="saveAttachmentEdit">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Upload, FolderOpened, EditPen, Delete, View, Plus, Download } from '@element-plus/icons-vue';
import {
  uploadResultAttachment,
  getResultAttachments,
  saveResultAttachments,
  getGalleryAttachments,
  saveGalleryAttachments,
} from '@/api/competition';

/** 可复用的赛事附件画廊：kind=result 成绩单（图片+压缩包）/ kind=gallery 花絮照片（仅图片） */
const props = withDefaults(
  defineProps<{
    competitionId: number;
    kind: 'result' | 'gallery';
    title: string;
    subtitle: string;
    imageOnly?: boolean;
    hideHeaderDetails?: boolean;
    /** 只读预览（会长角色）：不可上传/编辑/删除/拖拽排序 */
    readonly?: boolean;
  }>(),
  { imageOnly: false, hideHeaderDetails: false, readonly: false },
);

const imageOnly = computed(() => props.imageOnly);

/** 上限按区域区分：花絮照片（imageOnly）50 个 / 单张 2MB；成绩单 20 个 / 单个 10MB */
const maxCount = computed(() => (imageOnly.value ? 50 : 20));
const maxFileSize = computed(() => (imageOnly.value ? 2 : 10) * 1024 * 1024);
const maxFileSizeLabel = computed(() => (imageOnly.value ? '2MB' : '10MB'));
const acceptAttr = computed(() =>
  imageOnly.value ? '.jpg,.jpeg,.png,.webp,.gif,.bmp' : '.jpg,.jpeg,.png,.webp,.gif,.bmp,.zip,.7z',
);
const extReg = computed(() =>
  imageOnly.value ? /\.(jpe?g|png|webp|gif|bmp)$/i : /\.(jpe?g|png|webp|gif|bmp|zip|7z)$/i,
);

interface Attachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
  remark?: string;
}

const attachments = ref<Attachment[]>([]);

const api = computed(() =>
  props.kind === 'gallery'
    ? { get: getGalleryAttachments, save: saveGalleryAttachments }
    : { get: getResultAttachments, save: saveResultAttachments },
);

async function load() {
  if (!props.competitionId) return;
  const res: any = await api.value.get(props.competitionId);
  attachments.value = Array.isArray(res) ? res : [];
}

watch(() => props.competitionId, load, { immediate: true });

const imagePreviewList = computed(() =>
  attachments.value.filter((a) => isImage(a.url)).map((a) => a.url),
);

function isImage(url: string) {
  return /\.(jpe?g|png|webp|gif|bmp)$/i.test(url || '');
}

function attachType(a: Attachment) {
  if (isImage(a.url)) return '图片';
  if (/\.7z$/i.test(a.url)) return '7Z';
  return 'ZIP';
}

function fileKindLabel(name: string) {
  if (/\.(jpe?g|png|webp|gif|bmp)$/i.test(name)) return '图片';
  if (/\.7z$/i.test(name)) return '7Z';
  return 'ZIP';
}

function formatSize(size?: number) {
  if (size === undefined || size === null) return '-';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function openFile(a: Attachment) {
  window.open(a.url, '_blank');
}

/** 下载附件（同源触发浏览器下载，按自定义文件名保存） */
function downloadAttachment(a: Attachment) {
  const el = document.createElement('a');
  el.href = a.url;
  el.download = a.name || '附件';
  el.target = '_blank';
  document.body.appendChild(el);
  el.click();
  el.remove();
}

/* ---- 批量上传 ---- */
const uploadDialogVisible = ref(false);
const uploading = ref(false);
const pendingFiles = ref<{ file: File; customName: string }[]>([]);

function openUploadDialog() {
  if (props.readonly || !props.competitionId) return;
  if (attachments.value.length >= maxCount.value) {
    ElMessage.warning(
      `附件最多 ${maxCount.value} 个${imageOnly.value ? '' : '，超出请打包为 zip/7z 上传'}`,
    );
    return;
  }
  uploadDialogVisible.value = true;
}

function onPickFiles(uploadFile: any) {
  const file: File = uploadFile.raw;
  if (!file) return;
  if (!extReg.value.test(file.name)) {
    ElMessage.warning(
      `「${file.name}」类型不支持，仅支持 ${imageOnly.value ? 'jpg/png/webp/gif/bmp 图片' : '图片或 zip/7z 文件'}`,
    );
    return;
  }
  if (file.size > maxFileSize.value) {
    ElMessage.warning(`「${file.name}」超过 ${maxFileSizeLabel.value} 限制`);
    return;
  }
  if (attachments.value.length + pendingFiles.value.length >= maxCount.value) {
    ElMessage.warning(
      `附件最多 ${maxCount.value} 个${imageOnly.value ? '' : '，超出请打包为 zip/7z 上传'}`,
    );
    return;
  }
  if (pendingFiles.value.some((p) => p.file.name === file.name && p.file.size === file.size)) {
    return;
  }
  pendingFiles.value.push({ file, customName: file.name });
}

async function submitBatchUpload() {
  if (!pendingFiles.value.length) return;
  uploading.value = true;
  try {
    const uploaded: Attachment[] = [];
    for (const p of pendingFiles.value) {
      const res: any = await uploadResultAttachment(p.file);
      uploaded.push({
        name: p.customName || p.file.name,
        url: res.url,
        size: res.size,
        type: fileKindLabel(p.file.name),
        remark: '',
      });
    }
    const next = [...attachments.value, ...uploaded];
    await api.value.save(props.competitionId, next);
    attachments.value = next;
    ElMessage.success(`已上传 ${uploaded.length} 个附件`);
    uploadDialogVisible.value = false;
    pendingFiles.value = [];
  } finally {
    uploading.value = false;
  }
}

/* ---- 附件编辑 / 删除 ---- */
const attachEditVisible = ref(false);
const attachEditSaving = ref(false);
const attachEditIndex = ref(-1);
const attachEditForm = ref({ name: '', remark: '' });

function openEditAttachment(row: Attachment, index: number) {
  attachEditIndex.value = index;
  attachEditForm.value = { name: row.name, remark: row.remark || '' };
  attachEditVisible.value = true;
}

async function saveAttachmentEdit() {
  if (!attachEditForm.value.name.trim()) {
    ElMessage.warning('请填写文件名称');
    return;
  }
  attachEditSaving.value = true;
  try {
    const next = [...attachments.value];
    next[attachEditIndex.value] = {
      ...next[attachEditIndex.value],
      name: attachEditForm.value.name.trim(),
      remark: attachEditForm.value.remark.trim(),
    };
    await api.value.save(props.competitionId, next);
    attachments.value = next;
    ElMessage.success('已保存');
    attachEditVisible.value = false;
  } finally {
    attachEditSaving.value = false;
  }
}

async function removeAttachment(index: number) {
  await ElMessageBox.confirm(`确定删除附件「${attachments.value[index].name}」？`, '提示', {
    type: 'warning',
  });
  const next = attachments.value.filter((_, i) => i !== index);
  await api.value.save(props.competitionId, next);
  attachments.value = next;
  ElMessage.success('已删除');
}

/* ---- 卡片拖拽排序（HTML5 DnD，落下即保存顺序） ---- */
const dragIndex = ref(-1);
const dragOverIndex = ref(-1);

function onDragStart(i: number) {
  if (props.readonly) return;
  dragIndex.value = i;
}

function onDragOver(i: number) {
  dragOverIndex.value = i;
}

async function onDrop(target: number) {
  const from = dragIndex.value;
  if (from < 0 || from === target) return;
  const next = [...attachments.value];
  const [moved] = next.splice(from, 1);
  next.splice(target, 0, moved);
  attachments.value = next;
  try {
    await api.value.save(props.competitionId, next);
    ElMessage.success('顺序已保存');
  } catch {
    await load();
  }
}

function onDragEnd() {
  dragIndex.value = -1;
  dragOverIndex.value = -1;
}
</script>

<style scoped>
.attach-panel {
  border-radius: 12px;
  background: #fff;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.04);
  padding: 16px 18px;
}
.attach-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.attach-panel-title {
  display: flex;
  align-items: center;
  gap: 12px;
}
.attach-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(64, 158, 255, 0.3);
}
.attach-title-main {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}
.attach-title-sub {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}
.attach-panel-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
/* ---- 卡片画廊 ---- */
.attach-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 14px;
}
.attach-card {
  border: 1px solid #ebeef5;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  transition: all 0.25s;
  cursor: grab;
}
.attach-card.dragging {
  opacity: 0.5;
  cursor: grabbing;
  transform: scale(0.97);
}
.attach-card.drag-over {
  border: 1px dashed #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.15);
}
.attach-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  border-color: #d9ecff;
}
.attach-card-preview {
  position: relative;
  height: 120px;
  background: #f5f7fa;
}
.attach-card-img {
  width: 100%;
  height: 120px;
  display: block;
}
.attach-card-pack {
  width: 100%;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
  color: #e6a23c;
}
.attach-card-pack.sevenz {
  background: linear-gradient(135deg, #f4f4f5 0%, #e9e9eb 100%);
  color: #909399;
}
.pack-ext {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 2px;
}
.pack-label {
  font-size: 12px;
  opacity: 0.85;
}
.attach-card-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}
.attach-card:hover .attach-card-mask {
  opacity: 1;
}
.mask-icon {
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  pointer-events: auto;
  padding: 6px;
  border-radius: 50%;
  transition: background 0.2s;
}
.mask-icon:hover {
  background: rgba(255, 255, 255, 0.25);
}
.mask-icon.danger:hover {
  background: rgba(245, 108, 108, 0.7);
}
.attach-card-body {
  padding: 10px 12px 12px;
}
.attach-card-name {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.attach-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.attach-card-size {
  font-size: 12px;
  color: #909399;
}
.attach-card-remark {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.attach-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 120px;
  border-style: dashed;
  color: #909399;
  cursor: pointer;
  background: #fafafa;
}
.attach-add:hover {
  color: #409eff;
  border-color: #409eff;
  background: #f5faff;
}
.attach-empty {
  border: 1px dashed #c0c4cc;
  border-radius: 10px;
  padding: 34px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafbfd;
}
.attach-empty.readonly {
  cursor: default;
}
.attach-empty.readonly:hover {
  border-color: #c0c4cc;
  background: #fafbfd;
}
.attach-empty:hover {
  border-color: #409eff;
  background: #f5faff;
}
.attach-empty-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto;
  border-radius: 50%;
  background: #ecf5ff;
  color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.attach-empty-title {
  margin-top: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
}
.attach-empty-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}
.mb-12 {
  margin-bottom: 12px;
}
.mt-12 {
  margin-top: 12px;
}
.upload-dragger-inner {
  padding: 20px 0;
}
.upload-dragger-title {
  font-size: 14px;
  color: #606266;
}
.upload-dragger-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
}
</style>
