import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AssignVendorOwnerDto,
  CreateVendorDto,
  UpdateVendorDto,
  UpdateVendorStatusDto,
  VendorDto,
  VendorQueryDto,
} from './dto/vendor.dto';
import { VendorsService } from './vendors.service';

@ApiTags('vendors')
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  /** List vendors, optionally filtered by city, phone or status */
  @Get()
  @ApiOkResponse({ type: VendorDto, isArray: true })
  async findAll(@Query() query: VendorQueryDto): Promise<VendorDto[]> {
    const vendors = await this.vendorsService.findMany(query);
    return vendors.map((v) => VendorDto.from(v));
  }

  /** Get vendor by id */
  @Get(':id')
  @ApiOkResponse({ type: VendorDto })
  @ApiNotFoundResponse()
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<VendorDto> {
    const vendor = await this.vendorsService.findById(id);
    if (!vendor) throw new NotFoundException(`Vendor ${id} not found`);
    return VendorDto.from(vendor);
  }

  /** Create vendor */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: VendorDto })
  @ApiConflictResponse({ description: 'Vendor with same city+name exists' })
  async create(@Body() dto: CreateVendorDto): Promise<VendorDto> {
    const vendor = await this.vendorsService.create(dto);
    return VendorDto.from(vendor);
  }

  /** Update vendor fields */
  @Patch(':id')
  @ApiOkResponse({ type: VendorDto })
  @ApiNotFoundResponse()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVendorDto,
  ): Promise<VendorDto> {
    const vendor = await this.vendorsService.update(id, dto);
    if (!vendor) throw new NotFoundException(`Vendor ${id} not found`);
    return VendorDto.from(vendor);
  }

  /** Change vendor status */
  @Patch(':id/status')
  @ApiOkResponse({ type: VendorDto })
  @ApiNotFoundResponse()
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVendorStatusDto,
  ): Promise<VendorDto> {
    const vendor = await this.vendorsService.setStatus(id, dto.status);
    if (!vendor) throw new NotFoundException(`Vendor ${id} not found`);
    return VendorDto.from(vendor);
  }

  /** Assign owner user to vendor (promotes user to `vendor` role) */
  @Patch(':id/owner')
  @ApiOkResponse({ type: VendorDto })
  @ApiNotFoundResponse()
  async assignOwner(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignVendorOwnerDto,
  ): Promise<VendorDto> {
    const vendor = await this.vendorsService.assignOwner(id, dto.ownerUserId);
    if (!vendor) throw new NotFoundException(`Vendor ${id} not found`);
    return VendorDto.from(vendor);
  }
}
