import { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { Layout, Button, Card, Row, Col, Select, Space, Modal, Table, Typography, Spin, DatePicker, message, Tag, Empty } from 'antd';
import { LeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Title } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';
import { useNavigate } from 'react-router-dom';
import { getCourses, getUnitsByCourse, getCourseAttendanceRate } from '../../services/api';
import dayjs from 'dayjs'; // Use dayjs instead of moment
import { ThemeContext } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Title, zoomPlugin);

const { Header, Content } = Layout;
const { Option } = Select;
const { Title: AntTitle } = Typography;

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const { themeColors, isDarkMode } = useContext(ThemeContext);
  const [courses, setCourses] = useState([]);
  const [attendanceRates, setAttendanceRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading data...');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseUnits, setCourseUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [viewMode, setViewMode] = useState('weekly');
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState([]);
  // Add new filters for year and semester
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [noDataMessage, setNoDataMessage] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingMessage('Fetching available courses...');
      const coursesRes = await getCourses();

      // Get unique years and semesters from all courses/units
      const years = new Set();
      const semesters = new Set();

      const enrichedCourses = await Promise.all(coursesRes.map(async (course) => {
        const units = await getUnitsByCourse(course._id);
        units.forEach(unit => {
          if (unit.year) years.add(unit.year);
          if (unit.semester) semesters.add(unit.semester);
        });

        // Set first unit data as fallback
        const firstUnit = units[0] || {};
        return {
          ...course,
          year: firstUnit.year || 'N/A',
          semester: firstUnit.semester || 'N/A',
          units: units
        };
      }));

      setCourses(enrichedCourses);
      setAvailableYears(Array.from(years).sort((a, b) => a - b));
      setAvailableSemesters(Array.from(semesters).sort((a, b) => a - b));

      // Reset selected values when data changes
      if (!selectedCourse && enrichedCourses.length > 0) {
        setSelectedCourse(enrichedCourses[0]._id);
      }

    } catch (error) {
      console.error("Error loading course data:", error);
      message.error('Error loading course data');
    } finally {
      setLoading(false);
    }
  }, [selectedCourse]);

  const fetchCourseAttendanceRates = useCallback(async () => {
    if (!selectedCourse) return;

    try {
      setLoading(true);
      setLoadingMessage('Calculating attendance statistics...');
      setNoDataMessage('');

      // If we have a specific course selected, fetch only that one
      const attendanceData = await getCourseAttendanceRate(selectedCourse);

      // Update the attendance rates with new data
      setAttendanceRates(prev => ({
        ...prev,
        [selectedCourse]: attendanceData
      }));

    } catch (error) {
      console.error("Error loading attendance data:", error);
      message.error('Error loading attendance data');
      setNoDataMessage('No attendance data available for the selected filters');
    } finally {
      setLoading(false);
    }
  }, [selectedCourse]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseAttendanceRates();
    }
  }, [selectedCourse, fetchCourseAttendanceRates]);

  useEffect(() => {
    if (selectedCourse) {
      setLoading(true);
      setLoadingMessage('Fetching course units...');

      const course = courses.find(c => c._id === selectedCourse);

      // If we already have the units in our enriched course data
      if (course?.units) {
        // Filter units by year and semester if selected
        let filteredUnits = course.units;

        if (selectedYear) {
          filteredUnits = filteredUnits.filter(u => u.year === parseInt(selectedYear));
        }

        if (selectedSemester) {
          filteredUnits = filteredUnits.filter(u => u.semester === parseInt(selectedSemester));
        }

        setCourseUnits(filteredUnits.filter(u => u && u._id && u.name));
        setLoading(false);
      } else {
        // Fetch units if not already in our data
        getUnitsByCourse(selectedCourse)
          .then(units => {
            // Filter units by year and semester if selected
            let filteredUnits = units;

            if (selectedYear) {
              filteredUnits = filteredUnits.filter(u => u.year === parseInt(selectedYear));
            }

            if (selectedSemester) {
              filteredUnits = filteredUnits.filter(u => u.semester === parseInt(selectedSemester));
            }

            setCourseUnits(filteredUnits.filter(u => u && u._id && u.name));
          })
          .catch(() => {
            message.error('Failed to fetch course units');
            setCourseUnits([]);
          })
          .finally(() => setLoading(false));
      }
    } else {
      setCourseUnits([]);
      setLoading(false);
    }
  }, [selectedCourse, courses, selectedYear, selectedSemester]);

  // Effect to clear selected unit when it's not in the filtered units
  useEffect(() => {
    if (selectedUnit && courseUnits.length > 0 && !courseUnits.find(u => u._id === selectedUnit)) {
      setSelectedUnit(null);
    }
  }, [courseUnits, selectedUnit]);

  // Get filtered data for charting
  const filteredData = useMemo(() => {
    if (!selectedCourse) return { totalPresent: 0, totalPossible: 0, weeklyTrends: [], dailyTrends: [] };

    const courseData = attendanceRates[selectedCourse] || { totalPresent: 0, totalPossible: 0, weeklyTrends: [], dailyTrends: [] };

    // If no specific unit is selected, return all course data
    if (!selectedUnit) return courseData;

    // For a specific unit, filter sessions that include this unit
    const weeklyTrends = courseData.weeklyTrends
      .map(trend => {
        const unitSessions = trend.sessions.filter(s => s.unit === selectedUnit);
        if (unitSessions.length === 0) return null;

        // Calculate unit-specific metrics
        const present = unitSessions.reduce((sum, s) => sum + (s.present || 0), 0);
        const absent = unitSessions.reduce((sum, s) => sum + (s.absent || 0), 0);
        const total = present + absent;

        return {
          ...trend,
          present,
          absent,
          rate: total > 0 ? Math.round((present / total) * 100) : 0,
          sessions: unitSessions,
          sessionCount: unitSessions.length
        };
      })
      .filter(Boolean); // Remove null entries

    // Same for daily trends
    const dailyTrends = courseData.dailyTrends
      .map(trend => {
        const unitSessions = trend.sessions.filter(s => s.unit === selectedUnit);
        if (unitSessions.length === 0) return null;

        const present = unitSessions.reduce((sum, s) => sum + (s.present || 0), 0);
        const absent = unitSessions.reduce((sum, s) => sum + (s.absent || 0), 0);
        const total = present + absent;

        return {
          ...trend,
          present,
          absent,
          rate: total > 0 ? Math.round((present / total) * 100) : 0,
          sessions: unitSessions,
          sessionCount: unitSessions.length
        };
      })
      .filter(Boolean);

    // Calculate unit totals
    const unitPresent = weeklyTrends.reduce((sum, t) => sum + t.present, 0);
    const unitPossible = weeklyTrends.reduce((sum, t) => sum + (t.present + t.absent), 0);

    return {
      totalPresent: unitPresent,
      totalPossible: unitPossible,
      weeklyTrends,
      dailyTrends
    };
  }, [selectedCourse, selectedUnit, attendanceRates]);

  // Rest of your component logic
  const totalPresent = filteredData.totalPresent || 0;
  const totalPossible = filteredData.totalPossible || 0;
  const overallRate = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;
  const weeklyTrends = filteredData.weeklyTrends || [];
  const dailyTrends = filteredData.dailyTrends || [];

  const trends = selectedDate
    ? (viewMode === 'weekly'
      ? weeklyTrends.filter(w => w.week === dayjs(selectedDate).format('MMM D - MMM D, YYYY'))
      : dailyTrends.filter(d => d.date === dayjs(selectedDate).format('YYYY-MM-DD')))
    : (viewMode === 'weekly' ? weeklyTrends : dailyTrends);

  // Handle reset filters
  const handleResetFilters = () => {
    setSelectedCourse(courses.length > 0 ? courses[0]._id : null);
    setSelectedUnit(null);
    setSelectedYear(null);
    setSelectedSemester(null);
    setSelectedDate(null);
    setViewMode('weekly');
  };

  // Add the missing handleDateChange function
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // Updated chart data and options
  const chartData = {
    labels: trends.length ? trends.map(t => viewMode === 'weekly' ? t.week : t.date) : ['No Data'],
    datasets: [
      {
        type: 'bar',
        label: 'Present',
        data: trends.length ? trends.map(t => t.present) : [0],
        backgroundColor: themeColors.secondary,
        borderColor: themeColors.secondary,
        borderWidth: 1,
        yAxisID: 'y-count'
      },
      {
        type: 'bar',
        label: 'Absent',
        data: trends.length ? trends.map(t => t.absent) : [0],
        backgroundColor: themeColors.accent,
        borderColor: themeColors.accent,
        borderWidth: 1,
        yAxisID: 'y-count'
      },
      {
        type: 'line',
        label: 'Attendance Rate (%)',
        data: trends.length ? trends.map(t => t.rate) : [0],
        borderColor: themeColors.primary,
        backgroundColor: `${themeColors.primary}33`,
        fill: false,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y-rate'
      },
    ],
  };

  const options = {
    // ...existing options...
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 12 }, padding: 10, color: themeColors.text } },
      title: {
        display: true,
        text: `Overall Attendance: ${overallRate}% (Present: ${totalPresent}/${totalPossible})`,
        font: { size: 14 },
        padding: { top: 10, bottom: 20 },
        color: themeColors.text
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: `${themeColors.text}CC`,
        titleColor: '#fff',
        bodyColor: '#fff',
        callbacks: {
          label: context => `${context.dataset.label}: ${context.dataset.type === 'line' ? `${context.raw}%` : `${context.raw} students`}`,
          footer: tooltipItems => `Sessions: ${trends[tooltipItems[0].dataIndex]?.sessionCount || 0}, Total Possible: ${trends[tooltipItems[0].dataIndex]?.present + trends[tooltipItems[0].dataIndex]?.absent || 0}`,
        },
      },
      zoom: {
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
        pan: { enabled: true, mode: 'x' },
      },
    },
    scales: {
      // ...existing scales...
    },
    onClick: (event, elements) => {
      if (elements.length && trends.length > 0) {
        const index = elements[0].index;
        if (index >= 0 && index < trends.length) {
          setModalData(trends[index].sessions || []);
          setModalVisible(true);
        }
      }
    },
  };

  // Get course name for display based on selected filters
  const getDisplayTitle = () => {
    const course = courses.find(c => c._id === selectedCourse);
    const unit = courseUnits.find(u => u._id === selectedUnit);

    let title = course?.name || 'Selected Course';

    if (unit) {
      title = `${unit.name} (${unit.code || 'No Code'})`;
    } else if (selectedYear || selectedSemester) {
      title += ' - ';
      if (selectedYear) title += `Year ${selectedYear}`;
      if (selectedYear && selectedSemester) title += ', ';
      if (selectedSemester) title += `Sem ${selectedSemester}`;
    }

    return title;
  };

  return (
    <Layout style={{ minHeight: '100vh', background: themeColors.background, margin: 0, padding: 0, overflowX: 'hidden' }}>
      <Header style={{
        padding: '0 24px',
        background: themeColors.cardBg,
        position: 'fixed',
        width: '100%',
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        height: '64px',
        lineHeight: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button
            type="primary"
            icon={<LeftOutlined />}
            onClick={() => navigate('/admin')}
            style={{ marginRight: 16 }}
          >
            Back to Admin
          </Button>
          <AntTitle level={3} style={{ margin: 0, color: themeColors.primary, display: 'inline-block', verticalAlign: 'middle' }}>Analytics</AntTitle>
        </div>
        <div>
          <ThemeToggle />
        </div>
      </Header>

      <Content style={{
        marginTop: 64,
        padding: 0,
        background: themeColors.background
      }}>
        <Spin spinning={loading} tip={loadingMessage}>
          <Card style={{
            marginBottom: 16,
            borderRadius: 0,
            background: themeColors.cardBg,
            borderColor: themeColors.primary
          }}>
            {/* Enhanced filter container */}
            <div className="filter-container">
              <Space direction="vertical" style={{ width: '100%' }}>
                {/* First row: Course, Year, Semester */}
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Select
                      placeholder="Select Course"
                      allowClear
                      onChange={value => {
                        setSelectedCourse(value);
                        setSelectedUnit(null);
                        setSelectedDate(null);
                      }}
                      value={selectedCourse}
                      style={{ width: '100%' }}
                    >
                      {courses.map(course => (
                        <Option key={course._id} value={course._id}>{course.name}</Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={12} sm={8}>
                    <Select
                      placeholder="Select Year"
                      allowClear
                      onChange={value => {
                        setSelectedYear(value);
                        setSelectedUnit(null);
                      }}
                      value={selectedYear}
                      style={{ width: '100%' }}
                    >
                      {availableYears.map(year => (
                        <Option key={year} value={year.toString()}>Year {year}</Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={12} sm={8}>
                    <Select
                      placeholder="Select Semester"
                      allowClear
                      onChange={value => {
                        setSelectedSemester(value);
                        setSelectedUnit(null);
                      }}
                      value={selectedSemester}
                      style={{ width: '100%' }}
                    >
                      {availableSemesters.map(semester => (
                        <Option key={semester} value={semester.toString()}>Semester {semester}</Option>
                      ))}
                    </Select>
                  </Col>
                </Row>

                {/* Second row: Unit, View Mode, Date */}
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Select
                      placeholder="Select Unit (Optional)"
                      allowClear
                      onChange={setSelectedUnit}
                      value={selectedUnit}
                      style={{ width: '100%' }}
                    >
                      {courseUnits.map(unit => (
                        <Option key={unit._id} value={unit._id}>
                          {unit.name} - {unit.code || 'No Code'}
                          {unit.year && unit.semester &&
                            <Tag color={themeColors.secondary} style={{ marginLeft: 8 }}>
                              Y{unit.year} S{unit.semester}
                            </Tag>
                          }
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={12} sm={8}>
                    <Select
                      value={viewMode}
                      style={{ width: '100%' }}
                      onChange={value => {
                        setViewMode(value);
                        setSelectedDate(null);
                      }}
                    >
                      <Option value="weekly">Weekly View</Option>
                      <Option value="daily">Daily View</Option>
                    </Select>
                  </Col>
                  <Col xs={12} sm={8}>
                    <DatePicker
                      picker={viewMode === 'weekly' ? 'week' : 'date'}
                      onChange={handleDateChange}
                      value={selectedDate}
                      format={viewMode === 'weekly' ? 'MMM D - MMM D, YYYY' : 'YYYY-MM-DD'}
                      style={{ width: '100%' }}
                      placeholder={`Select ${viewMode === 'weekly' ? 'Week' : 'Date'}`}
                    />
                  </Col>
                </Row>

                {/* Reset Filters button */}
                <Row justify="end">
                  <Col>
                    <Button
                      onClick={handleResetFilters}
                      icon={<ReloadOutlined />}
                    >
                      Reset Filters
                    </Button>
                  </Col>
                </Row>
              </Space>
            </div>
          </Card>

          <Row gutter={[0, 16]}>
            {selectedCourse && (
              <Col span={24}>
                <Card
                  title={getDisplayTitle()}
                  style={{
                    borderRadius: 0,
                    background: themeColors.cardBg,
                    borderColor: themeColors.primary
                  }}
                  styles={{ header: { color: themeColors.text } }}
                >
                  <div style={{ height: 400 }} className="chart-container">
                    {noDataMessage || (!trends.length && !loading) ? (
                      <Empty
                        description={noDataMessage || "No attendance data available for the selected filters"}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          color: themeColors.text
                        }}
                      />
                    ) : (
                      <Chart type="bar" data={chartData} options={options} />
                    )}
                  </div>
                </Card>
              </Col>
            )}
          </Row>

          <Modal
            title="Session Details"
            open={modalVisible}
            onCancel={() => setModalVisible(false)}
            footer={null}
            width={800}
            style={{ background: themeColors.cardBg }}
            styles={{ body: { background: themeColors.cardBg, color: themeColors.text } }}
          >
            {modalData.length > 0 ? (
              <Table
                dataSource={modalData}
                columns={modalColumns}
                rowKey={(record, index) => `session-${index}`}
                pagination={false}
                style={{ background: themeColors.cardBg }}
                rowClassName={(_, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'}
              />
            ) : (
              <Empty description="No session details available" />
            )}
          </Modal>
        </Spin>
      </Content>

      <style>{`
        /* Global resets and core styles only */
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          overflow-x: hidden;
          color: ${themeColors.text};
          background: ${themeColors.background};
        }
        
        /* Direct styling for main components only */
        .ant-layout {
          background: ${themeColors.background};
          min-width: 100%;
          width: 100vw;
          overflow-x: hidden;
          color: ${themeColors.text};
        }
        
        .ant-layout-header {
          background: ${themeColors.cardBg};
          padding: 0 24px;
          height: 64px;
          line-height: 64px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          width: 100%;
          color: ${themeColors.text};
        }
        
        .ant-layout-content {
          margin-top: 64px;
          padding: 0;
          background: ${themeColors.background};
          width: 100%;
          overflow-x: hidden;
          color: ${themeColors.text};
        }
        
        /* Card styles */
        .ant-card {
          background: ${themeColors.cardBg};
          border-color: ${themeColors.primary};
          border-radius: 0;
          margin: 0;
          width: 100%;
          color: ${themeColors.text};
        }
        
        .ant-card-head {
          color: ${themeColors.text};
          background: ${themeColors.cardBg};
          border-bottom: 1px solid ${themeColors.primary};
        }
        
        .ant-card-body {
          background: ${themeColors.cardBg};
          color: ${themeColors.text};
        }
        
        /* Form elements */
        .ant-select-selector, .ant-picker {
          background: ${themeColors.cardBg} !important;
          color: ${themeColors.text} !important;
          border-color: ${themeColors.primary} !important;
        }
        
        /* Fix for dark mode placeholders */
        .ant-select-selection-placeholder,
        .ant-picker-input > input::placeholder {
          color: ${isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'} !important;
        }
        
        /* Make input text more visible */
        .ant-select-selection-item,
        .ant-picker-input > input {
          color: ${themeColors.text} !important;
        }
        
        /* Dropdown styling */
        .ant-select-dropdown {
          background: ${themeColors.cardBg} !important;
          border: 1px solid ${themeColors.primary} !important;
        }
        
        .ant-select-item {
          color: ${themeColors.text} !important;
          background: ${themeColors.cardBg} !important;
        }
        
        .ant-select-item-option-selected {
          background: ${themeColors.primary}33 !important;
          color: ${themeColors.text} !important;
          font-weight: bold;
        }
        
        .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
          background: ${themeColors.primary}22 !important;
          color: ${themeColors.text} !important;
        }
        
        /* DatePicker dropdown */
        .ant-picker-dropdown {
          background: ${themeColors.cardBg} !important;
          border: 1px solid ${themeColors.primary} !important;
        }
        
        /* Calendar styling */
        .ant-picker-panel {
          background: ${themeColors.cardBg} !important;
          border: none !important;
        }
        
        .ant-picker-panel-container {
          background: ${themeColors.cardBg} !important;
        }
        
        /* Calendar weekday header (Su Mo Tu We Th Fr Sa) */
        .ant-picker-content th {
          color: ${themeColors.primary} !important;
          font-weight: bold !important;
          padding: 5px 0 !important;
        }
        
        /* Make sure the content inside cell is visible */
        .ant-picker-content th, .ant-picker-content td {
          text-align: center !important;
        }
        
        /* Calendar cells */
        .ant-picker-cell {
          color: ${isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'} !important;
        }
        
        .ant-picker-cell-in-view {
          color: ${themeColors.text} !important;
        }
        
        .ant-picker-cell-disabled {
          color: ${isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'} !important;
          background: ${isDarkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.04)'} !important;
        }
        
        /* Calendar hover and selected states */
        .ant-picker-cell:hover:not(.ant-picker-cell-selected):not(.ant-picker-cell-disabled) .ant-picker-cell-inner {
          background: ${themeColors.primary}33 !important;
        }
        
        .ant-picker-cell-selected .ant-picker-cell-inner,
        .ant-picker-cell-range-start .ant-picker-cell-inner,
        .ant-picker-cell-range-end .ant-picker-cell-inner {
          background: ${themeColors.primary} !important;
          color: #fff !important;
        }
        
        /* Calendar header */
        .ant-picker-header {
          color: ${themeColors.text} !important;
          border-bottom: 1px solid ${themeColors.primary}33 !important;
        }
        
        .ant-picker-header button {
          color: ${themeColors.text} !important;
        }
        
        .ant-picker-header-view {
          color: ${themeColors.primary} !important;
          font-weight: bold;
        }
        
        /* Footer and today button */
        .ant-picker-footer {
          border-top: 1px solid ${themeColors.primary}33 !important;
        }
        
        .ant-picker-today-btn {
          color: ${themeColors.primary} !important;
        }
        
        /* Week selection specific styling */
        .ant-picker-week-panel-row:hover td {
          background: ${themeColors.primary}22 !important;
        }
        
        .ant-picker-week-panel-row-selected td,
        .ant-picker-week-panel-row-selected:hover td {
          background: ${themeColors.primary}44 !important;
        }
        
        .ant-picker-week-panel-row-selected .ant-picker-cell-inner,
        .ant-picker-week-panel-row-selected:hover .ant-picker-cell-inner {
          color: ${themeColors.text} !important;
        }
        
        .ant-picker-week-panel-row-selected .ant-picker-cell-today .ant-picker-cell-inner {
          color: ${themeColors.primary} !important;
          font-weight: bold;
        }
        
        /* Button styling */
        .ant-btn-primary {
          background: ${themeColors.primary};
          border-color: ${themeColors.primary};
        }
        
        .ant-btn-primary:hover {
          background: ${themeColors.primary}dd;
          border-color: ${themeColors.primary};
        }
        
        /* Table styling */
        .ant-table {
          background: ${themeColors.cardBg} !important;
          color: ${themeColors.text} !important;
        }
        
        .ant-table-thead > tr > th {
          background: ${themeColors.primary} !important;
          color: #fff !important;
        }
        
        .ant-table-tbody > tr > td {
          color: ${themeColors.text};
          border-bottom: 1px solid ${themeColors.primary}33;
        }
        
        /* Modal styling */
        .ant-modal-content, 
        .ant-modal-header {
          background: ${themeColors.cardBg};
          color: ${themeColors.text};
        }
        
        .ant-modal-title {
          color: ${themeColors.text};
        }
        
        .ant-modal-close {
          color: ${themeColors.text};
        }
        
        /* Chart container */
        .chart-container {
          height: 400px;
          width: 100%;
          background: ${themeColors.cardBg};
        }
        
        /* Spin component */
        .ant-spin-text {
          color: ${themeColors.primary};
        }
        
        /* Override default Ant Design mobile styles */
        @media (max-width: 576px) {
          .ant-layout-content {
            margin: 64px 0 0 0 !important;
            padding: 0 !important;
            width: 100vw !important;
          }
        }
      `}</style>
    </Layout>
  );
};

export default AdminAnalytics;