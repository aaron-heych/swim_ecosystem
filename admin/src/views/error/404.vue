<template>
  <div class="not-found">
    <div class="content">
      <div class="code">404</div>
      <p class="desc">抱歉，您访问的页面不存在</p>
      <el-button type="primary" @click="$router.replace('/portal')">
        返回工作台
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}
.content {
  text-align: center;
}
.code {
  font-size: 120px;
  color: #409eff;
  font-weight: 700;
  line-height: 1;
}
.desc {
  font-size: 18px;
  color: #606266;
  margin: 16px 0 24px;
}
</style>
