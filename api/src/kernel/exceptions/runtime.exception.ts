import { HttpException, HttpStatus } from '@nestjs/common';

export class RuntimeException extends HttpException {
  constructor(message = 'Runtime error') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

