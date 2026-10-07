import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { DRIZZLE } from './db/db.module';

describe('AppController', () => {
  async function build(execute: jest.Mock) {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: DRIZZLE, useValue: { execute } }],
    }).compile();
    return module.get(AppController);
  }

  it('returns ok when DB answers', async () => {
    const controller = await build(jest.fn().mockResolvedValue([]));
    await expect(controller.health()).resolves.toMatchObject({
      status: 'ok',
      db: true,
    });
  });

  it('returns 503 when DB fails', async () => {
    const controller = await build(jest.fn().mockRejectedValue(new Error('x')));
    await expect(controller.health()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
