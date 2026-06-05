# Enterprise Monitoring Platform

A production-grade real-time monitoring dashboard built with React, NestJS, PostgreSQL, and Socket.io.

## Features

- **Real-time Monitoring**: CPU, Memory, Disk, Network metrics
- **Alert System**: Configurable thresholds with multiple notification channels
- **Dashboard**: Customizable overview with charts and statistics
- **Server Management**: Track and manage multiple servers
- **Log Center**: Search and analyze system logs
- **Data Visualization**: Interactive charts with ECharts
- **RBAC**: Role-based access control
- **Dark Mode**: Beautiful dark theme with glassmorphism effects

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite 5
- TailwindCSS 3
- ECharts 5
- Zustand (State Management)
- React Query (Data Fetching)
- Socket.io Client

### Backend
- NestJS 10
- PostgreSQL 16
- Redis 7
- Socket.io
- BullMQ
- JWT Authentication

## Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 16+
- Redis 7+

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/monitoring-platform.git
cd monitoring-platform
```

2. Install dependencies
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

3. Start with Docker Compose
```bash
docker-compose up -d
```

4. Access the application
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api

### Default Credentials
- Username: admin
- Password: admin123

## Project Structure

```
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── services/
│   │   └── utils/
│   └── ...
├── backend/           # NestJS backend
│   ├── src/
│   │   ├── modules/
│   │   ├── common/
│   │   ├── database/
│   │   └── config/
│   └── ...
├── nginx/             # Nginx configuration
└── docker-compose.yml
```

## License

MIT
