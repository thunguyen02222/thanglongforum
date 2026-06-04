import { BadRequestException } from '@nestjs/common';

export class InvalidImageException extends BadRequestException {
  constructor(msg: string | object = 'Invalid image') {
    super(msg);
  }
}

