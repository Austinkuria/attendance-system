import { useState, useEffect } from 'react';
import { Card, Table, Typography } from 'antd';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { getFeedbackSummary } from '../services.api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);
const { Title } = Typography;

const AdminFeedback = () => {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await getFeedbackSummary();
        setSummary(data);
      } catch (error) {
        console.error('Error fetching feedback summary:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const columns = [
    { title: 'Session ID', dataIndex: 'sessionId', key: 'sessionId' },
    { title: 'Unit', dataIndex: 'unit', key: 'unit', render: (unit) => unit.name },
    { title: 'Avg Rating', dataIndex: 'averageRating', key: 'averageRating' },
    { title: 'Avg Pace', dataIndex: 'averagePace', key: 'averagePace' },
    { title: 'Avg Interactivity', dataIndex: 'averageInteractivity', key: 'averageInteractivity' },
    { title: 'Clarity (Yes)', dataIndex: 'clarityYes', key: 'clarityYes' },
    { title: 'Total Feedback', dataIndex: 'totalFeedback', key: 'totalFeedback' },
  ];

  const chartData = {
    labels: summary.map(s => s.unit.name),
    datasets: [
      {
        label: 'Average Rating',
        data: summary.map(s => s.averageRating),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Feedback Summary</Title>
      <Card style={{ marginBottom: '24px' }}>
        <Bar data={chartData} options={{ responsive: true, plugins: { title: { display: true, text: 'Feedback Ratings by Unit' } } }} />
      </Card>
      <Table
        columns={columns}
        dataSource={summary}
        rowKey="sessionId"
        loading={loading}
      />
    </div>
  );
};

export default AdminFeedback;