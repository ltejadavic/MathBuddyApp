import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { SendMessageDto } from './dto/chat.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  // Using a map to track user online presence
  private userSockets = new Map<string, string[]>();

  handleConnection(client: Socket) {
    // Initial connection accepted. Real authentication happens via WsJwtGuard on specific messages,
    // or by forcing a 'connect_auth' event. For simplicity, we just log connections.
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Remove the socket id from our presence map
    if (client.data?.user?.id) {
      const userId = client.data.user.id;
      const sockets = this.userSockets.get(userId) || [];
      const updatedSockets = sockets.filter((id) => id !== client.id);

      if (updatedSockets.length === 0) {
        this.userSockets.delete(userId);
        // Broadcast offline status if needed
        this.server.emit('presence_update', { userId, status: 'OFFLINE' });
      } else {
        this.userSockets.set(userId, updatedSockets);
      }
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('authenticate')
  handleAuthenticate(@ConnectedSocket() client: Socket) {
    // Client sends this with JWT to bind their user ID to the socket
    const userId = client.data.user.id;

    const sockets = this.userSockets.get(userId) || [];
    if (!sockets.includes(client.id)) {
      sockets.push(client.id);
      this.userSockets.set(userId, sockets);
    }

    // Broadcast online status
    this.server.emit('presence_update', { userId, status: 'ONLINE' });

    return { status: 'authenticated', userId };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join_thread')
  async handleJoinThread(
    @ConnectedSocket() client: Socket,
    @MessageBody() threadId: string,
  ) {
    client.join(threadId);
    return { status: 'joined', threadId };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessageDto,
  ) {
    const userId = client.data.user.id;

    // Save message to DB
    const message = await this.chatService.saveMessage(userId, payload);

    // Broadcast to everyone in the thread (including sender)
    this.server.to(payload.threadId).emit('new_message', message);

    return { status: 'sent', message };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string; isTyping: boolean },
  ) {
    const userId = client.data.user.id;

    // Broadcast to everyone else in the thread
    client.to(data.threadId).emit('user_typing', {
      threadId: data.threadId,
      userId,
      isTyping: data.isTyping,
    });
  }
}
