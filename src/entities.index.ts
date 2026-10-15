/**
 * 实体统一出口 — 在 app.module.ts 中引用：
 *
 *   import { entities } from './entities.index';
 *
 *   TypeOrmModule.forRoot({
 *     ...,
 *     entities,
 *     namingStrategy: new SnakeNamingStrategy(),
 *   })
 *
 * 依赖：typeorm ^0.3.x + typeorm-extension（SnakeNamingStrategy）
 * MySQL 驱动建议 mysql2，且设置 supportBigNumbers:true, bigNumberStrings:false
 */

// ---- 基类（仅导出，TypeORM 不扫描抽象类）----
export { BaseEntity, BaseTimestampEntity, BaseCreatedEntity } from './common/entities/base.entity';

// ---- 模块一：用户 + RBAC ----
export { User, AdminUser, Role, Permission, RolePermission, AdminUserRole } from './modules/user/user.entity';

// ---- 模块二：冬泳协会 ----
export { Association, AssociationMember } from './modules/association/association.entity';

// ---- 模块三：场馆 + 教练预约 ----
export { Venue, Coach, CoachCourse, CoachSchedule, CoachAppointment, CoachReview } from './modules/venue/venue.entity';

// ---- 模块四：赛事通报 ----
export { EventSource, CrawlLog, Event, EventGroup, EventRegistration, EventRegistrationItem } from './modules/event/event.entity';

// ---- 模块五：游泳圈子 ----
export {
  CirclePost, CardShare, BuddyInvitation, Activity,
  ActivityParticipant, CircleComment, CircleLike, CircleFavorite, Report,
} from './modules/circle/circle.entity';

// ---- 模块六：微信通知 ----
export {
  OaFollower,
  MessageTemplate,
  UserSubscribe,
  NotificationLog,
  Announcement,
  AnnouncementRecipient,
} from './modules/notification/notification.entity';

// ---- 模块七：系统/运营支撑 ----
export { Banner, Feedback, SmsCode, SysConfig, OperationLog, AccessStat } from './modules/system/system.entity';

// ---- 模块八：行政区划（省/市/区县 维度表）----
export { Region } from './modules/region/region.entity';

// ---- 模块九/十：冬泳赛事 + 冬泳活动 ----
export {
  WinterCompetition,
  WinterCompetitionGroup,
  WinterCompetitionResult,
  WinterCompetitionScoreRule,
  WinterCompetitionSponsor,
} from './modules/competition/competition.entity';
export { WinterActivity } from './modules/activity/activity.entity';

// ---- 模块十一：冬泳参与（赛事/活动共用的参与协会 + 人员）----
export {
  WinterParticipation,
  WinterParticipant,
} from './modules/winter-participation/winter-participation.entity';

// ---- TypeORM entities 数组（forRoot 用）----
import { User } from './modules/user/user.entity';
import { AdminUser } from './modules/user/user.entity';
import { Role } from './modules/user/user.entity';
import { Permission } from './modules/user/user.entity';
import { RolePermission } from './modules/user/user.entity';
import { AdminUserRole } from './modules/user/user.entity';
import { Association } from './modules/association/association.entity';
import { AssociationMember } from './modules/association/association.entity';
import { Venue } from './modules/venue/venue.entity';
import { Coach } from './modules/venue/venue.entity';
import { CoachCourse } from './modules/venue/venue.entity';
import { CoachSchedule } from './modules/venue/venue.entity';
import { CoachAppointment } from './modules/venue/venue.entity';
import { CoachReview } from './modules/venue/venue.entity';
import { EventSource } from './modules/event/event.entity';
import { CrawlLog } from './modules/event/event.entity';
import { Event } from './modules/event/event.entity';
import { EventGroup } from './modules/event/event.entity';
import { EventRegistration } from './modules/event/event.entity';
import { EventRegistrationItem } from './modules/event/event.entity';
import { CirclePost } from './modules/circle/circle.entity';
import { CardShare } from './modules/circle/circle.entity';
import { BuddyInvitation } from './modules/circle/circle.entity';
import { Activity } from './modules/circle/circle.entity';
import { ActivityParticipant } from './modules/circle/circle.entity';
import { CircleComment } from './modules/circle/circle.entity';
import { CircleLike } from './modules/circle/circle.entity';
import { CircleFavorite } from './modules/circle/circle.entity';
import { Report } from './modules/circle/circle.entity';
import { OaFollower } from './modules/notification/notification.entity';
import { MessageTemplate } from './modules/notification/notification.entity';
import { UserSubscribe } from './modules/notification/notification.entity';
import { NotificationLog } from './modules/notification/notification.entity';
import { Announcement } from './modules/notification/notification.entity';
import { AnnouncementRecipient } from './modules/notification/notification.entity';
import { Banner } from './modules/system/system.entity';
import { Feedback } from './modules/system/system.entity';
import { SmsCode } from './modules/system/system.entity';
import { SysConfig } from './modules/system/system.entity';
import { OperationLog } from './modules/system/system.entity';
import { AccessStat } from './modules/system/system.entity';
import { Region } from './modules/region/region.entity';
import {
  WinterCompetition,
  WinterCompetitionGroup,
  WinterCompetitionResult,
  WinterCompetitionScoreRule,
  WinterCompetitionSponsor,
} from './modules/competition/competition.entity';
import { WinterActivity } from './modules/activity/activity.entity';
import {
  WinterParticipation,
  WinterParticipant,
} from './modules/winter-participation/winter-participation.entity';

export const entities = [
  // 模块一
  User, AdminUser, Role, Permission, RolePermission, AdminUserRole,
  // 模块二
  Association, AssociationMember,
  // 模块三
  Venue, Coach, CoachCourse, CoachSchedule, CoachAppointment, CoachReview,
  // 模块四
  EventSource, CrawlLog, Event, EventGroup, EventRegistration, EventRegistrationItem,
  // 模块五
  CirclePost, CardShare, BuddyInvitation, Activity,
  ActivityParticipant, CircleComment, CircleLike, CircleFavorite, Report,
  // 模块六
  OaFollower, MessageTemplate, UserSubscribe, NotificationLog,
  Announcement, AnnouncementRecipient,
  // 模块七
  Banner, Feedback, SmsCode, SysConfig, OperationLog, AccessStat,
  // 模块八
  Region,
  // 模块九/十
  WinterCompetition, WinterCompetitionGroup, WinterCompetitionResult, WinterCompetitionSponsor,
  WinterCompetitionScoreRule,
  WinterActivity,
  // 模块十一
  WinterParticipation, WinterParticipant,
];
