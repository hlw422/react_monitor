import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import LoadingScreen from '@/components/common/LoadingScreen';

// Lazy load pages
const Login = lazy(() => import('@/pages/auth/Login'));
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));
const Servers = lazy(() => import('@/pages/servers/Servers'));
const ServerDetail = lazy(() => import('@/pages/servers/ServerDetail'));
const Metrics = lazy(() => import('@/pages/metrics/Metrics'));
const Alerts = lazy(() => import('@/pages/alerts/Alerts'));
const Logs = lazy(() => import('@/pages/logs/Logs'));
const BigScreen = lazy(() => import('@/pages/bigscreen/BigScreen'));
const Settings = lazy(() => import('@/pages/settings/Settings'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Suspense wrapper
const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingScreen />}>
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: (
          <SuspenseWrapper>
            <Login />
          </SuspenseWrapper>
        ),
      },
    ],
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: 'dashboard',
        element: (
          <SuspenseWrapper>
            <Dashboard />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'servers',
        element: (
          <SuspenseWrapper>
            <Servers />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'servers/:id',
        element: (
          <SuspenseWrapper>
            <ServerDetail />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'metrics',
        element: (
          <SuspenseWrapper>
            <Metrics />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'metrics/:serverId',
        element: (
          <SuspenseWrapper>
            <Metrics />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'alerts',
        element: (
          <SuspenseWrapper>
            <Alerts />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'logs',
        element: (
          <SuspenseWrapper>
            <Logs />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'bigscreen',
        element: (
          <SuspenseWrapper>
            <BigScreen />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'settings',
        element: (
          <SuspenseWrapper>
            <Settings />
          </SuspenseWrapper>
        ),
      },
    ],
  },
  {
    path: '*',
    element: (
      <SuspenseWrapper>
        <NotFound />
      </SuspenseWrapper>
    ),
  },
]);

export default router;
