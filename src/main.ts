import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // 上传文件静态访问：/uploads/** -> <cwd>/uploads/**
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });
  // 各 Controller 已显式使用 'api/...' 前缀，无需全局前缀
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({
    origin: true,
    credentials: true,
  });

  // ===== Swagger API 文档 =====
  const swaggerConfig = new DocumentBuilder()
    .setTitle('游泳生态圈 API')
    .setDescription('冬泳协会 / 赛事通报 / 游泳圈子 / 场馆教练预约 后端接口文档')
    .setVersion('0.1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: '填入登录后获取的 JWT token' },
      'JWT',
    )
    .addTag('app', '服务信息')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  Logger.log(`🚀 Swim-Ecosystem API running on http://localhost:${port}`, 'Bootstrap');
  Logger.log(`📖 Swagger docs: http://localhost:${port}/docs`, 'Bootstrap');
}
bootstrap();
