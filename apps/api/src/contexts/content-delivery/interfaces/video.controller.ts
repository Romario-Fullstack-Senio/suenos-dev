import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SubirVideoUseCase } from '../application/subir-video.use-case';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@Controller('videos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VideoController {
  constructor(private readonly subirVideoUseCase: SubirVideoUseCase) {}

  @Post('upload')
  @Roles('instructor', 'admin')
  async upload(@Body() body: { file: string; leccionId: string }) {
    const buffer = Buffer.from(body.file, 'base64');
    const url = await this.subirVideoUseCase.execute(buffer, body.leccionId);
    return { url };
  }
}
