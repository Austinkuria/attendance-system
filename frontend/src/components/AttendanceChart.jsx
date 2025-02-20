// src/components/AttendanceChart.jsx
import PropTypes from 'prop-types';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Title } from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Title);

const AttendanceChart = ({ data }) => {
  const totalPresent = data?.totalPresent || 0;
  const totalPossible = data?.totalPossible || 0;
  const overallRate = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;
  const trends = data?.trends || [];

  const chartData = {
    labels: trends.length ? trends.map(t => t.date) : ['No Data'],
    datasets: [
      {
        type: 'bar',
        label: 'Present',
        data: trends.length ? trends.map(t => t.present) : [0],
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        yAxisID: 'y-count',
      },
      {
        type: 'bar',
        label: 'Absent',
        data: trends.length ? trends.map(t => t.absent) : [0],
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        yAxisID: 'y-count',
      },
      {
        type: 'line',
        label: 'Attendance Rate (%)',
        data: trends.length ? trends.map(t => t.rate) : [0],
        borderColor: '#1890ff',
        backgroundColor: 'rgba(24, 144, 255, 0.2)',
        fill: false,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y-rate',
      },
    ],
  };

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
        text: `Overall Attendance: ${overallRate}% (Present: ${totalPresent}/${totalPossible})`,
        font: { size: 14 },
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            const dataset = context.dataset;
            if (dataset.type === 'line') {
              return `${dataset.label}: ${context.raw}%`;
            }
            return `${dataset.label}: ${context.raw} students`;
          },
          footer: (tooltipItems) => {
            const index = tooltipItems[0].dataIndex;
            const total = trends[index]?.present + trends[index]?.absent || 0;
            return `Total Possible: ${total}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        title: { display: true, text: 'Session Date' },
        grid: { display: false },
      },
      'y-count': {
        stacked: true,
        position: 'left',
        beginAtZero: true,
        title: { display: true, text: 'Student Attendances' },
        ticks: { stepSize: Math.ceil(totalPossible / 10) || 1, padding: 10 },
        suggestedMax: totalPossible > 0 ? totalPossible + Math.ceil(totalPossible * 0.2) : 5,
      },
      'y-rate': {
        position: 'right',
        min: 0,
        max: 100,
        title: { display: true, text: 'Attendance Rate (%)' },
        ticks: { callback: value => `${value}%`, padding: 10 },
        grid: { drawOnChartArea: false },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutBounce',
    },
  };

  return (
    <div className="attendance-chart" style={{ position: 'relative', height: '100%' }}>
      <Chart type="bar" data={chartData} options={options} />
    </div>
  );
};

AttendanceChart.propTypes = {
  data: PropTypes.shape({
    totalPresent: PropTypes.number,
    totalPossible: PropTypes.number,
    trends: PropTypes.arrayOf(PropTypes.shape({
      date: PropTypes.string,
      present: PropTypes.number,
      absent: PropTypes.number,
      rate: PropTypes.number,
    })),
  }),
};

AttendanceChart.defaultProps = {
  data: { totalPresent: 0, totalPossible: 0, trends: [] },
};

export default AttendanceChart;