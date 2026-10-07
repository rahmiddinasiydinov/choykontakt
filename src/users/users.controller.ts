import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UpdateUserRoleDto, UserDto } from './dto/user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** List all users */
  @Get()
  @ApiOkResponse({ type: UserDto, isArray: true })
  async findAll(): Promise<UserDto[]> {
    const users = await this.usersService.findAll();
    return users.map((u) => UserDto.from(u));
  }

  /** Get user by internal id */
  @Get(':id')
  @ApiOkResponse({ type: UserDto })
  @ApiNotFoundResponse()
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserDto> {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return UserDto.from(user);
  }

  /** Get user by Telegram id */
  @Get('telegram/:telegramId')
  @ApiOkResponse({ type: UserDto })
  @ApiNotFoundResponse()
  async findByTelegramId(
    @Param('telegramId', ParseIntPipe) telegramId: number,
  ): Promise<UserDto> {
    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) throw new NotFoundException(`User tg:${telegramId} not found`);
    return UserDto.from(user);
  }

  /** Change user role */
  @Patch(':id/role')
  @ApiOkResponse({ type: UserDto })
  @ApiNotFoundResponse()
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
  ): Promise<UserDto> {
    const user = await this.usersService.setRole(id, dto.role);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return UserDto.from(user);
  }
}
