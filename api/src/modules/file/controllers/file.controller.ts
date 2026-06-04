import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  NotFoundException,
  UseGuards,
  UseInterceptors,
  BadRequestException
} from '@nestjs/common';
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
}

interface MulterRequest {
  file?: MulterFile;
}
import { DataResponse, getConfig } from 'src/kernel';
import { AuthGuard } from 'src/modules/auth/guards';
import { CurrentUser } from 'src/modules/auth/decorators';
import { FileService } from '../services/file.service';
import { UploadFileInterceptor } from '../interceptors';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    UploadFileInterceptor({
      destination: getConfig('file').uploadsDir,
      fieldName: 'file'
    })
  )
  async uploadFile(
    @Req() req: MulterRequest,
    @CurrentUser() user: any,
    @Query('type') type?: string
  ): Promise<DataResponse<any>> {
    if (!req.file) {
      throw new BadRequestException('No file uploaded');
    }

    const fileDto = await this.fileService.createFromMulter(type || 'image', req.file, {
      uploadedBy: user._id
    });

    return DataResponse.ok(fileDto.toPublicResponse());
  }

  @Post('upload/avatar')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    UploadFileInterceptor({
      destination: getConfig('file').avatarDir,
      fieldName: 'file'
    })
  )
  async uploadAvatar(@Req() req: MulterRequest, @CurrentUser() user: any): Promise<DataResponse<any>> {
    if (!req.file) {
      throw new BadRequestException('No file uploaded');
    }

    const fileDto = await this.fileService.createFromMulter('avatar', req.file, {
      uploadedBy: user._id
    });

    return DataResponse.ok(fileDto.toPublicResponse());
  }

  @Post('upload/inventory')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    UploadFileInterceptor({
      destination: getConfig('file').inventoryDir,
      fieldName: 'file'
    })
  )
  async uploadInventoryImage(
    @Req() req: MulterRequest,
    @CurrentUser() user: any
  ): Promise<DataResponse<any>> {
    if (!req.file) {
      throw new BadRequestException('No file uploaded');
    }

    const fileDto = await this.fileService.createFromMulter('inventory', req.file, {
      uploadedBy: user._id
    });

    return DataResponse.ok(fileDto.toPublicResponse());
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async getFileById(@Param('id') id: string): Promise<DataResponse<any>> {
    const fileDto = await this.fileService.findByIdAsFileDto(id);

    if (!fileDto) {
      throw new NotFoundException(`File not found with ID: ${id}`);
    }

    return DataResponse.ok(fileDto.toPublicResponse());
  }

  @Get(':id/info')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async getFileInfo(@Param('id') id: string): Promise<DataResponse<any>> {
    return this.getFileById(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteFile(@Param('id') id: string): Promise<DataResponse<{ success: boolean }>> {
    const success = await this.fileService.deleteFile(id);
    return DataResponse.ok({ success });
  }
}
