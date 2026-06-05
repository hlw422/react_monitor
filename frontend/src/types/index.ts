// User and Auth types
export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

export type Permission = 
  | 'dashboard:read'
  | 'server:read'
  | 'server:write'
  | 'metric:read'
  | 'alert:read'
  | 'alert:write'
  | 'log:read'
  | 'user:read'
  | 'user:write'
  | 'role:read'
  | 'role:write'
  | 'setting:read'
  | 'setting:write';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Server types
export interface Server {
  id: string;
  hostname: string;
  ip: string;
  os: string;
  status: 'online' | 'offline';
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  tags: string[];
  lastHeartbeat: string;
  createdAt: string;
  updatedAt: string;
}

// Metric types
export type MetricType = 'cpu' | 'memory' | 'disk' | 'network';

export interface Metric {
  id: string;
  serverId: string;
  metricType: MetricType;
  value: number;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface MetricTimeSeries {
  timestamps: string[];
  values: number[];
}

// Alert types
export type AlertLevel = 'info' | 'warning' | 'error' | 'critical';
export type AlertStatus = 'pending' | 'acknowledged' | 'resolved' | 'silenced';

export interface AlertRule {
  id: string;
  name: string;
  metricType: MetricType;
  condition: '>' | '<' | '=' | '>=' | '<=';
  threshold: number;
  level: AlertLevel;
  enabled: boolean;
  serverId?: string;
  server?: { id: string; hostname: string; ip: string };
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  serverId: string;
  ruleId: string;
  level: AlertLevel;
  message: string;
  status: AlertStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  server?: { id: string; hostname: string; ip: string };
  rule?: { id: string; name: string };
  createdAt: string;
}

// Log types
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface Log {
  id: string;
  serverId: string;
  level: LogLevel;
  source: string;
  message: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

// Notification types
export type NotificationChannel = 'email' | 'webhook' | 'wechat' | 'dingtalk';

export interface NotificationConfig {
  id: string;
  channel: NotificationChannel;
  name: string;
  config: Record<string, any>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  alertId: string;
  channel: NotificationChannel;
  status: 'sent' | 'failed' | 'pending';
  sentAt?: string;
  error?: string;
  createdAt: string;
}

// Dashboard types
export interface DashboardStats {
  totalServers: number;
  onlineServers: number;
  avgCpuUsage: number;
  avgMemoryUsage: number;
  avgDiskUsage: number;
  totalNetworkIn: number;
  totalNetworkOut: number;
  activeAlerts: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Socket events
export interface SocketEvents {
  'metrics:update': (data: { serverId: string; metrics: Metric[] }) => void;
  'alert:new': (data: Alert) => void;
  'alert:resolved': (data: { alertId: string }) => void;
  'server:status': (data: { serverId: string; status: 'online' | 'offline' }) => void;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Chart types
export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
}
