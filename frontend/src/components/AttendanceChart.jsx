import PropTypes from 'prop-types';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Title } from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Title);

const AttendanceChart = ({ data }) => {
  const totalPresent = data?.totalPresent || 0;
  const totalPossible = data?.totalPossible || 0;
  const overallRate = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;
  const weeklyTrends = data?.weeklyTrends || [];

  const chartData = {
    labels: weeklyTrends.length ? weeklyTrends.map(t => t.week) : ['No Data'],
    datasets: [
      {
        type: 'bar',
        label: 'Present',
        data: weeklyTrends.length ? weeklyTrends.map(t => t.present) : [0],
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        yAxisID: 'y-count',
      },
      {
        type: 'bar',
        label: 'Absent',
        data: weeklyTrends.length ? weeklyTrends.map(t => t.absent) : [0],
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        yAxisID: 'y-count',
      },
      {
        type: 'line',
        label: 'Attendance Rate (%)',
        data: weeklyTrends.length ? weeklyTrends.map(t => t.rate) : [0],
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
        text: `Overall Attendance: ${overallRate}% (Present: ${totalPresent} of ${totalPossible})`,
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
            if (dataset.label === 'Present') {
              return `${dataset.label}: ${context.raw} attendance records`;
            }
            return `${dataset.label}: ${context.raw} absences`;
          },
          footer: (tooltipItems) => {
            const index = tooltipItems[0].dataIndex;
            const week = weeklyTrends[index];
            if (!week) return '';

            const total = week.present + week.absent;
            return [
              `Sessions: ${week.sessionCount || 0}`,
              `Weekly attendance rate: ${week.rate}%`,
              `Total attendance records: ${total}`
            ];
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        title: { display: true, text: 'Week' },
        grid: { display: false },
      },
      'y-count': {
        stacked: true,
        position: 'left',
        beginAtZero: true,
        title: { display: true, text: 'Attendance Records' },
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
    weeklyTrends: PropTypes.arrayOf(PropTypes.shape({
      week: PropTypes.string,
      present: PropTypes.number,
      absent: PropTypes.number,
      rate: PropTypes.number,
      sessionCount: PropTypes.number,
    })),
  }),
};

AttendanceChart.defaultProps = {
  data: { totalPresent: 0, totalPossible: 0, weeklyTrends: [] },
};

export default AttendanceChart;