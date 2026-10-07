import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { vendorStatusEnum } from '../../db/schema';
import type { Vendor, VendorStatus } from '../../db/schema';
import { normalizePhone } from '../vendors.service';

export class VendorDto {
  id: number;
  /** Internal id of owning user; null until claimed */
  ownerUserId: number | null;
  name: string;
  city: string;
  /** E.164 phone numbers, e.g. +998901234567 */
  phones: string[];
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  @ApiProperty({ enum: vendorStatusEnum.enumValues })
  status: VendorStatus;
  createdAt: Date;
  updatedAt: Date;

  static from(vendor: Vendor): VendorDto {
    return Object.assign(new VendorDto(), vendor);
  }
}

export class CreateVendorDto {
  /** Choyxona name, unique within city */
  @IsString()
  @Length(1, 120)
  name: string;

  /** City, e.g. "Asaka" */
  @IsString()
  @Length(1, 80)
  city: string;

  /** Phone numbers; normalized to E.164 on save */
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsPhoneNumber(undefined, { each: true })
  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value)
      ? value.map((v) => normalizePhone(String(v))).filter(Boolean)
      : value,
  )
  phones?: string[];

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  address?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  /** Internal id of owning user */
  @IsOptional()
  @IsInt()
  @Min(1)
  ownerUserId?: number;
}

export class UpdateVendorDto extends PartialType(CreateVendorDto) {}

export class UpdateVendorStatusDto {
  @ApiProperty({ enum: vendorStatusEnum.enumValues })
  @IsEnum(vendorStatusEnum.enumValues)
  status: VendorStatus;
}

export class AssignVendorOwnerDto {
  /** Internal id of user who will own this vendor */
  @IsInt()
  @Min(1)
  ownerUserId: number;
}

export class VendorQueryDto {
  /** Filter by city (exact match) */
  @IsOptional()
  @IsString()
  city?: string;

  /** Find vendors having this phone (any format, normalized) */
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(vendorStatusEnum.enumValues)
  @ApiProperty({ enum: vendorStatusEnum.enumValues, required: false })
  status?: VendorStatus;
}
