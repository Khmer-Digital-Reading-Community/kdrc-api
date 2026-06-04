import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from 'src/common/enums/role.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
