<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-left">
        <div class="welcome">
          <div class="logo">🏊 游泳生态圈</div>
          <h1>管理后台</h1>
          <p>场馆 · 教练 · 赛事 · 协会 · 圈子</p>
          <p>一站式运营管理平台</p>
        </div>
      </div>
      <div class="login-right">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          size="large"
          @submit.prevent="onSubmit"
        >
          <h2 class="form-title">账号登录</h2>
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              :prefix-icon="User"
              clearable
            />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              show-password
              @keyup.enter="onSubmit"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              class="submit-btn"
              :loading="loading"
              @click="onSubmit"
            >
              登 录
            </el-button>
          </el-form-item>
          <div class="tips">
            <p>测试账号：</p>
            <p>admin / admin123（超管）</p>
            <p>swimming_admin / swimming123（冬泳管理者，仅可见首页+协会管理）</p>
            <p>swimming_sub_admin / swimming123（协会会长，仅可见所属协会）</p>
            <p>operator / admin123（运营）</p>
            <p>auditor / admin123（审核）</p>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import { login } from '@/api/user';
import { useUserStore } from '@/store/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const formRef = ref<FormInstance>();
const loading = ref(false);
const form = reactive({ username: 'admin', password: 'admin123' });

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

async function onSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    loading.value = true;
    try {
      const res: any = await login(form);
      // 后端返回 { token, admin: {...} }
      const admin = res.admin || res.adminUser || {};
      userStore.setAuth(res.token, {
        id: admin.id,
        username: admin.username,
        realName: admin.realName,
        avatar: admin.avatarUrl || admin.avatar,
        roles: (admin.roleCodes || admin.roles || []).map(
          (role: string | { id?: number; name?: string; code?: string }, i: number) => {
            const code = typeof role === 'string' ? role : role.code || '';
            return {
              id: typeof role === 'string' ? i + 1 : role.id || i + 1,
              name: typeof role === 'string' ? role : role.name || code,
              code,
            };
          },
        ),
        roleCodes: (admin.roleCodes || []).map((role: string) => role),
        associationId: admin.associationId ?? null,
        needChangePassword: admin.needChangePassword ?? false,
      });
      ElMessage.success('登录成功');
      if (admin.needChangePassword) {
        router.replace('/account/change-password');
        return;
      }
      const redirect = (route.query.redirect as string) || '/dashboard';
      router.replace(redirect);
    } catch (e) {
      // 错误已在拦截器处理
    } finally {
      loading.value = false;
    }
  });
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
}
.login-box {
  display: flex;
  width: 880px;
  height: 520px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}
.login-left {
  flex: 1;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}
.welcome .logo {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 24px;
}
.welcome h1 {
  font-size: 32px;
  margin: 0 0 16px;
}
.welcome p {
  font-size: 14px;
  opacity: 0.85;
  margin: 6px 0;
}
.login-right {
  width: 380px;
  padding: 60px 40px;
  display: flex;
  align-items: center;
}
.form-title {
  text-align: center;
  margin: 0 0 24px;
  color: #303133;
}
.submit-btn {
  width: 100%;
}
.tips {
  margin-top: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  color: #909399;
  line-height: 1.8;
}
.tips p {
  margin: 0;
}
</style>
