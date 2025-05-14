import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Filler,
  PieController,
  LineController
} from 'chart.js/auto';
import { Chart } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  PieController,
  LineController,
  Title,
  Filler
);

// Chart component wrapper to handle cleanup
export const ChartWrapper = ({ type, data, options }) => {
  const chartRef = React.useRef(null);

  React.useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  return (
    <Box sx={{ height: 300, position: 'relative' }}>
      <Chart
        ref={chartRef}
        type={type}
        data={data}
        options={{
          ...options,
          responsive: true,
          maintainAspectRatio: false
        }}
      />
    </Box>
  );
};

// Error Boundary Component
export class VisualizationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Visualization error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="error" gutterBottom>
            Error loading visualization
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {this.state.error?.message || 'An unexpected error occurred'}
          </Typography>
        </Paper>
      );
    }

    return this.props.children;
  }
} 