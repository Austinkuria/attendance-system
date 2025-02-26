
import { useState, useEffect } from 'react';
import { Card, Table, Typography } from 'antd';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { getFeedbackSummary } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);
const { Title } = Typography;

const AdminFeedbackView = () => {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await getFeedbackSummary();
        console.log('Feedback summary data:', data); // Debug log
        setSummary(data || []); // Default to empty array if data is null
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
    { 
      title: 'Unit', 
      dataIndex: 'unit', 
      key: 'unit', 
      render: (unit) => unit || 'N/A' // Safe rendering
    },
    { 
      title: 'Course', 
      dataIndex: 'course', 
      key: 'course', 
      render: (course) => course || 'N/A' // Safe rendering
    },
    { 
      title: 'Avg Rating', 
      dataIndex: 'averageRating', 
      key: 'averageRating', 
      render: (val) => val?.toFixed(2) || 'N/A' 
    },
    { 
      title: 'Avg Pace', 
      dataIndex: 'averagePace', 
      key: 'averagePace', 
      render: (val) => val?.toFixed(2) || 'N/A' 
    },
    { 
      title: 'Avg Interactivity', 
      dataIndex: 'averageInteractivity', 
      key: 'averageInteractivity', 
      render: (val) => val?.toFixed(2) || 'N/A' 
    },
    { title: 'Clarity (Yes)', dataIndex: 'clarityYes', key: 'clarityYes' },
    { title: 'Total Feedback', dataIndex: 'totalFeedback', key: 'totalFeedback' },
  ];

  const chartData = {
    labels: summary.map(s => `${s.unit || 'Unknown Unit'} (${s.course || 'Unknown Course'})`), // Safe fallback
    datasets: [
      {
        label: 'Average Rating',
        data: summary.map(s => s.averageRating || 0), // Default to 0 if undefined
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Average Interactivity',
        data: summary.map(s => s.averageInteractivity || 0), // Default to 0 if undefined
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Feedback Ratings by Unit and Course' },
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.raw === 0 && !summary[context.dataIndex][context.dataset.label.toLowerCase().replace(' ', '')] ? 'N/A' : context.raw}`
        }
      }
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Feedback Summary</Title>
      <Card style={{ marginBottom: '24px' }}>
        <Bar data={chartData} options={chartOptions} />
      </Card>
      <Table
        columns={columns}
        dataSource={summary}
        rowKey="sessionId"
        loading={loading}
        locale={{ emptyText: 'No feedback summary available' }} // Custom empty message
      />
    </div>
  );
};

export default AdminFeedbackView;