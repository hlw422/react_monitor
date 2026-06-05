import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5178'],
    credentials: true,
  },
  namespace: '/',
})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, Socket> = new Map();

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake (optional for dev)
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      // TODO: Verify JWT token in production
      // For now, accept all connections (with or without token)
      this.connectedClients.set(client.id, client);
      console.log(`Client connected: ${client.id} (auth: ${token ? 'yes' : 'no'})`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinServer')
  handleJoinServer(@ConnectedSocket() client: Socket, @MessageBody() serverId: string) {
    client.join(`server:${serverId}`);
    return { event: 'joinedServer', data: { serverId } };
  }

  @SubscribeMessage('leaveServer')
  handleLeaveServer(@ConnectedSocket() client: Socket, @MessageBody() serverId: string) {
    client.leave(`server:${serverId}`);
    return { event: 'leftServer', data: { serverId } };
  }

  // Broadcast metrics update to all clients
  broadcastMetricsUpdate(serverId: string, metrics: any) {
    const payload = {
      serverId,
      metrics,
      timestamp: new Date().toISOString(),
    };
    // Send to room subscribers (for server detail views)
    this.server.to(`server:${serverId}`).emit('metrics:update', payload);
    // Also broadcast globally (for dashboard overview)
    this.server.emit('metrics:update', payload);
  }

  // Broadcast alert to all clients
  broadcastAlert(alert: any) {
    this.server.emit('alert:new', alert);
  }

  // Broadcast server status change
  broadcastServerStatus(serverId: string, status: 'online' | 'offline') {
    this.server.emit('server:status', { serverId, status });
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }
}
