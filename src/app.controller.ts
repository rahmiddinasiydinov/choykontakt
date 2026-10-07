import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { sql } from 'drizzle-orm';
import { DRIZZLE } from './db/db.module';
import type { Database } from './db/db.module';

export class HealthDto {
  /** Always "ok" when 200 */
  status: 'ok';
  /** Process uptime, seconds */
  uptime: number;
  /** Database reachable */
  db: boolean;
}

@ApiTags('health')
@Controller()
export class AppController {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /** Liveness + DB readiness probe */
  @Get('health')
  @ApiOkResponse({ type: HealthDto })
  @ApiServiceUnavailableResponse({ description: 'Database unreachable' })
  async health(): Promise<HealthDto> {
    try {
      await this.db.execute(sql`select 1`);
    } catch {
      throw new ServiceUnavailableException('database unreachable');
    }
    return { status: 'ok', uptime: Math.round(process.uptime()), db: true };
  }
}
