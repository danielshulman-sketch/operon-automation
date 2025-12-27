import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from '../src/app.module';

const server = express();
let initPromise: Promise<void> | null = null;

async function init() {
  if (!initPromise) {
    initPromise = (async () => {
      const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
      await app.init();
    })();
  }
  return initPromise;
}

export default async function handler(req: any, res: any) {
  await init();
  return server(req, res);
}
