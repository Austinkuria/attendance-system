import { useState, useEffect, useCallback } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Chart } from "react-chartjs-2";
import { Select, Card, Spin, Typography, Grid, Button } from "antd";
import { getAttendanceTrends, getLecturerUnits } from "../services/api";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Title: AntTitle, Text } = Typography;

const Analytics = () => {
  const screens = useBreakpoint();
  const lecturerId = localStorage.getItem("userId");
  const [trends, setTrends] = useState({ labels: [], present: [], absent: [], rates: [] });
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [loading, setLoading] = useState({ units: true, trends: false });
  const [error, setError] = useState(null);

  // Fetch lecturer's units
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        if (!lecturerId) {
          throw new Error("No lecturer ID found in localStorage. Please log in.");
        }
        setLoading(prev => ({ ...prev, units: true }));
        setError(null);
        console.log('Fetching units for lecturer:', lecturerId); // Debug log
        const unitsData = await getLecturerUnits(lecturerId);
        console.log('Units received:', unitsData); // Debug log
        if (!Array.isArray(unitsData)) {
          throw new Error("Invalid units data format received");
        }
        if (unitsData.length > 0) {
          setUnits(unitsData);
          setSelectedUnit(unitsData[0]._id);
        } else {
          console.warn("No units returned for lecturer:", lecturerId);
          setUnits([]);
          setError("No units found for this lecturer");
        }
      } catch (error) {
        console.error('Failed to fetch units:', error);
        setError(error.message || "Failed to load units");
        setUnits([]);
      } finally {
        setLoading(prev => ({ ...prev, units: false }));
      }
    };
    
    fetchUnits();
  }, [lecturerId]);

  // Memoized fetchTrends
  const fetchTrends = useCallback(async () => {
    if (!selectedUnit) {
      setTrends({ labels: [], present: [], absent: [], rates: [] });
      setError("Please select a unit");
      return;
    }

    try {
      setLoading(prev => ({ ...prev, trends: true }));
      setError(null);
      console.log('Fetching trends for unit:', selectedUnit);
      const trendsRes = await getAttendanceTrends(selectedUnit);
      console.log('Trends received:', trendsRes);
      if (!trendsRes || !Array.isArray(trendsRes.labels) || !Array.isArray(trendsRes.present) || 
          !Array.isArray(trendsRes.absent) || !Array.isArray(trendsRes.rates)) {
        throw new Error("Invalid trends data format received from server");
      }
      setTrends({
        labels: trendsRes.labels,
        present: trendsRes.present,
        absent: trendsRes.absent,
        rates: trendsRes.rates
      });
    } catch (error) {
      console.error('Failed to fetch trends:', error);
      setError(error.message || "Failed to load attendance trends");
      setTrends({ labels: [], present: [], absent: [], rates: [] });
    } finally {
      setLoading(prev => ({ ...prev, trends: false }));
    }
  }, [selectedUnit]);

  // Fetch trends when fetchTrends changes
  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  // Chart configuration
  const chartData = {
    labels: trends.labels.length ? trends.labels : ['No Data'],
    datasets: [
      {
        type: 'bar',
        label: 'Present Students',
        data: trends.present.length ? trends.present : [0],
        backgroundColor: 'rgba(75, 192, 192, 0.6)', // Teal
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        yAxisID: 'y-count'
      },
      {
        type: 'bar',
        label: 'Absent Students',
        data: trends.absent.length ? trends.absent : [0],
        backgroundColor: 'rgba(255, 99, 132, 0.6)', // Red
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        yAxisID: 'y-count'
      },
      {
        type: 'line',
        label: 'Attendance Rate (%)',
        data: trends.rates.length ? trends.rates : [0],
        borderColor: '#1890ff', // Blue
        backgroundColor: 'rgba(24, 144, 255, 0.2)',
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y-rate'
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
        text: 'Attendance Analytics: Counts and Rate',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            const dataset = context.dataset;
            if (dataset.type === 'line') {
              return `${dataset.label}: ${context.parsed.y}%`;
            }
            return `${dataset.label}: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      'y-count': {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: 'Number of Students'
        },
        beginAtZero: true,
        suggestedMax: Math.max(...trends.present.concat(trends.absent)) + 5 || 10,
        grid: {
          drawOnChartArea: false
        }
      },
      'y-rate': {
        type: 'linear',
        position: 'right',
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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
          <Button 
            onClick={fetchTrends} 
            loading={loading.trends}
            disabled={loading.trends || !selectedUnit}
            type="primary"
          >
            Refresh
          </Button>
        </div>
      }
    >
      <Spin spinning={loading.trends} tip="Loading trends...">
        <div style={{ height: screens.md ? 400 : 300, position: 'relative' }}>
          {error ? (
            <Text type="danger" style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              {error}
            </Text>
          ) : trends.labels.length === 0 && !loading.trends ? (
            <Text type="secondary" style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              No attendance data available for this unit
            </Text>
          ) : (
            <Chart data={chartData} options={options} />
          )}
        </div>
      </Spin>
    </Card>
  );
};

export default Analytics;