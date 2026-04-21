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
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CreateAssetDto } from './dto/create-asset.dto';

@Controller('lessons')
@UseGuards(SupabaseAuthGuard)
export class LessonsController {
  constructor(private readonly lessons: LessonsService) {}

  @Get()
  list(@Req() req: Request, @Query('courseId') courseId: string) {
    if (!courseId) throw new BadRequestException('courseId query required');
    return this.lessons.list(req.supabase!, courseId);
  }

  @Get(':id/assets')
  listAssets(@Req() req: Request, @Param('id') id: string) {
    return this.lessons.listAssets(req.supabase!, id);
  }

  @Post(':id/assets/upload')
  signedUpload(@Req() req: Request, @Param('id') id: string, @Body() dto: CreateAssetDto) {
    return this.lessons.createSignedUpload(req.supabase!, id, dto);
  }

  @Delete('assets/:assetId')
  deleteAsset(@Req() req: Request, @Param('assetId') assetId: string) {
    return this.lessons.deleteAsset(req.supabase!, assetId);
  }

  @Get(':id')
  get(@Req() req: Request, @Param('id') id: string) {
    return this.lessons.get(req.supabase!, id);
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateLessonDto) {
    return this.lessons.create(req.supabase!, dto);
  }

  @Patch(':id')
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateLessonDto) {
    return this.lessons.update(req.supabase!, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.lessons.remove(req.supabase!, id);
  }
}
