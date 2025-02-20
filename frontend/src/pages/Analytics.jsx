import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { Select, Card, Spin, Typography, Grid } from "antd";
import { getAttendanceTrends, getLecturerUnits } from "../services/api";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Title: AntTitle } = Typography;

const Analytics = () => {
  const screens = useBreakpoint();
  const lecturerId = localStorage.getItem("userId"); // Ensure lecturerId is available
  const [trends, setTrends] = useState({ labels: [], data: [] });
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [loading, setLoading] = useState({ units: true, trends: false });

  // Fetch lecturer's units
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        if (!lecturerId) {
          console.error("No lecturer ID found in localStorage");
          return;
        }
        setLoading(prev => ({ ...prev, units: true }));
        const unitsData = await getLecturerUnits(lecturerId);
        if (unitsData.length > 0) {
          setUnits(unitsData);
          setSelectedUnit(unitsData[0]._id); // Use _id as per MongoDB convention
        } else {
          console.warn("No units returned for lecturer:", lecturerId);
          setUnits([]);
        }
      } catch (error) {
        console.error('Failed to fetch units:', error);
      } finally {
        setLoading(prev => ({ ...prev, units: false }));
      }
    };
    
    fetchUnits();
  }, [lecturerId]);

  // Fetch attendance trends when selectedUnit changes
  useEffect(() => {
    const fetchTrends = async () => {
      if (!selectedUnit) {
        setTrends({ labels: [], data: [] });
        return;
      }

      try {
        setLoading(prev => ({ ...prev, trends: true }));
        const trendsRes = await getAttendanceTrends(selectedUnit);
        // Validate response structure
        if (!trendsRes || !Array.isArray(trendsRes.labels) || !Array.isArray(trendsRes.data)) {
          throw new Error("Invalid trends data format received");
        }
        setTrends({
          labels: trendsRes.labels,
          data: trendsRes.data
        });
      } catch (error) {
        console.error('Failed to fetch trends:', error);
        setTrends({ labels: [], data: [] }); // Fallback to empty chart
      } finally {
        setLoading(prev => ({ ...prev, trends: false }));
      }
    };

    fetchTrends();
  }, [selectedUnit]);

  const chartData = {
    labels: trends.labels.length ? trends.labels : ['No Data'],
    datasets: [
      {
        label: 'Attendance Rate (%)',
        data: trends.data.length ? trends.data : [0],
        borderColor: '#1890ff',
        backgroundColor: 'rgba(24, 144, 255, 0.2)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Attendance Trend Over Time',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y}%`
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Attendance Rate (%)'
        },
        ticks: {
          callback: value => `${value}%`
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    },
    maintainAspectRatio: false
  };

  return (
    <Card 
      title={<AntTitle level={4} style={{ margin: 0 }}>Attendance Analytics</AntTitle>}
      style={{ marginTop: 24 }}
      extra={
        <Select
          placeholder="Select Unit"
          style={{ width: screens.md ? 240 : 180 }}
          onChange={setSelectedUnit}
          value={selectedUnit}
          loading={loading.units}
          disabled={loading.units || units.length === 0}
        >
          {units.map(unit => (
            <Option key={unit._id} value={unit._id}>
              {unit.name}
            </Option>
          ))}
        </Select>
      }
    >
      <Spin spinning={loading.trends} tip="Loading trends...">
        <div style={{ height: screens.md ? 400 : 300, position: 'relative' }}>
          {trends.labels.length === 0 && !loading.trends ? (
            <Typography.Text type="secondary" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              No attendance data available for this unit.
            </Typography.Text>
          ) : (
            <Line data={chartData} options={options} />
          )}
        </div>
      </Spin>
    </Card>
  );
};

export default Analytics;