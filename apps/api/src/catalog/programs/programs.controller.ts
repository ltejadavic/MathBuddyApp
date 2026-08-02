import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CatalogService } from '../catalog.service';
import { CreateProgramDto, UpdateProgramDto } from '../dto/catalog.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@math-buddy/database';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('programs')
export class ProgramsController {
  constructor(private readonly catalogService: CatalogService) {}

  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() createProgramDto: CreateProgramDto): Promise<any> {
    return this.catalogService.createProgram(createProgramDto);
  }

  @Get()
  async findAll(): Promise<any> {
    return this.catalogService.getPrograms();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<any> {
    return this.catalogService.getProgram(id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProgramDto: UpdateProgramDto,
  ): Promise<any> {
    return this.catalogService.updateProgram(id, updateProgramDto);
  }
}
