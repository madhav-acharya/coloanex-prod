import { Module } from '@nestjs/common';
import { CloudinaryUploadsController } from './cloudinary-uploads.controller';
import { CloudinaryUploadsService } from './cloudinary-uploads.service';

@Module({
  controllers: [CloudinaryUploadsController],
  providers: [CloudinaryUploadsService],
  exports: [CloudinaryUploadsService],
})
export class CloudinaryUploadsModule {}
