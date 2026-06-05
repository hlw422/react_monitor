import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Server } from 'lucide-react';
import StatsCard from './StatsCard';

describe('StatsCard', () => {
  it('renders title and value', () => {
    render(
      <StatsCard
        title="Total Servers"
        value={24}
        icon={Server}
        color="blue"
      />
    );

    expect(screen.getByText('Total Servers')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(
      <StatsCard
        title="Online Servers"
        value={22}
        subtitle="of 24"
        icon={Server}
        color="green"
      />
    );

    expect(screen.getByText('of 24')).toBeInTheDocument();
  });

  it('renders trend when provided', () => {
    render(
      <StatsCard
        title="CPU Usage"
        value="45.2%"
        icon={Server}
        color="blue"
        trend={{ value: 5, isUp: true }}
      />
    );

    expect(screen.getByText('5%')).toBeInTheDocument();
  });

  it('renders progress bar when provided', () => {
    const { container } = render(
      <StatsCard
        title="Memory Usage"
        value="62.8%"
        icon={Server}
        color="purple"
        progress={62.8}
      />
    );

    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toBeInTheDocument();
  });
});
