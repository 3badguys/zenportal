import {
  Controller, Get, Post, Delete, Param, UploadedFile, Res,
  UseGuards, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Response } from 'express';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { BackupService } from './backup.service';
import { AdminGuard } from '../../common/guards/admin.guard';

const uploadStorage = diskStorage({
  destination: os.tmpdir(),
  filename: (_req, _file, cb) => cb(null, `zenportal_restore_${randomUUID()}`),
});

@Controller('api/admin/backup')
@UseGuards(AdminGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('database')
  async downloadDatabase(@Res() res: Response) {
    const file = await this.backupService.createDatabaseBackup();
    res.download(file.path, file.filename);
  }

  @Get('media')
  async downloadMedia(@Res() res: Response) {
    const file = await this.backupService.createMediaBackup();
    res.download(file.path, file.filename);
  }

  @Get('list')
  list() {
    return this.backupService.listBackups();
  }

  @Get(':filename')
  downloadExisting(@Param('filename') filename: string, @Res() res: Response) {
    const file = this.backupService.resolveBackup(filename);
    res.download(file.path, file.filename);
  }

  @Delete(':filename')
  remove(@Param('filename') filename: string) {
    return this.backupService.removeBackup(filename);
  }
}

@Controller('api/admin/restore')
@UseGuards(AdminGuard)
export class RestoreController {
  constructor(private readonly backupService: BackupService) {}

  @Post('database')
  @UseInterceptors(FileInterceptor('file', { storage: uploadStorage, limits: { fileSize: 2 * 1024 * 1024 * 1024 } }))
  async restoreDatabase(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    try {
      const name = decodeFilename(file.originalname);
      if (path.extname(name).toLowerCase() !== '.sql') {
        throw new BadRequestException('Please upload a .sql file');
      }
      return await this.backupService.restoreDatabase(file.path);
    } finally {
      fs.rmSync(file.path, { force: true });
    }
  }

  @Post('media')
  @UseInterceptors(FileInterceptor('file', { storage: uploadStorage, limits: { fileSize: 2 * 1024 * 1024 * 1024 } }))
  async restoreMedia(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    try {
      const name = decodeFilename(file.originalname);
      if (!/\.tar\.gz$/i.test(name) && !/\.tgz$/i.test(name)) {
        throw new BadRequestException('Please upload a .tar.gz file');
      }
      return await this.backupService.restoreMedia(file.path);
    } finally {
      fs.rmSync(file.path, { force: true });
    }
  }
}

// multer/busboy encodes multipart filenames as latin1; decode to UTF-8
// only when the name actually contains high bytes
function decodeFilename(name: string): string {
  const hasHighByte = [...name].some((ch) => ch.charCodeAt(0) > 127);
  if (!hasHighByte) return name;
  try {
    const decoded = Buffer.from(name, 'latin1').toString('utf8');
    return decoded.includes('\uFFFD') ? name : decoded;
  } catch {
    return name;
  }
}
