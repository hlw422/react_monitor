import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @Roles('admin')
  async findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  @Roles('admin')
  async findById(@Param('id') id: string) {
    return this.roleService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create role' })
  @Roles('admin')
  async create(@Body() data: { name: string; description?: string; permissions: string[] }) {
    return this.roleService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update role' })
  @Roles('admin')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.roleService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete role' })
  @Roles('admin')
  async delete(@Param('id') id: string) {
    return this.roleService.delete(id);
  }
}
