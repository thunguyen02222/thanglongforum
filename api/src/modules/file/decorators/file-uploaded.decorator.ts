import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const FileUploaded = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.file;
});

export const FilesUploaded = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.files;
});

