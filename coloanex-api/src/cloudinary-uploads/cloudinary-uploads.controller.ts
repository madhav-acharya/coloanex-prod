import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryUploadsService } from './cloudinary-uploads.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UploadFileDto, UploadFilesDto } from './dto/upload.dto';
import type { CloudinaryUploadResult } from './interfaces/upload.interface';

@Controller('cloudinary-uploads')
@UseGuards(JwtAuthGuard)
export class CloudinaryUploadsController {
  constructor(private readonly cloudinaryService: CloudinaryUploadsService) {}

  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadFileDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.cloudinaryService.uploadFile(file, {
      folder: uploadDto.folder || 'coloanex',
      fileType: uploadDto.fileType || 'image',
      maxSizeInMB: uploadDto.maxSizeInMB || 5,
    });

    const data: CloudinaryUploadResult = {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    };

    return {
      success: true,
      data,
    };
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() uploadDto: UploadFilesDto,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const results = await this.cloudinaryService.uploadFiles(files, {
      folder: uploadDto.folder || 'coloanex',
      fileType: uploadDto.fileType || 'image',
      maxSizeInMB: uploadDto.maxSizeInMB || 5,
      maxFiles: uploadDto.maxFiles || 10,
    });

    const data: CloudinaryUploadResult[] = results.map((result) => ({
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    }));

    return {
      success: true,
      data,
    };
  }
}
