require('dotenv').config();
process.env.TEMPLATE_DIR = `${__dirname}/templates`;

import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionLogFilter } from './kernel/logger/http-exception-log.filter';
import { renderFile } from './kernel/helpers/view.helper';
import { join } from 'path';
import { existsSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.enableCors();
  app.use(require('express').json({ limit: '10mb' }));
  app.use(require('express').urlencoded({ limit: '10mb', extended: true }));
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionLogFilter(httpAdapter));
  app.engine('html', renderFile);
  app.set('view engine', 'html');

  // Serve favicon.ico and logo.ico
  const logoIcoPath = join(process.cwd(), 'public', 'logo.ico');
  const logoPngPath = join(process.cwd(), 'public', 'logo.png');
  if (existsSync(logoIcoPath) && existsSync(logoPngPath)) {
    app.use('/favicon.ico', (req, res) => {
      res.setHeader('Content-Type', 'image/x-icon');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.sendFile(logoIcoPath);
    });
    app.use('/logo.ico', (req, res) => {
      res.setHeader('Content-Type', 'image/x-icon');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.sendFile(logoIcoPath);
    });
    app.use('/logo.png', (req, res) => {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.sendFile(logoPngPath);
    });
  }

  await app.listen(process.env.HTTP_PORT || 5001);
}
bootstrap();
