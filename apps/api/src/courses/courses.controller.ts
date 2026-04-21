import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseService } from '../supabase/supabase.service';
import { AdminService } from '../admin/admin.service';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Controller('courses')
@UseGuards(SupabaseAuthGuard)
export class CoursesController {
  constructor(
    private readonly courses: CoursesService,
    private readonly adminService: AdminService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Get('discover')
  discover(@Req() req: Request) {
    return this.courses.listPublished(req.supabase!);
  }

  @Get()
  list(@Req() req: Request, @Query('orgId') orgId: string) {
    if (!orgId) throw new BadRequestException('orgId query required');
    return this.courses.list(req.supabase!, orgId);
  }

  @Get(':id')
  get(@Req() req: Request, @Param('id') id: string) {
    return this.courses.get(req.supabase!, id);
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateCourseDto) {
    const access = await this.adminService.getCourseCreationAccess(req.userId, req.userEmail);
    return this.courses.create(access.useServiceRole ? this.supabaseService.createServiceClient() : req.supabase!, dto);
  }

  @Patch(':id')
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.courses.update(req.supabase!, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.courses.remove(req.supabase!, id);
  }
}
