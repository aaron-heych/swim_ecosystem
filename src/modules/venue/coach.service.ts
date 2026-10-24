import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Coach,
  CoachAppointment,
  CoachCourse,
  CoachReview,
  CoachSchedule,
} from './venue.entity';
import {
  PaginatedResult,
  paginate,
} from '../../common/dto/pagination.dto';
import { CreateCoachDto, UpdateCoachDto } from './dto/create-coach.dto';
import { CreateCourseDto, UpdateCourseDto } from './dto/create-course.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import {
  QueryAppointmentDto,
  UpdateAppointmentPayStatusDto,
  UpdateAppointmentStatusDto,
} from './dto/query-appointment.dto';
import {
  AuditCoachDto,
  ReplyReviewDto,
  UpdateCoachStatusDto,
  UpdateCourseStatusDto,
} from './dto/audit-coach.dto';

/** 生成业务订单号：YYYYMMDDHHmm + 6 位随机 */
function generateOrderNo(): string {
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  const ymd =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}`;
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `${ymd}${rand}`;
}

@Injectable()
export class CoachService {
  constructor(
    @InjectRepository(Coach)
    private readonly coachRepo: Repository<Coach>,
    @InjectRepository(CoachCourse)
    private readonly courseRepo: Repository<CoachCourse>,
    @InjectRepository(CoachSchedule)
    private readonly scheduleRepo: Repository<CoachSchedule>,
    @InjectRepository(CoachAppointment)
    private readonly apptRepo: Repository<CoachAppointment>,
    @InjectRepository(CoachReview)
    private readonly reviewRepo: Repository<CoachReview>,
    private readonly dataSource: DataSource,
  ) {}

  // ========================================================
  // C 端：教练 / 课程 / 排班 浏览
  // ========================================================

  async listPublic(
    page = 1,
    pageSize = 20,
    keyword?: string,
    venueId?: number,
    strokes?: string[],
  ): Promise<PaginatedResult<Coach>> {
    const qb = this.coachRepo
      .createQueryBuilder('c')
      .where('c.audit_status = :audit', { audit: 1 })
      .andWhere('c.status = :st', { st: 1 });

    if (venueId) qb.andWhere('c.venue_id = :venueId', { venueId });
    if (keyword) {
      qb.andWhere('(c.name LIKE :kw OR c.title LIKE :kw OR c.intro LIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }
    if (strokes && strokes.length) {
      // JSON 数组筛选：使用 LIKE 简化处理
      strokes.forEach((s, i) => {
        qb.andWhere(`c.strokes LIKE :stroke${i}`, {
          [`stroke${i}`]: `%"${s}"%`,
        });
      });
    }
    qb.orderBy('c.sort', 'DESC')
      .addOrderBy('c.rating', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  async findPublicDetail(id: number): Promise<Coach> {
    const coach = await this.coachRepo.findOne({
      where: { id, auditStatus: 1, status: 1 } as any,
      relations: ['courses', 'venue'],
    });
    if (!coach) throw new NotFoundException('教练不存在或已下架');
    return coach;
  }

  async listSchedules(
    coachId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<CoachSchedule[]> {
    const qb = this.scheduleRepo
      .createQueryBuilder('s')
      .where('s.coach_id = :coachId', { coachId });
    if (startDate) qb.andWhere('s.work_date >= :sd', { sd: startDate });
    if (endDate) qb.andWhere('s.work_date <= :ed', { ed: endDate });
    qb.orderBy('s.work_date', 'ASC').addOrderBy('s.start_time', 'ASC');
    return qb.getMany();
  }

  async findCourseDetail(courseId: number): Promise<CoachCourse> {
    const course = await this.courseRepo.findOne({
      where: { id: courseId } as any,
      relations: ['coach'],
    });
    if (!course) throw new NotFoundException('课程不存在');
    return course;
  }

  // ========================================================
  // C 端：预约
  // ========================================================

  /** 用户创建预约（事务：写预约单 + 锁定排班） */
  async createAppointment(
    userId: number,
    dto: CreateAppointmentDto,
  ): Promise<CoachAppointment> {
    return this.dataSource.transaction(async (manager) => {
      // 教练校验
      const coach = await manager.findOne(Coach, {
        where: { id: dto.coachId, auditStatus: 1, status: 1 } as any,
      });
      if (!coach) throw new NotFoundException('教练不存在或已下架');

      // 若指定 schedule，校验并锁定
      let schedule: CoachSchedule | null = null;
      if (dto.scheduleId) {
        schedule = await manager.findOne(CoachSchedule, {
          where: { id: dto.scheduleId } as any,
          lock: { mode: 'pessimistic_write' },
        });
        if (!schedule) throw new NotFoundException('排班不存在');
        if (schedule.status !== 0) {
          throw new ConflictException('该排班已被预约或锁定');
        }
        if (schedule.coachId !== dto.coachId) {
          throw new BadRequestException('排班与教练不匹配');
        }
      }

      const orderNo = generateOrderNo();
      const appt = manager.create(CoachAppointment, {
        orderNo,
        userId,
        coachId: dto.coachId,
        courseId: dto.courseId ?? schedule?.courseId ?? null,
        scheduleId: dto.scheduleId ?? null,
        venueId: dto.venueId ?? schedule?.venueId ?? coach.venueId ?? null,
        appointmentDate: dto.appointmentDate,
        startTime: dto.startTime,
        endTime: dto.endTime,
        price: dto.price,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        remark: dto.remark ?? null,
        status: 0, // 待确认
        payStatus: 0, // 待支付
      });

      const saved = await manager.save(CoachAppointment, appt);

      // 锁定排班
      if (schedule) {
        schedule.status = 1; // 已约
        await manager.save(CoachSchedule, schedule);
      }
      return saved;
    });
  }

  async listMyAppointments(
    userId: number,
    query: QueryAppointmentDto,
  ): Promise<PaginatedResult<CoachAppointment>> {
    const { page, pageSize, status, payStatus, orderNo } = query;
    const qb = this.apptRepo
      .createQueryBuilder('a')
      .where('a.user_id = :userId', { userId });
    if (status !== undefined && status !== null) {
      qb.andWhere('a.status = :status', { status });
    }
    if (payStatus !== undefined && payStatus !== null) {
      qb.andWhere('a.pay_status = :payStatus', { payStatus });
    }
    if (orderNo) qb.andWhere('a.order_no LIKE :orderNo', { orderNo: `%${orderNo}%` });
    qb.orderBy('a.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  async findAppointmentByOrderNo(
    orderNo: string,
    userId?: number,
  ): Promise<CoachAppointment> {
    const qb = this.apptRepo
      .createQueryBuilder('a')
      .where('a.order_no = :orderNo', { orderNo })
      .leftJoinAndSelect('a.coach', 'coach')
      .leftJoinAndSelect('a.course', 'course')
      .leftJoinAndSelect('a.schedule', 'schedule')
      .leftJoinAndSelect('a.venue', 'venue')
      .leftJoinAndSelect('a.reviews', 'reviews');
    if (userId) qb.andWhere('a.user_id = :userId', { userId });
    const appt = await qb.getOne();
    if (!appt) throw new NotFoundException('预约单不存在');
    return appt;
  }

  /** 用户取消预约（事务：置 status=3 + cancelBy=1 + 释放排班） */
  async cancelByUser(orderNo: string, userId: number): Promise<CoachAppointment> {
    return this.dataSource.transaction(async (manager) => {
      const appt = await manager.findOne(
        CoachAppointment,
        { where: { orderNo, userId } as any, lock: { mode: 'pessimistic_write' } },
      );
      if (!appt) throw new NotFoundException('预约单不存在');
      if (appt.status === 3 || appt.status === 4) {
        throw new BadRequestException('预约已取消');
      }
      if (appt.status === 2) {
        throw new BadRequestException('已完成，无法取消');
      }
      appt.status = 3; // 用户取消
      appt.cancelBy = 1; // 用户
      const saved = await manager.save(CoachAppointment, appt);

      // 释放排班
      if (appt.scheduleId) {
        const schedule = await manager.findOne(CoachSchedule, {
          where: { id: appt.scheduleId } as any,
        });
        if (schedule && schedule.status === 1) {
          schedule.status = 0;
          await manager.save(CoachSchedule, schedule);
        }
      }
      return saved;
    });
  }

  // ========================================================
  // C 端：评价
  // ========================================================

  async createReview(
    userId: number,
    dto: CreateReviewDto,
  ): Promise<CoachReview> {
    return this.dataSource.transaction(async (manager) => {
      // 查找预约单
      let appt: CoachAppointment | null = null;
      if (dto.appointmentId) {
        appt = await manager.findOne(CoachAppointment, {
          where: { id: dto.appointmentId, userId } as any,
        });
      } else if (dto.orderNo) {
        appt = await manager.findOne(CoachAppointment, {
          where: { orderNo: dto.orderNo, userId } as any,
        });
      }
      if (!appt) throw new NotFoundException('预约单不存在');
      if (appt.status !== 2) {
        throw new BadRequestException('仅已完成预约可评价');
      }

      // 唯一约束：每预约单只能评一次
      const existed = await manager.findOne(CoachReview, {
        where: { appointmentId: appt.id } as any,
      });
      if (existed) throw new ConflictException('该预约已评价');

      const review = manager.create(CoachReview, {
        appointmentId: appt.id,
        coachId: appt.coachId,
        userId,
        scoreProfessional: dto.scoreProfessional,
        scoreAttitude: dto.scoreAttitude,
        scorePunctual: dto.scorePunctual,
        content: dto.content ?? null,
        images: dto.images ?? null,
      });
      const saved = await manager.save(CoachReview, review);

      // 异步更新教练冗余统计（同事务内）：rating、ratingCount、studentCount
      const coach = await manager.findOne(Coach, {
        where: { id: appt.coachId } as any,
        lock: { mode: 'pessimistic_write' },
      });
      if (coach) {
        const allReviews = await manager.find(CoachReview, {
          where: { coachId: coach.id } as any,
        });
        const n = allReviews.length;
        const avg =
          n > 0
            ? allReviews.reduce(
                (s, r) =>
                  s +
                  (r.scoreProfessional + r.scoreAttitude + r.scorePunctual) /
                    3,
                0,
              ) / n
            : 0;
        coach.rating = Math.round(avg * 10) / 10;
        coach.ratingCount = n;
        coach.studentCount = (coach.studentCount || 0) + 1;
        await manager.save(Coach, coach);
      }
      return saved;
    });
  }

  async listCoachReviews(
    coachId: number,
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedResult<CoachReview>> {
    const qb = this.reviewRepo
      .createQueryBuilder('r')
      .withDeleted()
      .where('r.coach_id = :coachId', { coachId })
      .leftJoinAndSelect('r.user', 'user')
      .orderBy('r.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    list.forEach((review) => {
      if (review.user) {
        review.user.isDeleted = !!review.user.deletedAt;
        review.user.displayName = review.user.deletedAt
          ? '已注销用户'
          : review.user.realName || review.user.nickname || '用户';
      }
    });
    return paginate(list, total, page, pageSize);
  }

  // ========================================================
  // 后台：教练
  // ========================================================

  async listAdmin(
    page = 1,
    pageSize = 20,
    keyword?: string,
    venueId?: number,
    auditStatus?: number,
    status?: number,
  ): Promise<PaginatedResult<Coach>> {
    const qb = this.coachRepo.createQueryBuilder('c');
    if (keyword) {
      qb.andWhere('(c.name LIKE :kw OR c.title LIKE :kw OR c.phone LIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }
    if (venueId) qb.andWhere('c.venue_id = :venueId', { venueId });
    if (auditStatus !== undefined && auditStatus !== null) {
      qb.andWhere('c.audit_status = :auditStatus', { auditStatus });
    }
    if (status !== undefined && status !== null) {
      qb.andWhere('c.status = :status', { status });
    }
    qb.orderBy('c.sort', 'DESC')
      .addOrderBy('c.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return paginate(list, total, page, pageSize);
  }

  async findCoachById(id: number): Promise<Coach> {
    const coach = await this.coachRepo.findOne({
      where: { id } as any,
      relations: ['user', 'venue', 'courses'],
    });
    if (!coach) throw new NotFoundException('教练不存在');
    return coach;
  }

  async createCoach(dto: CreateCoachDto): Promise<Coach> {
    const coach = this.coachRepo.create(dto);
    return this.coachRepo.save(coach);
  }

  async updateCoach(id: number, dto: UpdateCoachDto): Promise<Coach> {
    const coach = await this.findCoachById(id);
    Object.assign(coach, dto);
    return this.coachRepo.save(coach);
  }

  async auditCoach(id: number, dto: AuditCoachDto): Promise<Coach> {
    const coach = await this.findCoachById(id);
    coach.auditStatus = dto.auditStatus;
    if (dto.auditRemark !== undefined) coach.auditRemark = dto.auditRemark;
    return this.coachRepo.save(coach);
  }

  async updateCoachStatus(
    id: number,
    dto: UpdateCoachStatusDto,
  ): Promise<Coach> {
    const coach = await this.findCoachById(id);
    coach.status = dto.status;
    return this.coachRepo.save(coach);
  }

  async deleteCoach(id: number): Promise<void> {
    const coach = await this.findCoachById(id);
    await this.coachRepo.softDelete(coach.id);
  }

  // ========================================================
  // 后台：课程
  // ========================================================

  async createCourse(dto: CreateCourseDto): Promise<CoachCourse> {
    await this.findCoachById(dto.coachId);
    const course = this.courseRepo.create(dto);
    return this.courseRepo.save(course);
  }

  async updateCourse(courseId: number, dto: UpdateCourseDto): Promise<CoachCourse> {
    const course = await this.findCourseById(courseId);
    Object.assign(course, dto);
    return this.courseRepo.save(course);
  }

  async updateCourseStatus(
    courseId: number,
    dto: UpdateCourseStatusDto,
  ): Promise<CoachCourse> {
    const course = await this.findCourseById(courseId);
    course.status = dto.status;
    return this.courseRepo.save(course);
  }

  async deleteCourse(courseId: number): Promise<void> {
    const course = await this.findCourseById(courseId);
    await this.courseRepo.softDelete(course.id);
  }

  // ========================================================
  // 后台：排班
  // ========================================================

  async batchCreateSchedules(dto: CreateScheduleDto): Promise<CoachSchedule[]> {
    const coach = await this.findCoachById(dto.coachId);
    const created: CoachSchedule[] = [];
    for (const d of dto.dates) {
      try {
        const s = this.scheduleRepo.create({
          coachId: dto.coachId,
          courseId: dto.courseId ?? null,
          venueId: dto.venueId ?? coach.venueId ?? null,
          workDate: d,
          startTime: dto.startTime,
          endTime: dto.endTime,
          status: 0,
        });
        const saved = await this.scheduleRepo.save(s);
        created.push(saved);
      } catch (e) {
        // 唯一索引冲突：跳过
        if ((e as any)?.code !== 'ER_DUP_ENTRY') throw e;
      }
    }
    return created;
  }

  async deleteSchedule(id: number): Promise<void> {
    const s = await this.scheduleRepo.findOne({ where: { id } as any });
    if (!s) throw new NotFoundException('排班不存在');
    if (s.status === 1) {
      throw new BadRequestException('排班已被预约，无法删除');
    }
    await this.scheduleRepo.softDelete(s.id);
  }

  // ========================================================
  // 后台：预约
  // ========================================================

  async listAppointments(
    query: QueryAppointmentDto,
  ): Promise<PaginatedResult<CoachAppointment>> {
    const { page, pageSize, coachId, userId, status, payStatus, orderNo } =
      query;
    const qb = this.apptRepo.createQueryBuilder('a').withDeleted();
    if (coachId) qb.andWhere('a.coach_id = :coachId', { coachId });
    if (userId) qb.andWhere('a.user_id = :userId', { userId });
    if (status !== undefined && status !== null) {
      qb.andWhere('a.status = :status', { status });
    }
    if (payStatus !== undefined && payStatus !== null) {
      qb.andWhere('a.pay_status = :payStatus', { payStatus });
    }
    if (orderNo) qb.andWhere('a.order_no LIKE :orderNo', { orderNo: `%${orderNo}%` });
    qb.leftJoinAndSelect('a.coach', 'coach')
      .leftJoinAndSelect('a.user', 'user')
      .orderBy('a.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    list.forEach((appointment) => {
      if (appointment.user) {
        appointment.user.isDeleted = !!appointment.user.deletedAt;
        appointment.user.displayName = appointment.user.deletedAt
          ? '已注销用户'
          : appointment.user.realName || appointment.user.nickname || '用户';
      }
    });
    return paginate(list, total, page, pageSize);
  }

  async findAppointmentById(id: number): Promise<CoachAppointment> {
    const appt = await this.apptRepo.findOne({
      where: { id } as any,
      relations: ['coach', 'user', 'course', 'schedule', 'venue', 'reviews'],
      withDeleted: true,
    });
    if (!appt) throw new NotFoundException('预约单不存在');
    return appt;
  }

  /** 修改预约状态（教练确认/完成/取消/爽约） */
  async updateAppointmentStatus(
    id: number,
    dto: UpdateAppointmentStatusDto,
  ): Promise<CoachAppointment> {
    return this.dataSource.transaction(async (manager) => {
      const appt = await manager.findOne(CoachAppointment, {
        where: { id } as any,
        lock: { mode: 'pessimistic_write' },
      });
      if (!appt) throw new NotFoundException('预约单不存在');
      const prevStatus = appt.status;
      appt.status = dto.status;
      if (dto.cancelReason !== undefined) appt.cancelReason = dto.cancelReason;
      if (dto.cancelBy !== undefined) appt.cancelBy = dto.cancelBy;
      else if ([3, 4, 5].includes(dto.status) && appt.cancelBy === null) {
        appt.cancelBy = 2; // 教练取消默认
      }
      const saved = await manager.save(CoachAppointment, appt);

      // 进入取消态且原本不是取消态：释放排班
      if (
        [3, 4, 5].includes(dto.status) &&
        ![3, 4, 5].includes(prevStatus) &&
        appt.scheduleId
      ) {
        const schedule = await manager.findOne(CoachSchedule, {
          where: { id: appt.scheduleId } as any,
        });
        if (schedule && schedule.status === 1) {
          schedule.status = 0;
          await manager.save(CoachSchedule, schedule);
        }
      }
      return saved;
    });
  }

  async updateAppointmentPayStatus(
    id: number,
    dto: UpdateAppointmentPayStatusDto,
  ): Promise<CoachAppointment> {
    const appt = await this.findAppointmentById(id);
    appt.payStatus = dto.payStatus;
    if (dto.payStatus === 1) {
      appt.payTime = new Date();
      if (dto.transactionId) appt.transactionId = dto.transactionId;
    } else if (dto.payStatus === 2) {
      appt.transactionId = dto.transactionId ?? appt.transactionId;
    }
    return this.apptRepo.save(appt);
  }

  // ========================================================
  // 后台：评价回复
  // ========================================================

  async replyReview(
    id: number,
    dto: ReplyReviewDto,
  ): Promise<CoachReview> {
    const review = await this.reviewRepo.findOne({ where: { id } as any });
    if (!review) throw new NotFoundException('评价不存在');
    review.reply = dto.reply;
    review.repliedAt = new Date();
    return this.reviewRepo.save(review);
  }

  // ========================================================
  // 私有：复用查询
  // ========================================================

  private async findCourseById(courseId: number): Promise<CoachCourse> {
    const course = await this.courseRepo.findOne({
      where: { id: courseId } as any,
      relations: ['coach'],
    });
    if (!course) throw new NotFoundException('课程不存在');
    return course;
  }
}
