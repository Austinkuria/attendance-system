// src/components/AttendanceChart.jsx
import PropTypes from 'prop-types';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title } from 'chart.js';

// Register components
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

const AttendanceChart = ({ data }) => {
  const present = data?.present || 0;
  const absent = data?.absent || 0;
  const total = present + absent;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

  // Chart data configuration
  const chartData = {
    labels: ['Attendance'],
    datasets: [
      {
        label: 'Present',
        data: [present],
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Absent',
        data: [absent],
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Chart options configuration
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 12 }, padding: 10 },
      },
      title: {
        display: true,
        text: `Attendance Rate: ${rate}% (Total: ${total} sessions)`,
        font: { size: 14 },
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.raw} sessions (${Math.round((context.raw / total) * 100) || 0}%)`,
          footer: () => `Total: ${total} sessions`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        title: { display: true, text: 'Course Attendance' },
        grid: { display: false },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        title: { display: true, text: 'Number of Sessions' },
        ticks: { stepSize: 1, padding: 10 },
        suggestedMax: total > 0 ? total + Math.ceil(total * 0.2) : 5,
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutBounce',
    },
  };

  return (
    <div className="attendance-chart" style={{ position: 'relative', height: '100%' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

AttendanceChart.propTypes = {
  data: PropTypes.shape({
    present: PropTypes.number,
    absent: PropTypes.number,
  }),
};

AttendanceChart.defaultProps = {
  data: { present: 0, absent: 0 },
};

export default AttendanceChart;