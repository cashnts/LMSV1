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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { ReorderLessonsDto } from './dto/reorder-lessons.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { AddAssetUrlDto } from './dto/add-asset-url.dto';

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
  uploadIntent(@Req() req: Request, @Param('id') id: string, @Body() dto: CreateAssetDto) {
    return this.lessons.createUploadIntent(req.supabase!, id, dto);
  }

  @Post(':id/assets/url')
  addAssetUrl(@Req() req: Request, @Param('id') id: string, @Body() dto: AddAssetUrlDto) {
    return this.lessons.addAssetUrl(req.supabase!, id, dto);
  }

  // Receives file from browser and proxies it to Bunny Storage (images/files)
  @Post('assets/:assetId/upload-file')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } }))
  uploadFileToBunny(
    @Req() req: Request,
    @Param('assetId') assetId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('file field required');
    return this.lessons.uploadFileToBunny(req.supabase!, assetId, file);
  }

  @Patch('assets/:assetId')
  confirmAsset(
    @Req() req: Request,
    @Param('assetId') assetId: string,
    @Body() body: { bytes: number },
  ) {
    if (typeof body.bytes !== 'number') throw new BadRequestException('bytes required');
    return this.lessons.confirmAssetUpload(req.supabase!, assetId, body.bytes);
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

  @Post('reorder')
  reorder(@Req() req: Request, @Body() dto: ReorderLessonsDto) {
    return this.lessons.reorder(req.supabase!, dto);
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
