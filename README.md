# 🖥️ Enterprise Monitoring Platform

A production-grade real-time monitoring dashboard built with React, NestJS, PostgreSQL, and Socket.io. Features real system metrics collection using `systeminformation`.

![Dashboard](https://img.shields.io/badge/Status-Active-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

### 📊 Real-time Monitoring
- **Real System Metrics**: CPU, Memory, Disk, Network - collected from actual system using `systeminformation`
- **Live Updates**: WebSocket-based real-time data streaming
- **Historical Data**: Time-series data storage with configurable retention

### 🖥️ Dashboard & Visualization
- **Overview Dashboard**: At-a-glance system health with key metrics
- **Big Screen Mode**: Full-screen monitoring for NOC displays
- **Interactive Charts**: ECharts-powered visualizations
- **Dark Theme**: Beautiful glassmorphism UI design

### 🔔 Alert System
- **Configurable Thresholds**: Set custom alert rules per metric
- **Multiple Severity Levels**: Info, Warning, Error, Critical
- **Real-time Notifications**: Instant WebSocket-based alerts

### 📝 Log Management
- **System Log Collection**: Automatic log generation based on system state
- **Log Search**: Full-text search with filtering
- **Export**: CSV and JSON export support

### 🔐 Security
- **JWT Authentication**: Secure token-based auth
- **RBAC**: Role-based access control (Admin, Operator, Developer, Guest)
- **Password Hashing**: bcrypt for secure password storage

## 🛠️ Tech Stack

### Frontend
- **React 18** + TypeScript
- **Vite 5** - Fast HMR build tool
- **TailwindCSS 3** - Utility-first CSS
- **ECharts 6** - Data visualization
- **Zustand** - State management
- **React Query** - Server state management
- **Socket.io Client** - Real-time communication
- **React Router 7** - Client-side routing
- **i18next** - Internationalization (EN/CN)

### Backend
- **NestJS 11** - Progressive Node.js framework
- **PostgreSQL 16** - Relational database
- **Redis 7** - Caching & session store
- **TypeORM** - Database ORM
- **Socket.io** - WebSocket server
- **BullMQ** - Job queue
- **JWT** - Authentication
- **systeminformation** - Real system metrics collection
- **Swagger** - API documentation

### DevOps
- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy
- **GitHub Actions** - CI/CD (optional)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 16+
- Redis 7+
- Docker & Docker Compose (optional)

### Quick Start (Development)

1. **Clone the repository**
```bash
git clone https://github.com/hlw422/react_monitor.git
cd react_monitor
```

2. **Start Backend**
```bash
cd backend
npm install
npm run start:dev
```

3. **Start Frontend** (in a new terminal)
```bash
cd frontend
npm install
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:5178
- Backend API: http://localhost:4000/api
- Swagger Docs: http://localhost:4000/api/docs

### Docker Deployment

```bash
docker-compose up -d
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api

### Default Credentials
- **Username**: `admin`
- **Password**: `admin123`

## 📁 Project Structure

```
react_monitor/
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   │   ├── dashboard/ # Dashboard page
│   │   │   ├── bigscreen/ # Big screen mode
│   │   │   ├── servers/   # Server management
│   │   │   ├── metrics/   # Metrics view
│   │   │   ├── alerts/    # Alert management
│   │   │   ├── logs/      # Log viewer
│   │   │   └── settings/  # Settings
│   │   ├── hooks/         # Custom React hooks
│   │   ├── store/         # Zustand stores
│   │   ├── services/      # API services
│   │   ├── i18n/          # Internationalization
│   │   └── utils/         # Utility functions
│   └── ...
├── backend/               # NestJS backend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/      # Authentication
│   │   │   ├── server/    # Server management
│   │   │   ├── metric/    # Metrics collection
│   │   │   ├── alert/     # Alert system
│   │   │   ├── log/       # Log management
│   │   │   └── ws/        # WebSocket gateway
│   │   ├── common/        # Guards, decorators, pipes
│   │   ├── database/      # Entities & migrations
│   │   └── config/        # Configuration
│   └── ...
├── nginx/                 # Nginx configs
├── docker-compose.yml     # Development compose
├── docker-compose.prod.yml # Production compose
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Servers
- `GET /api/servers` - List all servers
- `POST /api/servers` - Add new server
- `GET /api/servers/:id` - Get server details
- `PATCH /api/servers/:id` - Update server
- `DELETE /api/servers/:id` - Delete server

### Metrics
- `GET /api/metrics` - Get metrics
- `GET /api/metrics/latest/:serverId` - Get latest metrics
- `GET /api/metrics/timeseries/:serverId/:type` - Get time-series data
- `POST /api/metrics/data-mode` - Switch real/simulated data

### Logs
- `GET /api/logs` - Get logs with filters
- `GET /api/logs/stats` - Get log statistics
- `GET /api/logs/recent` - Get recent logs
- `GET /api/logs/export/csv` - Export as CSV
- `GET /api/logs/export/json` - Export as JSON

### Alerts
- `GET /api/alerts` - Get alerts
- `GET /api/alerts/rules` - Get alert rules
- `POST /api/alerts/rules` - Create alert rule

## 📊 Real Data Collection

This platform uses `systeminformation` to collect real system metrics:

```typescript
import * as si from 'systeminformation';

// CPU Usage
const cpuLoad = await si.currentLoad();
console.log(`CPU: ${cpuLoad.currentLoad}%`);

// Memory Usage
const mem = await si.mem();
console.log(`Memory: ${(mem.used / mem.total * 100)}%`);

// Disk Usage
const fsSize = await si.fsSize();
console.log(`Disk: ${(fsSize[0].used / fsSize[0].size * 100)}%`);

// Network Traffic
const network = await si.networkStats();
console.log(`Network RX: ${network[0].rx_sec} bytes/s`);
```

### Data Mode Switching

```bash
# Switch to real data mode
curl -X POST http://localhost:4000/api/metrics/data-mode \
  -H "Content-Type: application/json" \
  -d '{"useRealData": true}'

# Switch to simulated data mode
curl -X POST http://localhost:4000/api/metrics/data-mode \
  -H "Content-Type: application/json" \
  -d '{"useRealData": false}'
```

## 🎨 Screenshots

- Dashboard with real-time metrics
- Big Screen mode for NOC
- Server management interface
- Log viewer with search and filters
- Alert configuration

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Backend framework
- [React](https://reactjs.org/) - Frontend library
- [ECharts](https://echarts.apache.org/) - Visualization library
- [systeminformation](https://github.com/sebhildebrandt/systeminformation) - System metrics
- [TailwindCSS](https://tailwindcss.com/) - CSS framework

---

**Made with ❤️ for DevOps monitoring**
