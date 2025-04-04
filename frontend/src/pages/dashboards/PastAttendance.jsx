import { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Table,
  Select,
  DatePicker,
  Space,
  Card,
  Typography,
  Spin,
  Button,
  Empty,
  Tag,
  message,
  Modal,
  Tooltip
} from 'antd';
import {
  DownloadOutlined,
  IdcardOutlined,
  UserOutlined,
  ScanOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  BookOutlined
} from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';
import { ThemeContext } from '../../context/ThemeContext';
import { getDepartments, getLecturerUnits } from '../../services/api';
import { useTableStyles } from '../../components/SharedTableStyles';

const { Option } = Select;
const { Text } = Typography;

const API_URL = 'https://attendance-system-w70n.onrender.com/api';

const PastAttendance = ({ units: propUnits = [], lecturerId: propLecturerId }) => {
  const navigate = useNavigate();
  const { themeColors, isDarkMode } = useContext(ThemeContext);
  const [pastSessions, setPastSessions] = useState([]);
  const [pastAttendance, setPastAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState(propUnits);
  const [departments, setDepartments] = useState([]);
  const lecturerId = propLecturerId || localStorage.getItem('userId');
  const [pastFilters, setPastFilters] = useState({
    unit: null,
    date: moment().format('YYYY-MM-DD'),
    sessionId: null,
    year: null,
    semester: null,
  });

  // Add state for date range modal
  const [isDateRangeModalVisible, setIsDateRangeModalVisible] = useState(false);
  const [dateRange, setDateRange] = useState([moment().subtract(30, 'days'), moment()]);
  const [reportUnitId, setReportUnitId] = useState(null); // New state for unit selection in report

  const cardStyle = {
    borderRadius: '16px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
    background: themeColors.cardBg,
    overflow: 'hidden',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    marginBottom: 24,
    borderTop: `4px solid ${themeColors.primary}`,
  };

  useEffect(() => {
    console.log('Units in PastAttendance:', units);
    console.log('Lecturer ID:', lecturerId);
  }, [units, lecturerId]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await getDepartments();
        setDepartments(data || []);
        console.log('Departments fetched:', data);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
        message.error('Failed to fetch departments');
      }
    };
    if (departments.length === 0) fetchDepartments();
  }, [departments]);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        if (!lecturerId) {
          message.error('User session expired. Please log in.');
          navigate('/login');
          return;
        }
        setLoading(true);
        const unitsData = await getLecturerUnits(lecturerId);
        console.log('Units fetched from API:', unitsData);
        setUnits(unitsData || []);
        if (!unitsData || unitsData.length === 0) {
          message.warning('No units assigned to your account');
        }
      } catch (error) {
        console.error('Failed to fetch units:', error);
        message.error('Failed to load unit data');
      } finally {
        setLoading(false);
      }
    };

    if ((!propUnits || propUnits.length === 0) && lecturerId) {
      fetchUnits();
    } else {
      setUnits(propUnits);
    }
  }, [lecturerId, propUnits, navigate]);

  const fetchPastSessions = useCallback(async () => {
    try {
      if (!lecturerId) {
        message.error('User session expired. Please log in.');
        navigate('/login');
        return;
      }
      setLoading(true);
      const params = {
        unitId: pastFilters.unit,
        startDate: pastFilters.date ? new Date(pastFilters.date).toISOString().split('T')[0] : null,
        endDate: pastFilters.date ? new Date(new Date(pastFilters.date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
        sessionId: pastFilters.sessionId,
        year: pastFilters.year,
        semester: pastFilters.semester,
      };

      const response = await axios.get(
        `${API_URL}/attendance/past-lecturer`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          params,
        }
      );
      const sessions = response.data.map((session) => ({
        ...session,
        unitName: session.unitName || (units.find((u) => u._id.toString() === session.unit.toString())?.name) || 'Unknown Unit',
      }));
      console.log('Past sessions fetched:', sessions);
      setPastSessions(sessions);

      if (!pastFilters.sessionId && sessions.length > 0) {
        const sessionsForDate = sessions.filter((session) =>
          moment(session.startTime).format('YYYY-MM-DD') === pastFilters.date
        );
        if (sessionsForDate.length > 0) {
          const latestSession = sessionsForDate.reduce((latest, current) =>
            new Date(current.endTime) > new Date(latest.endTime) ? current : latest
          );
          setPastFilters((prev) => ({ ...prev, sessionId: latestSession.sessionId }));
          setPastAttendance(latestSession.attendance || []);
        } else {
          setPastAttendance([]);
        }
      } else if (pastFilters.sessionId) {
        const session = sessions.find((s) => s.sessionId === pastFilters.sessionId);
        setPastAttendance(session ? session.attendance || [] : []);
      } else {
        setPastAttendance([]);
      }
    } catch (error) {
      console.error('Error fetching past sessions:', error);
      message.error('Failed to fetch past sessions');
    } finally {
      setLoading(false);
    }
  }, [pastFilters, units, lecturerId, navigate]);

  useEffect(() => {
    if (lecturerId) fetchPastSessions();
  }, [lecturerId, fetchPastSessions]);

  const tableStyles = useTableStyles();

  const columns = [
    {
      title: (<><IdcardOutlined style={{ marginRight: 4, color: themeColors.accent }} />Reg Number</>),
      dataIndex: ['student', 'regNo'],
      key: 'regNo',
      sorter: (a, b) => a.student.regNo.localeCompare(b.student.regNo),
      render: (text) => <span style={{ color: themeColors.primary, fontWeight: 500 }}>{text}</span>,
    },
    {
      title: (<><UserOutlined style={{ marginRight: 4, color: themeColors.accent }} />First Name</>),
      dataIndex: ['student', 'firstName'],
      key: 'firstName',
      sorter: (a, b) => a.student.firstName.localeCompare(b.student.firstName),
      render: (text) => <span>{text}</span>,
    },
    {
      title: (<><UserOutlined style={{ marginRight: 4, color: themeColors.accent }} />Last Name</>),
      dataIndex: ['student', 'lastName'],
      key: 'lastName',
      sorter: (a, b) => a.student.lastName.localeCompare(b.student.lastName),
      render: (text) => <span>{text}</span>,
    },
    {
      title: (<><ScanOutlined style={{ marginRight: 4, color: themeColors.accent }} />Scan Time</>),
      dataIndex: 'attendedAt',
      key: 'attendedAt',
      render: (attendedAt) =>
        attendedAt ? (
          <Tag color={themeColors.secondary} style={{ borderRadius: '12px' }}>
            {new Date(attendedAt).toLocaleTimeString()}
          </Tag>
        ) : (
          <Tag color={`${themeColors.text}80`} style={{ borderRadius: '12px' }}>
            N/A
          </Tag>
        ),
      sorter: (a, b) => new Date(a.attendedAt || 0) - new Date(b.attendedAt || 0),
    },
    {
      title: (<><CheckCircleOutlined style={{ marginRight: 4, color: themeColors.accent }} />Status</>),
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag
          color={status === 'Present' ? themeColors.secondary : themeColors.accent}
          style={{ borderRadius: '12px', color: '#fff' }}
        >
          {status.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Present', value: 'Present' },
        { text: 'Absent', value: 'Absent' },
      ],
      onFilter: (value, record) => record.status === value,
    },
  ];

  const clearFilters = () => {
    setPastFilters({ unit: null, date: moment().format('YYYY-MM-DD'), sessionId: null, year: null, semester: null });
  };

  const handleDownloadFullReport = async () => {
    setReportUnitId(pastFilters.unit); // Initialize with currently selected unit
    setIsDateRangeModalVisible(true);
  };

  const handleDateRangeOk = async () => {
    try {
      setIsDateRangeModalVisible(false);
      setLoading(true);

      // Format the dates for the API request
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const token = localStorage.getItem('token');

      try {
        const response = await axios({
          url: `${API_URL}/attendance/export-all-sessions`,
          method: 'GET',
          responseType: 'blob',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // Explicitly request Excel format
          },
          params: { startDate, endDate, unitId: reportUnitId } // Use reportUnitId instead of pastFilters.unit
        });

        // Check content type
        const contentType = response.headers['content-type'];

        // Handle JSON error responses
        if (contentType && contentType.includes('application/json')) {
          try {
            // Convert blob to text to parse JSON
            const errorText = await new Response(response.data).text();
            const errorData = JSON.parse(errorText);

            if (errorData && errorData.code === 'NO_DATA_FOUND') {
              message.warning(errorData.message || 'No data found for the selected date range');
              return;
            } else {
              message.error(errorData.message || 'Error generating report');
              return;
            }
          } catch (e) {
            console.log('Failed to parse error message', e);
          }
        }

        // Check if the response is too small to be a valid file
        if (response.data.size < 100) {
          message.warning("No data found for the selected date range. Please try a different range.");
          return;
        }

        // Use the proper MIME type
        let fileExtension = 'xlsx';
        let fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        if (contentType) {
          fileType = contentType;
          if (contentType.includes('csv')) {
            fileExtension = 'csv';
          }
        }

        // Create a blob with the correct MIME type
        const blob = new Blob([response.data], { type: fileType });

        // Create a File object for better handling
        const file = new File([blob], `attendance_report_${startDate}_to_${endDate}.${fileExtension}`, {
          type: fileType
        });

        // Create download URL
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 1000);

        message.success(`Attendance report downloaded successfully`);
      } catch (error) {
        if (error.response) {
          if (error.response.status === 404) {
            message.warning('No data found for the selected date range. Please try a different range.');
          } else if (error.response.status === 401) {
            message.error('Your session has expired. Please log in again.');
            setTimeout(() => navigate('/login'), 2000);
          } else {
            message.error(`Failed to download report: ${error.response.data?.message || 'Unknown error'}`);
          }
        } else if (error.request) {
          message.error('Network error. Please check your connection and try again.');
        } else {
          message.error(`Error: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      message.error('Failed to download report. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeCancel = () => {
    setIsDateRangeModalVisible(false);
  };

  if (!lecturerId) {
    return (
      <div style={{ padding: 24, background: themeColors.background, minHeight: '100vh' }}>
        <Card style={cardStyle}>
          <Text type="danger" style={{ color: themeColors.accent }}>
            Please log in to view past attendance records.
          </Text>
          <Button
            type="primary"
            onClick={() => navigate('/login')}
            style={{ marginTop: 16, background: themeColors.primary, borderColor: themeColors.primary, borderRadius: 8 }}
          >
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

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
      >
        Back to Lecturer Dashboard
      </Button>

      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong style={{ color: themeColors.text }}>Past Attendance Records</Text>
          </div>
        }
        style={cardStyle}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space wrap style={{ marginBottom: 16 }}>
            <Select
              placeholder="Select Unit"
              style={{ width: 240 }}
              onChange={(value) =>
                setPastFilters((prev) => ({ ...prev, unit: value, sessionId: null }))
              }
              allowClear
              value={pastFilters.unit}
              className="themed-select"
            >
              {units.map((unit) => (
                <Option key={unit._id} value={unit._id}>
                  <Space>
                    <BookOutlined style={{ color: themeColors.primary }} />
                    {unit.name}
                    <Tag color={themeColors.secondary}>{unit.code}</Tag>
                  </Space>
                </Option>
              ))}
            </Select>
            <DatePicker
              defaultValue={moment()}
              placeholder="Select Date"
              style={{ width: 150 }}
              onChange={(_, dateString) =>
                setPastFilters((prev) => ({ ...prev, date: dateString, sessionId: null }))
              }
              allowClear
              className="themed-datepicker"
            />
            <Select
              placeholder="Select Session"
              style={{ width: 300 }}
              onChange={(value) => setPastFilters((prev) => ({ ...prev, sessionId: value }))}
              allowClear
              value={pastFilters.sessionId}
              className="themed-select"
            >
              {pastSessions
                .filter(
                  (session) =>
                    moment(session.startTime).format('YYYY-MM-DD') === pastFilters.date
                )
                .map((session) => (
                  <Option key={session.sessionId} value={session.sessionId}>
                    <Space>
                      <CalendarOutlined style={{ color: themeColors.accent }} />
                      {`${session.unitName} - ${moment(session.startTime).format('hh:mm A')} - ${moment(
                        session.endTime
                      ).format('hh:mm A')}`}
                    </Space>
                  </Option>
                ))}
            </Select>
            <Tooltip title="Download an Excel report for the selected session">
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => {
                  if (pastFilters.sessionId) {
                    const token = localStorage.getItem('token');
                    setLoading(true);

                    // Use the correct endpoint path for session export
                    axios({
                      url: `${API_URL}/attendance/export/session/${pastFilters.sessionId}`,
                      method: 'GET',
                      responseType: 'blob',
                      headers: { Authorization: `Bearer ${token}` },
                    }).then((response) => {
                      // Determine file type from content-type header
                      const contentType = response.headers['content-type'];
                      let fileExtension = 'csv'; // Default extension
                      let fileType = 'text/csv'; // Default type

                      // Allow Excel format if available
                      if (contentType && contentType.includes('excel') ||
                        contentType.includes('spreadsheetml')) {
                        fileExtension = 'xlsx';
                        fileType = contentType;
                      }

                      // Create a blob with proper MIME type
                      const blob = new Blob([response.data], { type: fileType });
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;

                      // Get unit name for better filename
                      const selectedSession = pastSessions.find(s => s.sessionId === pastFilters.sessionId);
                      const unitName = selectedSession?.unitName || 'unknown';
                      const sessionDate = selectedSession ? moment(selectedSession.startTime).format('YYYY-MM-DD') : '';
                      const sessionTime = selectedSession ? moment(selectedSession.startTime).format('HH-mm') : '';

                      // Create informative filename
                      const fileName = `attendance_${unitName.replace(/\s+/g, '_')}_${sessionDate}_${sessionTime}.${fileExtension}`;
                      link.setAttribute('download', fileName);

                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      window.URL.revokeObjectURL(url);

                      message.success(`Report downloaded successfully as ${fileExtension.toUpperCase()}`);
                      setLoading(false);
                    }).catch((error) => {
                      console.error("Download error:", error);

                      // Better error handling
                      if (error.response?.status === 404) {
                        message.error("Export endpoint not found. Please check if the API is updated.");
                      } else if (error.response?.status === 401) {
                        message.error("Session expired. Please log in again.");
                        setTimeout(() => navigate('/login'), 2000);
                      } else {
                        message.error("Failed to download report. Please try again later.");
                      }
                      setLoading(false);
                    });
                  } else {
                    message.warning('Please select a session first');
                  }
                }}
                disabled={!pastFilters.sessionId}
                loading={loading && pastFilters.sessionId}
                style={{
                  background: themeColors.primary,
                  borderColor: themeColors.primary,
                  color: isDarkMode ? themeColors.text : '#fff',
                }}
              >
                Download Excel Report
              </Button>
            </Tooltip>
            <Tooltip title="Download a comprehensive attendance report for all sessions within a date range">
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownloadFullReport}
                loading={loading}
                style={{
                  background: themeColors.primary,
                  borderColor: themeColors.primary,
                  color: isDarkMode ? themeColors.text : '#fff',
                }}
              >
                Download Full Report
              </Button>
            </Tooltip>
          </Space>

          <Spin
            spinning={loading}
            tip={pastFilters.sessionId ? "Loading attendance data..." : "Loading past sessions..."}
          >
            {pastAttendance.length > 0 ? (
              <Table
                dataSource={pastAttendance}
                columns={columns}
                rowKey="_id"
                pagination={{
                  pageSize: 8,
                  showSizeChanger: false,
                  responsive: true,
                  showTotal: (total) => `Total ${total} students`,
                  itemRender: (page, type, originalElement) => {
                    if (type === 'prev' || type === 'next' || type === 'jump-prev' || type === 'jump-next') {
                      return <div style={{ color: themeColors.primary }}>{originalElement}</div>;
                    }
                    return originalElement;
                  }
                }}
                scroll={{ x: 'max-content' }}
                bordered
                rowClassName={(_, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'}
              />
            ) : (
              <Empty description={<span style={{ color: themeColors.text }}>No attendance data found</span>} />
            )}
          </Spin>
        </Space>
      </Card>

      {/* Date Range Modal for Full Report */}
      <Modal
        title="Select Date Range for Report"
        open={isDateRangeModalVisible}
        onOk={handleDateRangeOk}
        onCancel={handleDateRangeCancel}
        centered
        okText="Download Report"
        okButtonProps={{
          style: { background: themeColors.primary, borderColor: themeColors.primary },
          loading: loading
        }}
        styles={{
          header: { background: themeColors.cardBg, borderBottom: `1px solid ${themeColors.border}` },
          body: { background: themeColors.cardBg, padding: '20px' },
          footer: { background: themeColors.cardBg, borderTop: `1px solid ${themeColors.border}` },
          content: { background: themeColors.cardBg, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
        }}
      >
        <div style={{ padding: '10px 0' }}>
          <p style={{ marginBottom: '15px', color: themeColors.text }}>
            Please select a date range and unit for the attendance report:
          </p>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              allowClear={false}
              className="themed-datepicker"
            />
            <Select
              placeholder="Select Unit (Optional - All units if empty)"
              style={{ width: '100%' }}
              onChange={(value) => setReportUnitId(value)}
              value={reportUnitId}
              allowClear
              className="themed-select"
            >
              {units.map((unit) => (
                <Option key={unit._id} value={unit._id}>
                  <Space>
                    <BookOutlined style={{ color: themeColors.primary }} />
                    {unit.name}
                    <Tag color={themeColors.secondary}>{unit.code || ''}</Tag>
                  </Space>
                </Option>
              ))}
            </Select>
            <Text type="secondary" style={{ fontSize: '12px', color: themeColors.textSecondary || '#A0AEC0' }}>
              Leave unit selection empty to generate a report for all your units
            </Text>
          </Space>
        </div>
      </Modal>

      <style>{`
        .ant-select-selector, .ant-picker {
          background: ${themeColors.inputBg || themeColors.cardBg} !important;
          border-color: ${themeColors.inputBorder || themeColors.border} !important;
          color: ${themeColors.text} !important;
          border-radius: 8px;
        }
        
        .ant-select-selector:hover, .ant-select-selector:focus,
        .ant-picker:hover, .ant-picker-focused {
          background: ${themeColors.inputHover || themeColors.hover} !important;
          border-color: ${themeColors.primary} !important;
        }
        
        .ant-select-dropdown, .ant-picker-panel-container {
          background: ${themeColors.cardBg} !important;
          color: ${themeColors.text} !important;
          border-radius: 8px;
        }
        
        .ant-select-item-option-content {
          color: ${themeColors.text} !important;
        }
        
        .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
          background: ${themeColors.hover} !important;
        }
        
        .ant-picker-cell-in-view.ant-picker-cell-selected .ant-picker-cell-inner {
          background: ${themeColors.primary} !important;
        }

        .table-row-light {
          background: ${themeColors.cardBg} !important;
        }
        
        .table-row-dark {
          background: ${themeColors.background} !important;
        }
        
        /* Button hover styles */
        .ant-btn-primary:not(.ant-btn-dangerous):hover,
        .ant-btn-primary:not(.ant-btn-dangerous):focus {
          background: ${themeColors.primaryHover} !important;
          border-color: ${themeColors.primaryHover} !important;
        }
        
        /* Add these new styles for placeholders and icons */
        .ant-select-selection-placeholder {
          color: ${themeColors.placeholder || themeColors.textSecondary || '#A0AEC0'} !important;
          opacity: 0.8 !important;
        }
        
        .ant-picker-input > input::placeholder {
          color: ${themeColors.placeholder || themeColors.textSecondary || '#A0AEC0'} !important;
          opacity: 0.8 !important;
        }
        
        /* Calendar icon in date picker */
        .ant-picker-suffix .anticon {
          color: ${themeColors.primary} !important;
          opacity: 0.8 !important;
        }
        
        /* Clear icon in date picker and select */
        .ant-picker-clear,
        .ant-select-clear {
          background: ${themeColors.inputBg || themeColors.cardBg} !important;
          color: ${themeColors.textSecondary || '#A0AEC0'} !important;
        }
        
        /* Arrow in select dropdown */
        .ant-select-arrow {
          color: ${themeColors.primary} !important;
          opacity: 0.8 !important;
        }
        
        /* Input text color for date picker */
        .ant-picker-input > input {
          color: ${themeColors.text} !important;
        }
        
        /* Dropdown styling for better visibility */
        .ant-select-dropdown {
          background: ${themeColors.cardBg} !important;
          box-shadow: 0 3px 6px rgba(0,0,0,0.15) !important;
          border: 1px solid ${themeColors.border} !important;
        }
        
        .ant-select-dropdown .ant-select-item {
          color: ${themeColors.text} !important;
        }
        
        /* Date picker panel styling for visibility */
        .ant-picker-panel-container {
          background: ${themeColors.cardBg} !important;
          border: 1px solid ${themeColors.border} !important;
          box-shadow: 0 3px 6px rgba(0,0,0,0.15) !important;
        }
        
        .ant-picker-panel {
          background: ${themeColors.cardBg} !important;
        }
        
        .ant-picker-header {
          border-bottom: 1px solid ${themeColors.border} !important;
        }
        
        .ant-picker-header button {
          color: ${themeColors.text} !important;
        }
        
        .ant-picker-content th {
          color: ${themeColors.textSecondary || '#A0AEC0'} !important;
        }
        
        .ant-picker-cell-in-view {
          color: ${themeColors.text} !important;
        }
        
        .ant-picker-cell-in-view.ant-picker-cell-today .ant-picker-cell-inner::before {
          border-color: ${themeColors.primary} !important;
        }
        
        ${tableStyles}
        
        /* Pagination styling - ensuring visibility in dark mode */
        .ant-pagination-item {
          background: ${themeColors.cardBg} !important;
          border-color: ${themeColors.border} !important;
        }
        
        .ant-pagination-item a {
          color: ${themeColors.text} !important;
        }
        
        .ant-pagination-item-active {
          background: ${themeColors.primary} !important;
          border-color: ${themeColors.primary} !important;
        }
        
        .ant-pagination-item-active a {
          color: ${themeColors.textInvert || '#fff'} !important;
        }
        
        .ant-pagination-prev .ant-pagination-item-link, 
        .ant-pagination-next .ant-pagination-item-link {
          background: ${themeColors.cardBg} !important;
          color: ${themeColors.text} !important;
          border-color: ${themeColors.border} !important;
        }
        
        .ant-pagination-disabled .ant-pagination-item-link {
          color: ${themeColors.disabled} !important;
          border-color: ${themeColors.border} !important;
        }
        
        /* Total students text */
        .ant-pagination-total-text {
          color: ${themeColors.text} !important;
          font-weight: 500;
        }
        
        /* Empty state */
        .ant-empty-description {
          color: ${themeColors.text} !important;
        }
        
        /* Spin component */
        .ant-spin-text {
          color: ${themeColors.text} !important;
        }
        
        /* Ensure button in empty state has correct colors */
        .ant-empty-footer button {
          background: ${themeColors.primary} !important;
          border-color: ${themeColors.primary} !important;
          color: ${isDarkMode ? themeColors.text : '#fff'} !important;
        }
        
        /* Global background */
        body {
          background: ${themeColors.background} !important;
        }
      `}</style>
    </div>
  );
};

PastAttendance.propTypes = {
  units: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      code: PropTypes.string,
      department: PropTypes.shape({
        name: PropTypes.string,
      }),
      year: PropTypes.number,
      semester: PropTypes.number,
      studentsEnrolled: PropTypes.arrayOf(PropTypes.string),
    })
  ),
  lecturerId: PropTypes.string,
};

PastAttendance.defaultProps = {
  units: [],
  lecturerId: null,
};

export default PastAttendance;