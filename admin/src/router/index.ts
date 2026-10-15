import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useUserStore } from '@/store/user';

const Layout = () => import('@/layout/index.vue');

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '仪表盘', icon: 'Odometer' },
      },
    ],
  },
  {
    path: '/user',
    component: Layout,
    meta: { title: '用户管理', icon: 'User', roles: ['super_admin', 'operator', 'auditor'] },
    children: [
      {
        path: 'list',
        name: 'UserList',
        component: () => import('@/views/user/list.vue'),
        meta: { title: 'C端用户' },
      },
    ],
  },
  {
    path: '/rbac',
    component: Layout,
    meta: { title: '权限管理', icon: 'Lock', roles: ['super_admin'] },
    children: [
      {
        path: 'admin',
        name: 'RbacAdmin',
        component: () => import('@/views/rbac/admin-list.vue'),
        meta: { title: '管理员' },
      },
      {
        path: 'role',
        name: 'RbacRole',
        component: () => import('@/views/rbac/role-list.vue'),
        meta: { title: '角色' },
      },
      {
        path: 'permission',
        name: 'RbacPermission',
        component: () => import('@/views/rbac/permission-list.vue'),
        meta: { title: '权限' },
      },
    ],
  },
  {
    path: '/winter',
    component: Layout,
    meta: { title: '冬泳管理', icon: 'Flag', roles: ['super_admin', 'swimming_admin', 'swimming_sub_admin'] },
    children: [
      {
        path: 'association',
        name: 'WinterAssociation',
        component: () => import('@/views/association/list.vue'),
        meta: { title: '冬泳协会管理' },
      },
      {
        path: 'members',
        name: 'WinterAssociationMembers',
        component: () => import('@/views/association/members.vue'),
        meta: { title: '会员管理', hidden: true },
      },
      {
        path: 'competition',
        name: 'WinterCompetition',
        component: () => import('@/views/competition/list.vue'),
        meta: { title: '赛事管理', roles: ['super_admin', 'swimming_admin', 'swimming_sub_admin'] },
      },
      {
        path: 'activity',
        name: 'WinterActivity',
        component: () => import('@/views/activity/list.vue'),
        meta: { title: '活动管理', roles: ['super_admin', 'swimming_admin', 'swimming_sub_admin'] },
      },
      {
        path: 'result',
        name: 'WinterResult',
        component: () => import('@/views/result/index.vue'),
        meta: { title: '成绩管理', roles: ['super_admin', 'swimming_admin', 'swimming_sub_admin'] },
      },
      {
        path: 'announcement',
        name: 'NotificationAnnouncement',
        component: () => import('@/views/notification/announcement.vue'),
        meta: { title: '通知公告', roles: ['super_admin', 'swimming_admin', 'swimming_sub_admin'] },
      },
    ],
  },
  {
    path: '/venue',
    component: Layout,
    meta: { title: '场馆管理', icon: 'House', roles: ['super_admin', 'operator', 'auditor'] },
    children: [
      {
        path: 'list',
        name: 'VenueList',
        component: () => import('@/views/venue/list.vue'),
        meta: { title: '场馆' },
      },
    ],
  },
  {
    path: '/coach',
    component: Layout,
    meta: { title: '教练管理', icon: 'Avatar', roles: ['super_admin', 'operator', 'auditor'] },
    children: [
      {
        path: 'list',
        name: 'CoachList',
        component: () => import('@/views/coach/list.vue'),
        meta: { title: '教练' },
      },
      {
        path: 'appointment',
        name: 'CoachAppointment',
        component: () => import('@/views/coach/appointment.vue'),
        meta: { title: '预约单' },
      },
    ],
  },
  {
    path: '/event',
    component: Layout,
    meta: { title: '赛事管理', icon: 'Trophy', roles: ['super_admin', 'operator', 'auditor'] },
    children: [
      {
        path: 'list',
        name: 'EventList',
        component: () => import('@/views/event/list.vue'),
        meta: { title: '赛事' },
      },
      {
        path: 'registration',
        name: 'EventRegistration',
        component: () => import('@/views/event/registration.vue'),
        meta: { title: '报名管理' },
      },
      {
        path: 'source',
        name: 'EventSource',
        component: () => import('@/views/event/source.vue'),
        meta: { title: '抓取源' },
      },
      {
        path: 'crawl-log',
        name: 'CrawlLog',
        component: () => import('@/views/event/crawl-log.vue'),
        meta: { title: '抓取日志' },
      },
    ],
  },
  {
    path: '/circle',
    component: Layout,
    meta: { title: '游泳圈子', icon: 'ChatDotRound', roles: ['super_admin', 'operator', 'auditor'] },
    children: [
      {
        path: 'post',
        name: 'CirclePost',
        component: () => import('@/views/circle/post.vue'),
        meta: { title: '帖子管理' },
      },
      {
        path: 'comment',
        name: 'CircleComment',
        component: () => import('@/views/circle/comment.vue'),
        meta: { title: '评论管理' },
      },
      {
        path: 'report',
        name: 'CircleReport',
        component: () => import('@/views/circle/report.vue'),
        meta: { title: '举报处理' },
      },
    ],
  },
  {
    path: '/notification',
    component: Layout,
    meta: { title: '消息通知', icon: 'Bell', roles: ['super_admin', 'operator'] },
    children: [
      {
        path: 'template',
        name: 'NotificationTemplate',
        component: () => import('@/views/notification/template.vue'),
        meta: { title: '模板管理' },
      },
      {
        path: 'log',
        name: 'NotificationLog',
        component: () => import('@/views/notification/log.vue'),
        meta: { title: '发送日志' },
      },
    ],
  },
  {
    path: '/system',
    component: Layout,
    meta: { title: '系统设置', icon: 'Setting', roles: ['super_admin', 'operator'] },
    children: [
      {
        path: 'access',
        name: 'SystemAccess',
        component: () => import('@/views/system/access.vue'),
        meta: { title: '访问统计' },
      },
      {
        path: 'banner',
        name: 'SystemBanner',
        component: () => import('@/views/system/banner.vue'),
        meta: { title: 'Banner' },
      },
      {
        path: 'feedback',
        name: 'SystemFeedback',
        component: () => import('@/views/system/feedback.vue'),
        meta: { title: '用户反馈' },
      },
      {
        path: 'config',
        name: 'SystemConfig',
        component: () => import('@/views/system/config.vue'),
        meta: { title: '系统配置' },
      },
      {
        path: 'operation-log',
        name: 'SystemOperationLog',
        component: () => import('@/views/system/operation-log.vue'),
        meta: { title: '操作日志' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404', public: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

// 全局守卫
router.beforeEach((to, _from, next) => {
  // 设置标题
  document.title = to.meta.title
    ? `${to.meta.title} - 游泳生态圈管理后台`
    : '游泳生态圈管理后台';

  const userStore = useUserStore();
  if (to.meta.public) {
    return next();
  }
  if (!userStore.token) {
    return next(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }
  next();
});

export default router;
