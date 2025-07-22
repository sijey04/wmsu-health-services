import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Minimalistic shadcn/ui inspired color palette
const chartColors = {
  primary: '#0f172a',      // slate-900
  secondary: '#475569',    // slate-600
  accent: '#64748b',       // slate-500
  muted: '#94a3b8',        // slate-400
  border: '#e2e8f0',       // slate-200
  background: '#f8fafc',   // slate-50
  destructive: '#ef4444',  // red-500
  success: '#10b981',      // emerald-500
  warning: '#f59e0b',      // amber-500
  info: '#3b82f6',         // blue-500
};

// Chart options for consistent shadcn/ui styling
const getChartOptions = (title?: string) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        pointStyle: 'circle' as const,
        padding: 20,
        font: {
          size: 12,
          family: "'Inter', sans-serif",
        },
        color: chartColors.secondary,
      },
    },
    title: {
      display: !!title,
      text: title,
      font: {
        size: 16,
        weight: 'bold' as const,
        family: "'Inter', sans-serif",
      },
      color: chartColors.primary,
      padding: {
        bottom: 20,
      },
    },
    tooltip: {
      backgroundColor: chartColors.primary,
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: chartColors.border,
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
      titleFont: {
        size: 13,
        weight: 'bold' as const,
      },
      bodyFont: {
        size: 12,
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      border: {
        display: false,
      },
      ticks: {
        color: chartColors.muted,
        font: {
          size: 11,
          family: "'Inter', sans-serif",
        },
      },
    },
    y: {
      grid: {
        color: chartColors.border,
        borderDash: [2, 2],
      },
      border: {
        display: false,
      },
      ticks: {
        color: chartColors.muted,
        font: {
          size: 11,
          family: "'Inter', sans-serif",
        },
      },
    },
  },
});

interface ChartComponentProps {
  title?: string;
  className?: string;
}

interface BarChartProps extends ChartComponentProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string;
      borderColor?: string;
    }[];
  };
}

interface LineChartProps extends ChartComponentProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
    }[];
  };
}

interface PieChartProps extends ChartComponentProps {
  data: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor?: string[];
      borderColor?: string[];
    }[];
  };
}

export const BarChart: React.FC<BarChartProps> = ({ data, title, className = '' }) => {
  const chartData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || [
        chartColors.info,
        chartColors.success,
        chartColors.warning,
        chartColors.destructive,
      ][index % 4],
      borderColor: dataset.borderColor || 'transparent',
      borderWidth: 0,
      borderRadius: 6,
      borderSkipped: false,
    })),
  };

  return (
    <div className={`h-full ${className}`}>
      <Bar data={chartData} options={getChartOptions(title)} />
    </div>
  );
};

export const LineChart: React.FC<LineChartProps> = ({ data, title, className = '' }) => {
  const chartData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      borderColor: dataset.borderColor || [
        chartColors.info,
        chartColors.success,
        chartColors.warning,
        chartColors.destructive,
      ][index % 4],
      backgroundColor: dataset.backgroundColor || 'transparent',
      borderWidth: 2,
      pointBackgroundColor: dataset.borderColor || chartColors.info,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.3,
      fill: false,
    })),
  };

  return (
    <div className={`h-full ${className}`}>
      <Line data={chartData} options={getChartOptions(title)} />
    </div>
  );
};

export const PieChart: React.FC<PieChartProps> = ({ data, title, className = '' }) => {
  const chartData = {
    ...data,
    datasets: data.datasets.map((dataset) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || [
        chartColors.info,
        chartColors.success,
        chartColors.warning,
        chartColors.destructive,
        chartColors.accent,
        chartColors.muted,
      ],
      borderColor: '#ffffff',
      borderWidth: 2,
    })),
  };

  const options = {
    ...getChartOptions(title),
    plugins: {
      ...getChartOptions(title).plugins,
      legend: {
        ...getChartOptions(title).plugins?.legend,
        position: 'right' as const,
      },
    },
  };

  return (
    <div className={`h-full ${className}`}>
      <Pie data={chartData} options={options} />
    </div>
  );
};

export const DoughnutChart: React.FC<PieChartProps> = ({ data, title, className = '' }) => {
  const chartData = {
    ...data,
    datasets: data.datasets.map((dataset) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || [
        chartColors.info,
        chartColors.success,
        chartColors.warning,
        chartColors.destructive,
        chartColors.accent,
        chartColors.muted,
      ],
      borderColor: '#ffffff',
      borderWidth: 3,
      cutout: '65%',
    })),
  };

  const options = {
    ...getChartOptions(title),
    plugins: {
      ...getChartOptions(title).plugins,
      legend: {
        ...getChartOptions(title).plugins?.legend,
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div className={`h-full ${className}`}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

// Mini chart components for dashboard cards
export const MiniBarChart: React.FC<{ data: number[]; height?: number }> = ({ 
  data, 
  height = 40 
}) => {
  const chartData = {
    labels: data.map((_, i) => `${i + 1}`),
    datasets: [{
      data,
      backgroundColor: chartColors.info,
      borderRadius: 2,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    elements: {
      bar: { borderWidth: 0 },
    },
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export const MiniLineChart: React.FC<{ data: number[]; height?: number }> = ({ 
  data, 
  height = 40 
}) => {
  const chartData = {
    labels: data.map((_, i) => `${i + 1}`),
    datasets: [{
      data,
      borderColor: chartColors.success,
      backgroundColor: 'transparent',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.3,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Line data={chartData} options={options} />
    </div>
  );
};
