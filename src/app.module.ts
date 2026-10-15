import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from './common/snake-naming.strategy';
import { entities } from './entities.index';
import { AppController } from './app.controller';
import { CommonModule } from './common/common.module';
import { AccessStatMiddleware } from './common/middleware/access-stat.middleware';
import { UserModule } from './modules/user/user.module';
import { AssociationModule } from './modules/association/association.module';
import { VenueModule } from './modules/venue/venue.module';
import { EventModule } from './modules/event/event.module';
import { CircleModule } from './modules/circle/circle.module';
import { NotificationModule } from './modules/notification/notification.module';
import { SystemModule } from './modules/system/system.module';
import { RegionModule } from './modules/region/region.module';
import { CompetitionModule } from './modules/competition/competition.module';
import { WinterActivityModule } from './modules/activity/activity.module';
import { WinterParticipationModule } from './modules/winter-participation/winter-participation.module';
import { WinterDashboardModule } from './modules/winter-dashboard/winter-dashboard.module';

@Module({
  imports: [
    // 环境变量加载（.env）
    ConfigModule.forRoot({ isGlobal: true }),

    // TypeORM MySQL 配置
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'mysql' as const,
        host: cfg.get<string>('DB_HOST', '127.0.0.1'),
        port: Number(cfg.get<string>('DB_PORT', '3306')),
        username: cfg.get<string>('DB_USER', 'root'),
        password: cfg.get<string>('DB_PASSWORD', '123456'),
        database: cfg.get<string>('DB_DATABASE', 'swimming_platform'),
        entities,
        namingStrategy: new SnakeNamingStrategy(),
        supportBigNumbers: true,
        bigNumberStrings: false,
        // dev 首次起表可用 true，生产必须 false
        synchronize: cfg.get<string>('DB_SYNC', 'false') === 'true',
        logging: cfg.get<string>('DB_LOGGING', 'false') === 'true',
        timezone: '+08:00',
        charset: 'utf8mb4',
      }),
    }),

    // 全局基础设施（JWT、守卫、拦截器、过滤器、WxUtil）
    CommonModule,

    // 业务模块
    UserModule,
    AssociationModule,
    VenueModule,
    EventModule,
    CircleModule,
    NotificationModule,
    SystemModule,
    RegionModule,
    CompetitionModule,
    WinterActivityModule,
    WinterParticipationModule,
    WinterDashboardModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  /** 注册全局访问量埋点中间件（仅 C 端 /api/<module> 请求累加） */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AccessStatMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
