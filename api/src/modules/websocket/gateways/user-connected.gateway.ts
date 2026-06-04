import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketUserService } from '../services/socket-user.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true
  }
})
export class UserConnectedGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly socketUserService: SocketUserService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.socketUserService.removeUser(client.id);
  }

  @SubscribeMessage('user:online')
  handleUserOnline(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket
  ) {
    this.socketUserService.addUser(data.userId, client.id);
    client.join(`user:${data.userId}`);
    console.log(`User ${data.userId} is online`);
  }

  @SubscribeMessage('user:offline')
  handleUserOffline(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket
  ) {
    this.socketUserService.removeUser(client.id);
    client.leave(`user:${data.userId}`);
    console.log(`User ${data.userId} is offline`);
  }

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToAll(event: string, data: any) {
    this.server.emit(event, data);
  }
}

