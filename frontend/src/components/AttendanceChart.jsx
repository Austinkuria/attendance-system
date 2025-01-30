import PropTypes from 'prop-types';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';

// Register necessary components for Bar chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

const AttendanceChart = ({ data }) => {
  // Default to zero values if no data
  const { present = 0, absent = 0 } = data || {};

  // Chart data and options
  const chartData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        label: 'Number of Students',
        data: [present, absent],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        },
        title: {
          display: true,
          text: 'Percentage of Students'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Attendance Status'
        }
      }
    }
  };

  return (
    <div className="attendance-chart">
      <h5>Attendance Overview</h5>
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
  data: null,
};

export default AttendanceChart;