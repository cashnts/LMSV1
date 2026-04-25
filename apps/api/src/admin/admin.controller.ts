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

  @Get('ping')
  ping() {
    return { pong: true };
  }

  @Post('users/sync')
  async syncAllUsers(@Req() req: Request) {
    await this.adminService.assertAppAdmin(req.userId, req.userEmail);
    return this.adminService.syncAllUsers();
  }

  @Get('analytics')
  async getAnalytics(@Req() req: Request) {
    await this.adminService.assertAppAdmin(req.userId, req.userEmail);
    return this.adminService.getAnalytics();
  }

  @Get('profiles')
  async listProfiles(@Req() req: Request) {
    await this.adminService.assertAppAdmin(req.userId, req.userEmail);
    return this.adminService.listProfiles();
  }

  @Patch('profiles/:userId/role')
  async updateProfileRole(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Body('role') role: 'admin' | 'instructor' | 'student',
  ) {
    await this.adminService.assertAppAdmin(req.userId, req.userEmail);
    return this.adminService.updateProfileRole(userId, role);
  }

  @Post('profiles/:userId/suspend')
  async suspendUser(@Req() req: Request, @Param('userId') userId: string) {
    await this.adminService.assertAppAdmin(req.userId, req.userEmail);
    return this.adminService.suspendUser(userId);
  }

  @Post('profiles/:userId/unsuspend')
  async unsuspendUser(@Req() req: Request, @Param('userId') userId: string) {
    await this.adminService.assertAppAdmin(req.userId, req.userEmail);
    return this.adminService.unsuspendUser(userId);
  }

  @Delete('profiles/:userId')
  async deleteUser(@Req() req: Request, @Param('userId') userId: string) {
    await this.adminService.assertAppAdmin(req.userId, req.userEmail);
    return this.adminService.deleteUser(userId);
  }

  @Post('profiles/:userId/password-reset')
  async requestPasswordReset(@Req() req: Request, @Param('userId') userId: string) {
    await this.adminService.assertAppAdmin(req.userId, req.userEmail);
    return this.adminService.requestPasswordReset(userId);
  }
}
