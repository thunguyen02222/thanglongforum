import { HttpException, HttpStatus } from '@nestjs/common';

export class MissingServerConfigException extends HttpException {
  constructor(configName: string) {
    super(`Missing server configuration: ${configName}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

