import { useState, useEffect, useCallback, useMemo } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Chart } from "react-chartjs-2";
import { Card, Select, Spin, Typography, Grid, Button, Space, Statistic, Row, Col, Badge, DatePicker } from "antd";
import { ReloadOutlined, LineChartOutlined, TeamOutlined, PercentageOutlined } from '@ant-design/icons';
import { getAttendanceTrends, getLecturerUnits } from "../services/api";
import moment from 'moment';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Text } = Typography;

const Analytics = () => {
  const screens = useBreakpoint();
  const lecturerId = localStorage.getItem("userId");
  const [trends, setTrends] = useState({ labels: [], present: [], absent: [], rates: [] });
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [filterType, setFilterType] = useState('All');
  const [selectedDate, setSelectedDate] = useState(moment("2025-02-20")); // Default for testing
  const [loading, setLoading] = useState({ units: true, trends: false });
  const [error, setError] = useState(null);

  const { startDate, endDate } = useMemo(() => {
    if (filterType === 'Day' && selectedDate) {
      return {
        startDate: selectedDate.startOf('day').toISOString(),
        endDate: selectedDate.endOf('day').toISOString(),
      };
    } else if (filterType === 'Week' && selectedDate) {
      return {
        startDate: selectedDate.startOf('week').toISOString(),
        endDate: selectedDate.endOf('week').toISOString(),
      };
    }
    return { startDate: null, endDate: null };
  }, [filterType, selectedDate]);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        if (!lecturerId) throw new Error("No lecturer ID found. Please log in.");
        setLoading(prev => ({ ...prev, units: true }));
        setError(null);
        const unitsData = await getLecturerUnits(lecturerId);
        console.log("Fetched units:", unitsData);
        if (!Array.isArray(unitsData)) throw new Error("Invalid units data format");
        setUnits(unitsData);
        if (unitsData.length > 0) setSelectedUnit(unitsData[0]._id);
        else setError("No units assigned to you");
      } catch (err) {
        setError(err.message || "Failed to load units");
        setUnits([]);
      } finally {
        setLoading(prev => ({ ...prev, units: false }));
      }
    };
    fetchUnits();
  }, [lecturerId]);

  const fetchTrends = useCallback(async () => {
    if (!selectedUnit) {
      setTrends({ labels: [], present: [], absent: [], rates: [] });
      setError("Select a unit to view trends");
      return;
    }
    if ((filterType === 'Day' || filterType === 'Week') && !selectedDate) {
      setTrends({ labels: [], present: [], absent: [], rates: [] });
      setError("Please select a date");
      return;
    }
    try {
      setLoading(prev => ({ ...prev, trends: true }));
      setError(null);
      console.log("Fetching trends with:", { unit: selectedUnit, startDate, endDate });
      const trendsRes = await getAttendanceTrends(selectedUnit, startDate, endDate);
      console.log("Trends response:", trendsRes);
      if (!trendsRes || !Array.isArray(trendsRes.labels) || !Array.isArray(trendsRes.present) || !Array.isArray(trendsRes.absent) || !Array.isArray(trendsRes.rates)) {
        throw new Error("Invalid trends data structure");
      }
      setTrends({
        labels: trendsRes.labels,
        present: trendsRes.present,
        absent: trendsRes.absent,
        rates: trendsRes.rates
      });
    } catch (err) {
      console.error("Fetch trends error:", err);
      setError(err.message || "Failed to load trends");
      setTrends({ labels: [], present: [], absent: [], rates: [] });
    } finally {
      setLoading(prev => ({ ...prev, trends: false }));
    }
  }, [selectedUnit, startDate, endDate, filterType, selectedDate]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const { totalPresent, totalAbsent, avgAttendanceRate } = useMemo(() => {
    const presentSum = trends.present.reduce((sum, val) => sum + val, 0);
    const absentSum = trends.absent.reduce((sum, val) => sum + val, 0);
    const rateAvg = trends.rates.length 
      ? (trends.rates.reduce((sum, val) => sum + val, 0) / trends.rates.length).toFixed(1) 
      : 0;
    return { totalPresent: presentSum, totalAbsent: absentSum, avgAttendanceRate: rateAvg };
  }, [trends]);

  const chartData = useMemo(() => {
    // Ensure trends is defined and has the expected structure
    const safeTrends = trends || { labels: [], present: [], absent: [], rates: [] };
    return {
      labels: safeTrends.labels.length ? safeTrends.labels : ['No Data'],
      datasets: [
        {
          type: 'bar',
          label: 'Present',
          data: safeTrends.present.length ? safeTrends.present : [0],
          backgroundColor: 'rgba(40, 167, 69, 0.7)',
          borderColor: 'rgba(40, 167, 69, 1)',
          borderWidth: 1,
          yAxisID: 'y-count',
          barThickness: screens.md ? 20 : 15,
        },
        {
          type: 'bar',
          label: 'Absent',
          data: safeTrends.absent.length ? safeTrends.absent : [0],
          backgroundColor: 'rgba(220, 53, 69, 0.7)',
          borderColor: 'rgba(220, 53, 69, 1)',
          borderWidth: 1,
          yAxisID: 'y-count',
          barThickness: screens.md ? 20 : 15,
        },
        {
          type: 'line',
          label: 'Attendance Rate (%)',
          data: safeTrends.rates.length ? safeTrends.rates : [0],
          borderColor: '#1890ff',
          backgroundColor: 'rgba(24, 144, 255, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: 'y-rate',
        },
      ],
    };
  }, [trends, screens.md]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { font: { size: screens.md ? 14 : 12 }, padding: 10, color: '#333' } },
      title: { display: true, text: 'Attendance Trends', font: { size: screens.md ? 18 : 16, weight: 'bold' }, color: '#333', padding: { top: 10, bottom: 20 } },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 14 },
        bodyFont: { size: 12 },
        padding: 10,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y}${context.dataset.type === 'line' ? '%' : ''}`,
        },
      },
    },
    scales: {
      'y-count': { 
        type: 'linear', 
        position: 'left', 
        title: { display: true, text: 'Students', font: { size: 14, weight: 'bold' }, color: '#666' }, 
        beginAtZero: true, 
        suggestedMax: Math.max(...(trends.present || []).concat(trends.absent || [])) * 1.2 || 10, 
        grid: { color: 'rgba(0, 0, 0, 0.05)' }, 
        ticks: { color: '#666' } 
      },
      'y-rate': { 
        type: 'linear', 
        position: 'right', 
        min: 0, 
        max: 100, 
        title: { display: true, text: 'Rate (%)', font: { size: 14, weight: 'bold' }, color: '#666' }, 
        grid: { drawOnChartArea: false }, 
        ticks: { callback: value => `${value}%`, color: '#666' } 
      },
      x: { 
        title: { display: true, text: 'Date', font: { size: 14, weight: 'bold' }, color: '#666' }, 
        grid: { display: false }, 
        ticks: { maxRotation: screens.md ? 45 : 90, minRotation: 45, color: '#666' } 
      },
    },
    maintainAspectRatio: false,
    animation: { duration: 1000, easing: 'easeInOutQuad' },
  };

  return (
    <Card
      title={<Space><LineChartOutlined style={{ fontSize: 24, color: '#1890ff' }} /><Typography.Title level={4} style={{ margin: 0, color: '#333' }}>Attendance Insights</Typography.Title></Space>}
      extra={
        <Space wrap>
          <Select value={filterType} onChange={setFilterType} style={{ width: 120 }}>
            <Option value="All">All</Option>
            <Option value="Day">Day</Option>
            <Option value="Week">Week</Option>
          </Select>
          {filterType === 'Day' && <DatePicker onChange={setSelectedDate} value={selectedDate} style={{ width: 200 }} />}
          {filterType === 'Week' && <DatePicker picker="week" onChange={setSelectedDate} value={selectedDate} style={{ width: 200 }} />}
          <Select
            placeholder="Select Unit"
            value={selectedUnit}
            onChange={setSelectedUnit}
            loading={loading.units}
            disabled={loading.units || units.length === 0}
            style={{ width: screens.md ? 240 : 180 }}
          >
            {units.map(unit => (
              <Option key={unit._id} value={unit._id}><Text strong>{unit.name}</Text> <Badge status="processing" text={unit.code} /></Option>
            ))}
          </Select>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={fetchTrends} 
            loading={loading.trends} 
            disabled={loading.trends || !selectedUnit || ((filterType === 'Day' || filterType === 'Week') && !selectedDate)}
          >
            {screens.md ? 'Refresh Trends' : 'Refresh'}
          </Button>
        </Space>
      }
      style={{ marginTop: 24, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}
      bodyStyle={{ padding: screens.md ? 24 : 16 }}
    >
      <Spin spinning={loading.trends} tip="Loading trends...">
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}><Statistic title="Total Present" value={totalPresent} prefix={<TeamOutlined style={{ color: '#28a745' }} />} valueStyle={{ color: '#28a745' }} /></Col>
          <Col xs={24} sm={8}><Statistic title="Total Absent" value={totalAbsent} prefix={<TeamOutlined style={{ color: '#dc3545' }} />} valueStyle={{ color: '#dc3545' }} /></Col>
          <Col xs={24} sm={8}><Statistic title="Avg. Attendance Rate" value={avgAttendanceRate} suffix="%" prefix={<PercentageOutlined style={{ color: '#1890ff' }} />} valueStyle={{ color: '#1890ff' }} /></Col>
        </Row>
        <div style={{ height: screens.md ? 400 : 300, position: 'relative' }}>
          {error ? (
            <Text type="danger" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', fontSize: screens.md ? 16 : 14 }}>{error}</Text>
          ) : (filterType !== 'All' && !selectedDate) ? (
            <Text type="secondary" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', fontSize: screens.md ? 16 : 14 }}>Please select a date</Text>
          ) : trends.labels.length === 0 && !loading.trends ? (
            <Text type="secondary" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', fontSize: screens.md ? 16 : 14 }}>No attendance data available for the selected period</Text>
          ) : (
            <Chart data={chartData} options={chartOptions} />
          )}
        </div>
      </Spin>
    </Card>
  );
};

export default Analytics;