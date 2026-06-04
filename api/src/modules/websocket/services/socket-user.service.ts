import { Injectable } from '@nestjs/common';

@Injectable()
export class SocketUserService {
  private userSocketMap: Map<string, string> = new Map(); // userId -> socketId
  private socketUserMap: Map<string, string> = new Map(); // socketId -> userId

  addUser(userId: string, socketId: string) {
    this.userSocketMap.set(userId, socketId);
    this.socketUserMap.set(socketId, userId);
  }

  removeUser(socketId: string) {
    const userId = this.socketUserMap.get(socketId);
    if (userId) {
      this.userSocketMap.delete(userId);
    }
    this.socketUserMap.delete(socketId);
  }

  getSocketId(userId: string): string | undefined {
    return this.userSocketMap.get(userId);
  }

  getUserId(socketId: string): string | undefined {
    return this.socketUserMap.get(socketId);
  }

  isUserOnline(userId: string): boolean {
    return this.userSocketMap.has(userId);
  }

  getOnlineUsers(): string[] {
    return Array.from(this.userSocketMap.keys());
  }
}

