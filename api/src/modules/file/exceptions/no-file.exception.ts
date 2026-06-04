import { BadRequestException } from '@nestjs/common';

export class NoFileException extends BadRequestException {
  constructor() {
    super('No file');
  }
}

