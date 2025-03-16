import { useState, useEffect, useCallback, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Chart } from "react-chartjs-2";
import { Card, Select, Spin, Typography, Grid, Button, Space, Statistic, Row, Col, Badge, DatePicker } from "antd";
import { ReloadOutlined, LineChartOutlined, TeamOutlined, PercentageOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { getAttendanceTrends, getLecturerUnits } from "../../services/api";
import moment from 'moment';
import { ThemeContext } from "../../context/ThemeContext";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Text } = Typography;

const Analytics = () => {
  const navigate = useNavigate();
  const { themeColors, isDarkMode } = useContext(ThemeContext);
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
      const trendsRes = await getAttendanceTrends(selectedUnit, startDate, endDate);
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

  const cardStyle = useMemo(() => ({
    marginTop: 24,
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    background: themeColors.cardBg,
    border: `1px solid ${themeColors.border}`,
    transition: 'all 0.3s ease'
  }), [themeColors]);

  const chartData = useMemo(() => {
    const safeTrends = trends || { labels: [], present: [], absent: [], rates: [] };
    return {
      labels: safeTrends.labels.length ? safeTrends.labels : ['No Data'],
      datasets: [
        {
          type: 'bar',
          label: 'Present',
          data: safeTrends.present.length ? safeTrends.present : [0],
          backgroundColor: `${themeColors.secondary}80`, // 50% opacity
          borderColor: themeColors.secondary,
          borderWidth: 2,
          yAxisID: 'y-count',
          barThickness: screens.md ? 20 : 15,
          order: 2,
        },
        {
          type: 'bar',
          label: 'Absent',
          data: safeTrends.absent.length ? safeTrends.absent : [0],
          backgroundColor: `${themeColors.accent}80`, // 50% opacity
          borderColor: themeColors.accent,
          borderWidth: 2,
          yAxisID: 'y-count',
          barThickness: screens.md ? 20 : 15,
          order: 1,
        },
        {
          type: 'line',
          label: 'Attendance Rate (%)',
          data: safeTrends.rates.length ? safeTrends.rates : [0],
          borderColor: themeColors.primary,
          backgroundColor: `${themeColors.primary}20`,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: 'y-rate',
          order: 0,
        },
      ],
    };
  }, [trends, screens.md, themeColors]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: screens.md ? 14 : 12 },
          padding: 10,
          color: themeColors.text
        }
      },
      title: {
        display: true,
        text: 'Attendance Trends',
        font: { size: screens.md ? 18 : 16, weight: 'bold' },
        color: themeColors.text,
        padding: { top: 10, bottom: 20 }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: `${themeColors.cardBg}E6`,
        titleColor: themeColors.text,
        bodyColor: themeColors.text,
        borderColor: themeColors.border,
        borderWidth: 1,
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
        title: { display: true, text: 'Students', font: { size: 14, weight: 'bold' }, color: themeColors.text },
        beginAtZero: true,
        suggestedMax: Math.max(...(trends.present || []).concat(trends.absent || [])) * 1.2 || 10,
        grid: { color: `${themeColors.border}80` },
        ticks: { color: themeColors.text }
      },
      'y-rate': {
        type: 'linear',
        position: 'right',
        min: 0,
        max: 100,
        title: { display: true, text: 'Rate (%)', font: { size: 14, weight: 'bold' }, color: themeColors.text },
        grid: { drawOnChartArea: false },
        ticks: { callback: value => `${value}%`, color: themeColors.text }
      },
      x: {
        title: { display: true, text: 'Date', font: { size: 14, weight: 'bold' }, color: themeColors.text },
        grid: { color: `${themeColors.border}40` },
        ticks: { maxRotation: screens.md ? 45 : 90, minRotation: 45, color: themeColors.text }
      },
    },
    maintainAspectRatio: false,
    animation: { duration: 1000, easing: 'easeInOutQuad' },
    elements: {
      point: {
        backgroundColor: themeColors.primary,
        hoverBackgroundColor: themeColors.focus,
        borderColor: isDarkMode ? themeColors.background : '#fff',
      },
      line: {
        tension: 0.4
      }
    }
  }), [screens.md, themeColors, trends.present, trends.absent, isDarkMode]);

  const statisticCardStyle = useMemo(() => ({
    background: themeColors.cardBg,
    borderRadius: 8,
    border: `1px solid ${themeColors.border}`,
    height: '100%',
    transition: 'all 0.3s ease',
  }), [themeColors]);

  return (
    <div style={{
      padding: '24px',
      background: themeColors.background,
      minHeight: '100vh',
      width: '100%',
      transition: 'all 0.3s ease'
    }}>
      <Button
        type="primary"
        onClick={() => navigate('/lecturer-dashboard')}
        style={{
          background: themeColors.primary,
          borderColor: themeColors.primary,
          borderRadius: 8,
          color: isDarkMode ? themeColors.text : '#fff',
          marginBottom: 16
        }}
        icon={<ArrowLeftOutlined />}
      >
        Back to Lecturer Dashboard
      </Button>

      <Card
        hoverable={false}
        title={
          <Space>
            <LineChartOutlined style={{ fontSize: 24, color: themeColors.primary }} />
            <Typography.Title level={4} style={{ margin: 0, color: themeColors.text }}>
              Attendance Insights
            </Typography.Title>
          </Space>
        }
        extra={
          <Space wrap>
            <Select
              value={filterType}
              onChange={setFilterType}
              style={{ width: 120 }}
              dropdownStyle={{ background: themeColors.cardBg }}
            >
              <Option value="All">All</Option>
              <Option value="Day">Day</Option>
              <Option value="Week">Week</Option>
            </Select>

            {filterType === 'Day' &&
              <DatePicker
                onChange={setSelectedDate}
                value={selectedDate}
                style={{ width: 200 }}
                dropdownClassName="themed-dropdown"
              />
            }

            {filterType === 'Week' &&
              <DatePicker
                picker="week"
                onChange={setSelectedDate}
                value={selectedDate}
                style={{ width: 200 }}
                dropdownClassName="themed-dropdown"
              />
            }

            <Select
              placeholder="Select Unit"
              value={selectedUnit}
              onChange={setSelectedUnit}
              loading={loading.units}
              disabled={loading.units || units.length === 0}
              style={{ width: screens.md ? 240 : 180 }}
              dropdownStyle={{ background: themeColors.cardBg }}
            >
              {units.map(unit => (
                <Option key={unit._id} value={unit._id}>
                  <Text strong style={{ color: themeColors.text }}>
                    {unit.name}
                  </Text>
                  <Badge
                    status="processing"
                    text={unit.code}
                    style={{ color: themeColors.secondary }}
                  />
                </Option>
              ))}
            </Select>

            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchTrends}
              loading={loading.trends}
              disabled={loading.trends || !selectedUnit || ((filterType === 'Day' || filterType === 'Week') && !selectedDate)}
              style={{
                background: themeColors.primary,
                borderColor: themeColors.primary,
                color: themeColors.textInvert,
                borderRadius: 8,
                transition: 'all 0.3s'
              }}
            >
              {screens.md ? (loading.trends ? 'Loading...' : 'Refresh Trends') : (loading.trends ? 'Loading' : 'Refresh')}
            </Button>
          </Space>
        }
        style={cardStyle}
        styles={{ body: { padding: screens.md ? 24 : 16 } }}
      >
        <Spin
          spinning={loading.trends}
          tip={filterType === 'All'
            ? "Loading attendance trends for all sessions..."
            : filterType === 'Day'
              ? "Loading attendance data for selected day..."
              : "Loading attendance data for selected week..."}
        >
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <Card style={statisticCardStyle} bodyStyle={{ padding: '16px' }}>
                <Statistic
                  title={<Text style={{ color: themeColors.text }}>Total Present</Text>}
                  value={totalPresent}
                  prefix={<TeamOutlined style={{ color: themeColors.secondary }} />}
                  valueStyle={{ color: themeColors.secondary }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card style={statisticCardStyle} bodyStyle={{ padding: '16px' }}>
                <Statistic
                  title={<Text style={{ color: themeColors.text }}>Total Absent</Text>}
                  value={totalAbsent}
                  prefix={<TeamOutlined style={{ color: themeColors.accent }} />}
                  valueStyle={{ color: themeColors.accent }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card style={statisticCardStyle} bodyStyle={{ padding: '16px' }}>
                <Statistic
                  title={<Text style={{ color: themeColors.text }}>Avg. Attendance Rate</Text>}
                  value={avgAttendanceRate}
                  suffix="%"
                  prefix={<PercentageOutlined style={{ color: themeColors.primary }} />}
                  valueStyle={{ color: themeColors.primary }}
                />
              </Card>
            </Col>
          </Row>

          <div
            style={{
              height: screens.md ? 400 : 300,
              position: 'relative',
              background: themeColors.cardBg,
              borderRadius: 8,
              padding: 16,
              border: `1px solid ${themeColors.border}`
            }}
          >
            {error ? (
              <Text type="danger" style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                fontSize: screens.md ? 16 : 14,
                color: themeColors.accent
              }}>
                {error}
              </Text>
            ) : (filterType !== 'All' && !selectedDate) ? (
              <Text type="secondary" style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                fontSize: screens.md ? 16 : 14,
                color: themeColors.text
              }}>
                Please select a date
              </Text>
            ) : trends.labels.length === 0 && !loading.trends ? (
              <Text type="secondary" style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                fontSize: screens.md ? 16 : 14,
                color: themeColors.text
              }}>
                No attendance data available for the selected period
              </Text>
            ) : (
              <Chart data={chartData} options={chartOptions} />
            )}
          </div>
        </Spin>

        <style>{`
          .ant-select-selector {
            background: ${themeColors.inputBg} !important;
            color: ${themeColors.text} !important;
            border-color: ${themeColors.border} !important;
            border-radius: 8px;
            transition: all 0.3s;
          }
          
          .ant-select-selector:hover, .ant-select-focused .ant-select-selector {
            border-color: ${themeColors.primary} !important;
            background: ${themeColors.inputHover} !important;
          }
          
          .ant-picker {
            background: ${themeColors.inputBg} !important;
            color: ${themeColors.text} !important;
            border-color: ${themeColors.border} !important;
            border-radius: 8px;
            transition: all 0.3s;
          }
          
          .ant-picker:hover, .ant-picker-focused {
            border-color: ${themeColors.primary} !important;
            background: ${themeColors.inputHover} !important;
          }
          
          .ant-picker-input > input {
            color: ${themeColors.text} !important;
          }
          
          .ant-picker-suffix, .ant-picker-clear {
            color: ${themeColors.text}80 !important;
          }
          
          .ant-select-dropdown, .themed-dropdown {
            background: ${themeColors.cardBg} !important;
            border: 1px solid ${themeColors.border} !important;
            border-radius: 8px;
            box-shadow: 0 3px 8px rgba(0,0,0,0.15);
          }
          
          .ant-select-item-option-content {
            color: ${themeColors.text} !important;
          }
          
          .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
            background: ${themeColors.hover} !important;
          }
          
          .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
            background: ${themeColors.hover}80 !important;
          }
          
          .ant-picker-panel-container {
            background: ${themeColors.cardBg} !important;
            border: 1px solid ${themeColors.border} !important;
            border-radius: 8px;
            overflow: hidden;
          }
          
          .ant-picker-panel {
            background-color: ${themeColors.cardBg} !important;
            border-bottom: 1px solid ${themeColors.border} !important;
          }
          
          .ant-picker-header {
            color: ${themeColors.text} !important;
            border-bottom: 1px solid ${themeColors.border} !important;
          }
          
          .ant-picker-header button {
            color: ${themeColors.text} !important;
          }
          
          .ant-picker-content th {
            color: ${themeColors.text}80 !important;
          }
          
          .ant-picker-cell {
            color: ${themeColors.text} !important;
          }
          
          .ant-picker-cell-in-view {
            color: ${themeColors.text} !important;
          }
          
          .ant-picker-cell-disabled {
            color: ${themeColors.disabled} !important;
          }
          
          .ant-picker-cell-in-view.ant-picker-cell-selected .ant-picker-cell-inner {
            background: ${themeColors.primary} !important;
            color: ${themeColors.textInvert} !important;
          }
          
          .ant-picker-cell-in-view.ant-picker-cell-today .ant-picker-cell-inner::before {
            border-color: ${themeColors.primary} !important;
          }
          
          .ant-picker-footer {
            border-top: 1px solid ${themeColors.border} !important;
          }
          
          .ant-spin-text {
            color: ${themeColors.text} !important;
          }
          
          .ant-spin-dot i {
            background-color: ${themeColors.primary} !important;
          }
          
          .ant-badge-status-text {
            color: ${themeColors.text}CC !important;
          }
        `}</style>
      </Card>
    </div>
  );
};

export default Analytics;