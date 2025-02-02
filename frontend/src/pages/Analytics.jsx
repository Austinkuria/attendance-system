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
  const [trends, setTrends] = useState({ labels: [], data: [] });
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [loading, setLoading] = useState({ units: true, trends: false });

  // Fetch lecturer's units
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const unitsData = await getLecturerUnits();
        setUnits(unitsData);
        if(unitsData.length > 0) setSelectedUnit(unitsData[0].id);
      } catch (error) {
        console.error('Failed to fetch units:', error);
      } finally {
        setLoading(prev => ({ ...prev, units: false }));
      }
    };
    
    fetchUnits();
  }, []);

  // Fetch attendance trends
  useEffect(() => {
    let isMounted = true;
    const fetchTrends = async () => {
      if(!selectedUnit) return;
      
      try {
        setLoading(prev => ({ ...prev, trends: true }));
        const trendsRes = await getAttendanceTrends(selectedUnit);
        if(isMounted) setTrends(trendsRes);
      } catch (error) {
        console.error('Failed to fetch trends:', error);
      } finally {
        if(isMounted) setLoading(prev => ({ ...prev, trends: false }));
      }
    };

    fetchTrends();
    return () => { isMounted = false };
  }, [selectedUnit]);

  const chartData = {
    labels: trends.labels,
    datasets: [
      {
        label: 'Attendance Rate (%)',
        data: trends.data,
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
        intersect: false
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: value => `${value}%`
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
          disabled={loading.units}
        >
          {units.map(unit => (
            <Option key={unit.id} value={unit.id}>
              {unit.name}
            </Option>
          ))}
        </Select>
      }
    >
      <Spin spinning={loading.trends} tip="Loading trends...">
        <div style={{ height: screens.md ? 400 : 300, position: 'relative' }}>
          <Line data={chartData} options={options} />
        </div>
      </Spin>
    </Card>
  );
};

export default Analytics;