import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { userRoleEnum } from '../../db/schema';
import type { User, UserRole } from '../../db/schema';

export class UserDto {
  /** Internal id */
  id: number;
  /** Telegram user id */
  telegramId: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  /** IETF language tag from Telegram, e.g. "uz" */
  languageCode: string | null;
  @ApiProperty({ enum: userRoleEnum.enumValues })
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;

  static from(user: User): UserDto {
    return Object.assign(new UserDto(), user);
  }
}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: userRoleEnum.enumValues })
  @IsEnum(userRoleEnum.enumValues)
  role: UserRole;
}
