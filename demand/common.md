# Swimming Ecosystem

## 1. 项目概述
系统共通技术栈，端口配置等共通功能描述

## 2. 技术栈

- 前端：UniApp + Vue3
- 后端：Node.js + NestJS
- 数据库：MySQL
- 部署：腾讯云轻量服务器 + 微信云开发
- 管理后台：Vue3 + Element Plus
- 赛事抓取：Node.js 定时任务 + Puppeteer/ Cheerio
- 通知：微信订阅消息 + 公众号模板消息

## 3. 服务端口

| 服务 | 容器端口 | 宿主机端口 | 说明 |
|---|---|---|---|
| API | 3000 | 3000 / 3001 | 主服务端口 |
| MySQL | 3306 | 3306 | 数据库 |
| Redis | 6379 | 6379 | 缓存 |

如果本地 3000 端口被占用，可改为 3001。

## 6. Docker Compose 配置

使用 Docker Compose 只启动 MySQL 和 Redis。

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: swimming-mysql
    restart: always
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: 123456
      MYSQL_DATABASE: swim_ecosystem
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    container_name: swim-redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mysql_data:
  redis_data: