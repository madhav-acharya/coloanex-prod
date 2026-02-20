import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { PrismaService } from '../prisma.service';
import { CloudinaryUploadsModule } from '../cloudinary-uploads/cloudinary-uploads.module';

@Module({
  imports: [CloudinaryUploadsModule],
  controllers: [ContractsController],
  providers: [ContractsService, PrismaService],
  exports: [ContractsService],
})
export class ContractsModule {}
