// 状态字典：value → { label, type }
// type 取值参考 Element Plus Tag：primary / success / warning / danger / info

export interface DictItem {
  label: string;
  type: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

/** 通用审核状态：0待审核 1通过 2驳回 */
export const AUDIT_STATUS: Record<number, DictItem> = {
  0: { label: '待审核', type: 'warning' },
  1: { label: '审核通过', type: 'success' },
  2: { label: '审核驳回', type: 'danger' },
};

/** 通用启用状态：0禁用 1启用 */
export const ENABLE_STATUS: Record<number, DictItem> = {
  0: { label: '禁用', type: 'danger' },
  1: { label: '启用', type: 'success' },
};

export const USER_STATUS: Record<number, DictItem> = {
  ...ENABLE_STATUS,
  2: { label: '已删除', type: 'info' },
};

/** 上下架状态：0下架 1上架 */
export const SHELF_STATUS: Record<number, DictItem> = {
  0: { label: '下架', type: 'info' },
  1: { label: '上架', type: 'success' },
};

/** 协会会员角色：1会长 2管理员 3普通 */
export const MEMBER_ROLE: Record<number, DictItem> = {
  1: { label: '会长', type: 'danger' },
  2: { label: '管理员', type: 'warning' },
  3: { label: '普通会员', type: 'info' },
};

/** 协会会员状态：0待审核 1正常 2拒绝 3退出 4移除 */
export const MEMBER_STATUS: Record<number, DictItem> = {
  0: { label: '待审核', type: 'warning' },
  1: { label: '正常', type: 'success' },
  2: { label: '已拒绝', type: 'danger' },
  3: { label: '已退出', type: 'info' },
  4: { label: '已移除', type: 'danger' },
};

/** 保险状态：null/0 未投保 1 已投保 */
export const INSURANCE_STATUS: Record<number, DictItem> = {
  0: { label: '未投保', type: 'info' },
  1: { label: '已投保', type: 'success' },
};

/** 协会业务状态：0已解散 1活跃中 */
export const ASSOC_STATUS: Record<number, DictItem> = {
  0: { label: '已解散', type: 'danger' },
  1: { label: '活跃中', type: 'success' },
};

/** 冬泳赛事类型：1竞速赛 2畅游赛 3邀请赛 */
export const COMPETITION_TYPE: Record<number, DictItem> = {
  1: { label: '竞速赛', type: 'primary' },
  2: { label: '畅游赛', type: 'success' },
  3: { label: '邀请赛', type: 'warning' },
};

/** 冬泳赛事级别：1国际 2全国 3省级 4市级 5协会级 */
export const COMPETITION_LEVEL: Record<number, DictItem> = {
  1: { label: '国际', type: 'danger' },
  2: { label: '全国', type: 'warning' },
  3: { label: '省级', type: 'primary' },
  4: { label: '市级', type: 'success' },
  5: { label: '协会级', type: 'info' },
};

/** 冬泳赛事状态：0草稿 1报名中 2比赛中 3已结束 4已取消 */
export const COMPETITION_STATUS: Record<number, DictItem> = {
  0: { label: '草稿', type: 'info' },
  1: { label: '报名中', type: 'success' },
  2: { label: '比赛中', type: 'warning' },
  3: { label: '已结束', type: 'info' },
  4: { label: '已取消', type: 'danger' },
};

/** 冬泳活动类型：1畅游活动 2冬泳体验 3公益宣传 4交流活动 */
export const ACTIVITY_TYPE: Record<number, DictItem> = {
  1: { label: '畅游活动', type: 'primary' },
  2: { label: '冬泳体验', type: 'success' },
  3: { label: '公益宣传', type: 'warning' },
  4: { label: '交流活动', type: 'info' },
};

/** 冬泳活动状态：0草稿 1已发布 2进行中 3已结束 4已取消 */
export const ACTIVITY_STATUS: Record<number, DictItem> = {
  0: { label: '草稿', type: 'info' },
  1: { label: '已发布', type: 'success' },
  2: { label: '进行中', type: 'warning' },
  3: { label: '已结束', type: 'info' },
  4: { label: '已取消', type: 'danger' },
};

/** 预约状态：0待确认 1已确认 2已完成 3已取消 4爽约 */
export const APPOINTMENT_STATUS: Record<number, DictItem> = {
  0: { label: '待确认', type: 'warning' },
  1: { label: '已确认', type: 'primary' },
  2: { label: '已完成', type: 'success' },
  3: { label: '已取消', type: 'info' },
  4: { label: '爽约', type: 'danger' },
};

/** 支付状态：0未支付 1已支付 2已退款 */
export const PAY_STATUS: Record<number, DictItem> = {
  0: { label: '未支付', type: 'danger' },
  1: { label: '已支付', type: 'success' },
  2: { label: '已退款', type: 'info' },
};

/** 帖子状态：0待审核 1已发布 2隐藏 3驳回 */
export const POST_STATUS: Record<number, DictItem> = {
  0: { label: '待审核', type: 'warning' },
  1: { label: '已发布', type: 'success' },
  2: { label: '隐藏', type: 'info' },
  3: { label: '已驳回', type: 'danger' },
};

/** 举报状态：0待处理 1已处理-违规 2已处理-忽略 */
export const REPORT_STATUS: Record<number, DictItem> = {
  0: { label: '待处理', type: 'warning' },
  1: { label: '已处理-违规', type: 'danger' },
  2: { label: '已处理-忽略', type: 'info' },
};

/** 反馈状态：0待回复 1已回复 */
export const FEEDBACK_STATUS: Record<number, DictItem> = {
  0: { label: '待回复', type: 'warning' },
  1: { label: '已回复', type: 'success' },
};

/** 抓取源状态：0禁用 1启用 */
export const SOURCE_STATUS: Record<number, DictItem> = {
  0: { label: '禁用', type: 'danger' },
  1: { label: '启用', type: 'success' },
};

/** 抓取任务结果：0失败 1成功 2进行中 */
export const CRAWL_RESULT: Record<number, DictItem> = {
  0: { label: '失败', type: 'danger' },
  1: { label: '成功', type: 'success' },
  2: { label: '进行中', type: 'warning' },
};

/** 性别：0未知 1男 2女 */
export const GENDER: Record<number, DictItem> = {
  0: { label: '未知', type: 'info' },
  1: { label: '男', type: 'primary' },
  2: { label: '女', type: 'warning' },
};

/** 参与协会状态：0待确认 1已确认 2已取消 */
export const PARTICIPATION_STATUS: Record<number, DictItem> = {
  0: { label: '待确认', type: 'warning' },
  1: { label: '已确认', type: 'success' },
  2: { label: '已取消', type: 'info' },
};

/** 参与人员状态：0已取消 1有效 */
export const PARTICIPANT_STATUS: Record<number, DictItem> = {
  0: { label: '已取消', type: 'info' },
  1: { label: '有效', type: 'success' },
};

export function getDict(d: Record<number, DictItem>, v: any): DictItem {
  return d[v] ?? { label: String(v ?? '-'), type: 'info' };
}
