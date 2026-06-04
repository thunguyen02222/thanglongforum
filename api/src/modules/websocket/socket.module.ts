import { Module } from '@nestjs/common';
import { UserConnectedGateway } from './gateways/user-connected.gateway';
import { SocketUserService } from './services/socket-user.service';

@Module({
  providers: [UserConnectedGateway, SocketUserService],
  exports: [SocketUserService, UserConnectedGateway]
})
export class SocketModule {}

