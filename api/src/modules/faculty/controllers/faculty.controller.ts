import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FacultyService } from '../services/faculty.service';
import {
  CreateFacultyDto, UpdateFacultyDto, SearchFacultyDto,
  CreateMajorDto, UpdateMajorDto, SearchMajorDto,
  CreateClassDto, UpdateClassDto, SearchClassDto
} from '../dtos/faculty.dto';
import { DataResponse } from 'src/kernel/models/data-response.model';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { RoleGuard } from 'src/modules/auth/guards/role.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';

@Controller('admin/faculties')
@UseGuards(AuthGuard, RoleGuard)
@Roles('admin')
export class AdminFacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  @Get()
  async search(@Query() query: SearchFacultyDto) {
    const result = await this.facultyService.searchFaculties(query);
    return DataResponse.ok(result);
  }

  @Post()
  async create(@Body() dto: CreateFacultyDto) {
    const result = await this.facultyService.createFaculty(dto);
    return DataResponse.ok(result);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateFacultyDto) {
    const result = await this.facultyService.updateFaculty(id, dto);
    return DataResponse.ok(result);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.facultyService.deleteFaculty(id);
    return DataResponse.ok({ message: 'Xóa khoa thành công' });
  }
}

@Controller('admin/majors')
@UseGuards(AuthGuard, RoleGuard)
@Roles('admin')
export class AdminMajorController {
  constructor(private readonly facultyService: FacultyService) {}

  @Get()
  async search(@Query() query: SearchMajorDto) {
    const result = await this.facultyService.searchMajors(query);
    return DataResponse.ok(result);
  }

  @Post()
  async create(@Body() dto: CreateMajorDto) {
    const result = await this.facultyService.createMajor(dto);
    return DataResponse.ok(result);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateMajorDto) {
    const result = await this.facultyService.updateMajor(id, dto);
    return DataResponse.ok(result);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.facultyService.deleteMajor(id);
    return DataResponse.ok({ message: 'Xóa ngành thành công' });
  }
}

@Controller('admin/classes')
@UseGuards(AuthGuard, RoleGuard)
@Roles('admin')
export class AdminClassController {
  constructor(private readonly facultyService: FacultyService) {}

  @Get()
  async search(@Query() query: SearchClassDto) {
    const result = await this.facultyService.searchClasses(query);
    return DataResponse.ok(result);
  }

  @Post()
  async create(@Body() dto: CreateClassDto) {
    const result = await this.facultyService.createClass(dto);
    return DataResponse.ok(result);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateClassDto) {
    const result = await this.facultyService.updateClass(id, dto);
    return DataResponse.ok(result);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.facultyService.deleteClass(id);
    return DataResponse.ok({ message: 'Xóa lớp thành công' });
  }
}

// Public endpoints cho dropdown
@Controller('faculties')
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  @Get()
  async findAll() {
    const result = await this.facultyService.findAllFaculties();
    return DataResponse.ok(result);
  }

  @Get(':id/majors')
  async findMajors(@Param('id') id: string) {
    const result = await this.facultyService.findMajorsByFaculty(id);
    return DataResponse.ok(result);
  }
}

@Controller('majors')
export class MajorController {
  constructor(private readonly facultyService: FacultyService) {}

  @Get(':id/classes')
  async findClasses(@Param('id') id: string) {
    const result = await this.facultyService.findClassesByMajor(id);
    return DataResponse.ok(result);
  }
}
