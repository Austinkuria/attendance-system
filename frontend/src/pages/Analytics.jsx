// src/pages/Analytics.jsx
import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { getAttendanceTrends } from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Spin } from 'antd';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const [trends, setTrends] = useState({ labels: [], data: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const trendsRes = await getAttendanceTrends();
        setTrends(trendsRes);
      } catch  {
        console.error('Failed to fetch attendance trends');
        
        // Optionally handle errors here
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const data = {
    labels: trends.labels,
    datasets: [
      {
        label: "Attendance Rate",
        data: trends.data,
        fill: false,
        borderColor: "rgba(75,192,192,1)",
      },
    ],
  };

  return (
    <div className="p-4">
      <h2>Attendance Trends</h2>
      {loading ? <Spin /> : <Line data={data} />}
    </div>
  );
};

export default Analytics;
