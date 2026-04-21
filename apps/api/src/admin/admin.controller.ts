import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { AdminService } from './admin.service';
import { CreateAdminMemberDto } from './dto/create-admin-member.dto';
import { UpdateCreationSettingsDto } from './dto/update-creation-settings.dto';

@Controller('admin')
@UseGuards(SupabaseAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('settings')
  async settings(@Req() req: Request) {
    return this.adminService.getSettingsSummary(req.userId, req.userEmail);
  }

  @Patch('settings')
  async updateSettings(@Req() req: Request, @Body() body: UpdateCreationSettingsDto) {
    await this.adminService.assertAppAdmin(req.userId, req.userEmail);
    return this.adminService.updateCreationSettings(body);
  }

  @Post('bootstrap/claim')
  async claimInitialAdmin(@Req() req: Request) {
    return this.adminService.claimInitialAdmin(req.userId, req.userEmail);
  }

  @Post('admins')
  async addAdmin(@Req() req: Request, @Body() body: CreateAdminMemberDto) {
    await this.adminService.assertAppAdmin(req.userId, req.userEmail);
    return this.adminService.addAdminMember(body, req.userId, req.userEmail);
  }

  @Delete('admins/:adminId')
  async removeAdmin(@Req() req: Request, @Param('adminId', ParseIntPipe) adminId: number) {
    await this.adminService.assertAppAdmin(req.userId, req.userEmail);
    await this.adminService.removeAdminMember(adminId);
    return { success: true };
  }

  @Get('organizations')
  async organizations(@Req() req: Request) {
    await this.adminService.assertAppAdmin(req.userId, req.userEmail);
    return this.adminService.listOrganizations();
  }
}
