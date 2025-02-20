import PropTypes from 'prop-types';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const AttendanceChart = ({ data }) => {
  const chartData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        label: 'Sessions',
        data: [data?.present || 0, data?.absent || 0],
        backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'],
        borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: { label: (context) => `${context.dataset.label}: ${context.raw} sessions` }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Number of Sessions' },
        ticks: { stepSize: 1 }
      },
      x: { title: { display: true, text: 'Attendance Status' } }
    }
  };

  return (
    <div className="attendance-chart">
      <h4 className="mb-4">Attendance Distribution</h4>
      <div style={{ height: '400px' }}>
        <Bar data={chartData} options={options} />
      </div>
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