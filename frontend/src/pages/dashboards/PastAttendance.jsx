import { useState, useEffect, useCallback, useContext } from 'react';
import { Table, Space, Card, Select, DatePicker, Tag, Skeleton, message, Button, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import axios from 'axios';
import moment from 'moment';
import { getDepartments, getLecturerUnits } from '../../services/api';
import { ThemeContext } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';

const { Option } = Select;
const { Text } = Typography;

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
        `https://attendance-system-w70n.onrender.com/api/attendance/past-lecturer`,
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

  const pastColumns = [
    {
      title: 'Reg Number',
      dataIndex: ['student', 'regNo'],
      key: 'regNo',
      sorter: (a, b) => a.student.regNo.localeCompare(b.student.regNo),
    },
    {
      title: 'First Name',
      dataIndex: ['student', 'firstName'],
      key: 'firstName',
      sorter: (a, b) => a.student.firstName.localeCompare(b.student.firstName),
    },
    {
      title: 'Last Name',
      dataIndex: ['student', 'lastName'],
      key: 'lastName',
      sorter: (a, b) => a.student.lastName.localeCompare(b.student.lastName),
    },
    {
      title: 'Scan Time',
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
      title: 'Status',
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
    <div style={{ padding: 24, background: themeColors.background, minHeight: '100vh' }}>
      <Card
        title={
          <Space>
            <Text strong style={{ color: themeColors.primary }}>Attendance Records for Past Sessions</Text>
          </Space>
        }
        size="small"
        style={cardStyle}
        hoverable
        extra={
          <Space>
            <Button
              type="link"
              onClick={clearFilters}
              disabled={!Object.values(pastFilters).some(Boolean)}
              style={{ color: themeColors.secondary }}
            >
              Clear Filters
            </Button>
            <ThemeToggle />
          </Space>
        }
      >
        <Space wrap style={{ width: '100%', marginBottom: 16 }}>
          <Select
            placeholder="Select Unit"
            style={{ width: 240 }}
            onChange={(value) => setPastFilters((prev) => ({ ...prev, unit: value, sessionId: null }))}
            allowClear
            value={pastFilters.unit}
            loading={loading}
            notFoundContent={loading ? <Skeleton.Button active size="small" /> : 'No units available'}
          >
            {units.length > 0 ? (
              units.map((unit) => (
                <Option key={unit._id} value={unit._id}>{unit.name}</Option>
              ))
            ) : (
              <Option value={null} disabled>No units found</Option>
            )}
          </Select>
          <DatePicker
            defaultValue={moment()}
            placeholder="Select Date"
            style={{ width: 150 }}
            onChange={(_, dateString) => setPastFilters((prev) => ({ ...prev, date: dateString, sessionId: null }))}
            allowClear
          />
          <Select
            placeholder="Select Session"
            style={{ width: 300 }}
            onChange={(value) => setPastFilters((prev) => ({ ...prev, sessionId: value }))}
            allowClear
            value={pastFilters.sessionId}
            loading={loading}
            notFoundContent={loading ? <Skeleton.Button active size="small" /> : 'No sessions available'}
          >
            {pastSessions.length > 0 ? (
              pastSessions
                .filter((session) => moment(session.startTime).format('YYYY-MM-DD') === pastFilters.date)
                .map((session) => (
                  <Option key={session.sessionId} value={session.sessionId}>
                    {`${session.unitName} - ${moment(session.startTime).format('hh:mm A')} - ${moment(session.endTime).format('hh:mm A')} (${moment(session.startTime).format('DD/MM/YYYY')})`}
                  </Option>
                ))
            ) : (
              <Option value={null} disabled>No sessions found</Option>
            )}
          </Select>
        </Space>
        <Skeleton active loading={loading}>
          <Table
            columns={pastColumns}
            dataSource={pastAttendance}
            rowKey="_id"
            scroll={{ x: true }}
            pagination={{ pageSize: 8, responsive: true, showSizeChanger: false, showTotal: (total) => `Total ${total} students` }}
            locale={{ emptyText: 'No past attendance records found' }}
            bordered
            size="middle"
            rowClassName={(record, index) => (index % 2 === 0 ? 'table-row-light' : 'table-row-dark')}
          />
        </Skeleton>
      </Card>
      <Button
        type="primary"
        onClick={() => navigate('/lecturer-dashboard')}
        style={{ background: themeColors.primary, borderColor: themeColors.primary, borderRadius: 8 }}
      >
        Back to Attendance Management
      </Button>

      <style>{`
        .ant-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }
        .table-row-light {
          background: ${themeColors.cardBg};
        }
        .table-row-dark {
          background: ${themeColors.background};
        }
        .ant-table-thead > tr > th {
          background: ${themeColors.primary};
          color: #fff;
          font-weight: 600;
          border-bottom: 2px solid ${themeColors.primary};
          padding: 16px 8px;
        }
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid ${themeColors.text}20;
          padding: 12px 8px;
          color: ${themeColors.text};
        }
        .ant-table-tbody > tr:hover:not(.ant-table-expanded-row) > td {
          background: ${themeColors.text}10;
        }
        .ant-table {
          border: 1px solid ${themeColors.primary};
          border-radius: 8px;
          width: 100%;
        }
        .ant-btn-primary {
          background: ${themeColors.primary};
          border-color: ${themeColors.primary};
          color: #fff;
        }
        .ant-btn-primary:hover, .ant-btn-primary:focus {
          background: ${isDarkMode ? '#8E86E5' : '#5A4FCF'};
          border-color: ${isDarkMode ? '#8E86E5' : '#5A4FCF'};
          color: #fff;
        }
        .ant-btn-link {
          color: ${themeColors.secondary};
        }
        .ant-btn-link:hover, .ant-btn-link:focus {
          color: ${isDarkMode ? '#81ECEC' : '#00A8B5'};
        }
        .ant-select-selector {
          background: ${themeColors.cardBg} !important;
          color: ${themeColors.text} !important;
          border-color: ${themeColors.primary} !important;
          border-radius: 6px !important;
        }
        .ant-picker {
          background: ${themeColors.cardBg} !important;
          color: ${themeColors.text} !important;
          border-color: ${themeColors.primary} !important;
          border-radius: 6px !important;
        }
        .ant-select-dropdown, .ant-picker-dropdown {
          background: ${themeColors.cardBg} !important;
          color: ${themeColors.text} !important;
        }
        .ant-select-item-option-content {
          color: ${themeColors.text} !important;
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