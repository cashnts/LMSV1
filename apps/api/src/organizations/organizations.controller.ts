import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseService } from '../supabase/supabase.service';
import { AdminService } from '../admin/admin.service';
import { CreateOrgDto } from './dto/create-org.dto';

@Controller(['organization', 'organizations'])
@UseGuards(SupabaseAuthGuard)
export class OrganizationsController {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly adminService: AdminService,
  ) {}

  @Get()
  async list(@Req() req: Request) {
    const supabase = this.supabaseService.createServiceClient();

    const { data, error } = await supabase
      .from('organization_members')
      .select('role, organizations (id, name, subscription_status, created_at)')
      .eq('user_id', req.userId!);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row: any) => ({
      id: row.organizations?.id,
      name: row.organizations?.name,
      subscription_status: row.organizations?.subscription_status,
      created_at: row.organizations?.created_at,
      role: row.role,
    }));
  }

  @Post()
  async create(@Req() req: Request, @Body() body: CreateOrgDto) {
    await this.adminService.assertCanCreateOrganization(req.userId, req.userEmail);
    const supabase = this.supabaseService.createServiceClient();

    const { data: org, error: e1 } = await supabase
      .from('organizations')
      .insert({ name: body.name })
      .select()
      .single();
    if (e1) throw new Error(e1.message);

    const { error: e2 } = await supabase.from('organization_members').insert({
      user_id: req.userId!,
      org_id: org.id,
      role: 'owner',
    });
    if (e2) throw new Error(e2.message);
    return org;
  }
}
