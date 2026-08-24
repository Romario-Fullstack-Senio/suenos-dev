import { Controller, Post, Get, Body, Param, Res, UseGuards, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { SubirVideoUseCase } from '../application/subir-video.use-case';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import * as fs from 'fs';
import * as path from 'path';

@Controller('videos')
export class VideoController {
  private readonly hlsDir = path.join(process.cwd(), 'temp-videos', 'hls');

  constructor(private readonly subirVideoUseCase: SubirVideoUseCase) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor', 'admin')
  async upload(@Body() body: { file: string; leccionId: string }) {
    const buffer = Buffer.from(body.file, 'base64');
    const url = await this.subirVideoUseCase.execute(buffer, body.leccionId);
    return { url };
  }

  @Get('hls/:videoId/:filename')
  async serveHls(
    @Param('videoId') videoId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath = path.join(this.hlsDir, videoId, filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Video segment not found');
    }

    const ext = path.extname(filename);
    const mimeTypes: Record<string, string> = {
      '.m3u8': 'application/vnd.apple.mpegurl',
      '.ts': 'video/mp2t',
    };

    res.set({
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }
}
