import { useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/components/providers/SocketProvider';
import type { Metric, Alert, Server } from '@/types';

interface MetricsUpdate {
  serverId: string;
  metrics: Metric[];
  timestamp: string;
}

interface ServerStatusUpdate {
  serverId: string;
  status: 'online' | 'offline';
}

export function useSocketEvents() {
  const { socket, isConnected } = useSocket();
  const handlersRef = useRef<Map<string, Set<Function>>>(new Map());

  const on = useCallback((event: string, handler: Function) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set());
    }
    handlersRef.current.get(event)!.add(handler);

    return () => {
      handlersRef.current.get(event)?.delete(handler);
    };
  }, []);

  const off = useCallback((event: string, handler: Function) => {
    handlersRef.current.get(event)?.delete(handler);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleMetricsUpdate = (data: MetricsUpdate) => {
      handlersRef.current.get('metrics:update')?.forEach(handler => handler(data));
    };

    const handleAlertNew = (data: Alert) => {
      handlersRef.current.get('alert:new')?.forEach(handler => handler(data));
    };

    const handleServerStatus = (data: ServerStatusUpdate) => {
      handlersRef.current.get('server:status')?.forEach(handler => handler(data));
    };

    socket.on('metrics:update', handleMetricsUpdate);
    socket.on('alert:new', handleAlertNew);
    socket.on('server:status', handleServerStatus);

    return () => {
      socket.off('metrics:update', handleMetricsUpdate);
      socket.off('alert:new', handleAlertNew);
      socket.off('server:status', handleServerStatus);
    };
  }, [socket]);

  const joinServer = useCallback((serverId: string) => {
    socket?.emit('joinServer', serverId);
  }, [socket]);

  const leaveServer = useCallback((serverId: string) => {
    socket?.emit('leaveServer', serverId);
  }, [socket]);

  return {
    socket,
    isConnected,
    on,
    off,
    joinServer,
    leaveServer,
  };
}

export function useMetricsSocket(serverId?: string) {
  const { socket, isConnected, joinServer, leaveServer, on } = useSocketEvents();
  const metricsRef = useRef<Map<string, Metric[]>>(new Map());

  useEffect(() => {
    if (!serverId) return;

    joinServer(serverId);

    return () => {
      leaveServer(serverId);
    };
  }, [serverId, joinServer, leaveServer]);

  const onMetricsUpdate = useCallback((handler: (data: MetricsUpdate) => void) => {
    return on('metrics:update', handler);
  }, [on]);

  return {
    socket,
    isConnected,
    metrics: metricsRef.current,
    onMetricsUpdate,
  };
}

export function useAlertsSocket() {
  const { on } = useSocketEvents();

  const onNewAlert = useCallback((handler: (alert: Alert) => void) => {
    return on('alert:new', handler);
  }, [on]);

  return {
    onNewAlert,
  };
}

export function useServerStatusSocket() {
  const { on } = useSocketEvents();

  const onStatusChange = useCallback((handler: (data: ServerStatusUpdate) => void) => {
    return on('server:status', handler);
  }, [on]);

  return {
    onStatusChange,
  };
}
