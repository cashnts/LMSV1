import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';
import { SupabaseModule } from './supabase/supabase.module';
import { SupabaseAuthGuard } from './auth/supabase-auth.guard';
import { OrganizationsModule } from './organizations/organizations.module';
import { CoursesModule } from './courses/courses.module';
import { LessonsModule } from './lessons/lessons.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ProgressModule } from './progress/progress.module';
import { BillingModule } from './billing/billing.module';
import { AdminModule } from './admin/admin.module';
import { CertificatesModule } from './certificates/certificates.module';
import { CommentsModule } from './comments/comments.module';
import { BunnyModule } from './bunny/bunny.module';
import { LoggerMiddleware } from './logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    OrganizationsModule,
    CoursesModule,
    LessonsModule,
    EnrollmentsModule,
    ProgressModule,
    BillingModule,
    AdminModule,
    CertificatesModule,
    CommentsModule,
    BunnyModule,
  ],
  controllers: [HealthController],
  providers: [SupabaseAuthGuard],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
