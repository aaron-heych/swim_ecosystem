<template>
  <div class="password-page">
    <el-card class="password-card" shadow="never">
      <h2>{{ userStore.userInfo.needChangePassword ? '首次登录，请修改密码' : '修改密码' }}</h2>
      <el-alert
        v-if="userStore.userInfo.needChangePassword"
        title="为保障账号安全，请先修改初始密码后再使用管理后台。"
        type="warning"
        :closable="false"
        show-icon
        class="password-alert"
      />
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="110px"
        @submit.prevent="submit"
      >
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input
            v-model="form.currentPassword"
            type="password"
            show-password
            autocomplete="current-password"
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="form.newPassword"
            type="password"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            show-password
            autocomplete="new-password"
            @keyup.enter="submit"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="submit">
            确认修改
          </el-button>
          <el-button v-if="!userStore.userInfo.needChangePassword" @click="router.back()">
            取消
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { changeAdminPassword } from '@/api/user';
import { useUserStore } from '@/store/user';

const router = useRouter();
const userStore = useUserStore();
const formRef = ref<FormInstance>();
const submitting = ref(false);
const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const rules: FormRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 64, message: '新密码长度必须为 8-64 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== form.newPassword) {
          callback(new Error('两次输入的新密码不一致'));
          return;
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
};

async function submit() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    const result: any = await changeAdminPassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
    userStore.setAuth(result.token, {
      ...userStore.userInfo,
      needChangePassword: result.admin?.needChangePassword ?? false,
    });
    ElMessage.success('密码修改成功');
    await router.replace('/dashboard');
  } catch {
    // Errors are reported by the request interceptor.
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.password-page {
  display: flex;
  justify-content: center;
  padding: 32px 16px;
}

.password-card {
  width: min(100%, 620px);
  height: fit-content;
}

h2 {
  margin: 0 0 24px;
  color: #303133;
  font-size: 20px;
}

.password-alert {
  margin-bottom: 24px;
}
</style>
