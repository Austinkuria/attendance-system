import { useState, useEffect, useMemo } from 'react'; 
import { 
  Button, 
  Table, 
  Modal, 
  Select, 
  Input, 
  Space, 
  Card, 
  Tag, 
  Skeleton,
  message,
  Grid,
  Typography,
  Statistic,
  Row,
  Col
} from 'antd';
import { 
  QrcodeOutlined, 
  DownloadOutlined, 
  SearchOutlined, 
  FilterOutlined,
  CalendarOutlined,
  BookOutlined,
  TeamOutlined,
  PercentageOutlined,
  ScheduleOutlined
} from '@ant-design/icons';
// import { QRCode } from 'qrcode.react';
import {
  generateQRCode,
  getAttendanceData,
  downloadAttendanceReport,
  getLecturerUnits,
  getUnitEnrollments
} from '../services/api';

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Title, Text } = Typography;

const AttendanceManagement = () => {
  const screens = useBreakpoint();
  const [attendance, setAttendance] = useState([]);
  const [units, setUnits] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrData, setQrData] = useState('');
  const [loading, setLoading] = useState({
    units: true,
    attendance: false,
    stats: false
  });
  const [filters, setFilters] = useState({
    search: '',
    year: null,
    semester: null,
    status: null
  });

  // Fetch lecturer's units and enrollments
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [unitsData, enrollmentsData] = await Promise.all([
          getLecturerUnits(),
          getUnitEnrollments()
        ]);
        setUnits(unitsData);
        setEnrollments(enrollmentsData);
      } catch {
        message.error('Failed to fetch initial data');
      } finally {
        setLoading(prev => ({ ...prev, units: false }));
      }
    };
    
    fetchData();
  }, []);

  // Calculate statistics
  const { totalAssignedUnits, attendanceRate, totalEnrolledStudents } = useMemo(() => {
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const unitEnrollments = enrollments.filter(e => e.unitId === selectedUnit);
    const totalStudents = unitEnrollments.length || 1;
    
    return {
      totalAssignedUnits: units.length,
      attendanceRate: ((presentCount / totalStudents) * 100).toFixed(1),
      totalEnrolledStudents: unitEnrollments.length
    };
  }, [units, attendance, enrollments, selectedUnit]);

  // Process attendance with automatic absent marking
  const processedAttendance = useMemo(() => {
    if (!selectedUnit) return [];
    
    const unitEnrollments = enrollments.filter(e => e.unitId === selectedUnit);
    return unitEnrollments.map(enrollment => {
      const existing = attendance.find(a => a.studentId === enrollment.studentId);
      return existing || { 
        ...enrollment, 
        status: 'absent',
        regNo: enrollment.studentId,
        student: enrollment.studentName,
        course: enrollment.courseName
      };
    });
  }, [attendance, enrollments, selectedUnit]);

  // Filtered attendance data
  const filteredAttendance = useMemo(() => {
    return processedAttendance.filter(record => {
      const matchesSearch = record.student.toLowerCase().includes(filters.search.toLowerCase());
      const matchesYear = filters.year ? record.year === filters.year : true;
      const matchesSemester = filters.semester ? record.semester === filters.semester : true;
      const matchesStatus = filters.status ? record.status === filters.status : true;
      
      return matchesSearch && matchesYear && matchesSemester && matchesStatus;
    });
  }, [processedAttendance, filters]);

  const handleGenerateQR = async () => {
    if (!selectedUnit) {
      message.error('Please select a unit first');
      return;
    }
    
    try {
      const { qrCode } = await generateQRCode(selectedUnit);
      setQrData(qrCode);
      setIsQRModalOpen(true);
    } catch {
      message.error('Failed to generate QR code');
    }
  };

  const handleViewAttendance = async () => {
    if (!selectedUnit) {
      message.error('Please select a unit first');
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, attendance: true, stats: true }));
      const data = await getAttendanceData(selectedUnit);
      setAttendance(data);
    } catch {
      message.error('Failed to fetch attendance data');
    } finally {
      setLoading(prev => ({ ...prev, attendance: false, stats: false }));
    }
  };

  const handleDownloadReport = async () => {
    if (!selectedUnit) {
      message.error('Please select a unit first');
      return;
    }
    
    try {
      await downloadAttendanceReport(selectedUnit);
      message.success('Report download started');
    } catch {
      message.error('Failed to download report');
    }
  };

  const columns = [
    {
      title: 'Student',
      dataIndex: 'student',
      key: 'student',
      responsive: ['md']
    },
    {
      title: 'Reg Number',
      dataIndex: 'regNo',
      key: 'regNo',
      responsive: ['md']
    },
    {
      title: 'Course',
      dataIndex: 'course',
      key: 'course',
      responsive: ['lg']
    },
    {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
      render: year => <Tag color="blue">Year {year}</Tag>,
      responsive: ['sm']
    },
    {
      title: 'Semester',
      dataIndex: 'semester',
      key: 'semester',
      render: semester => <Tag color="geekblue">Semester {semester}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => (
        <Tag color={status === 'present' ? 'green' : 'volcano'}>
          {status.toUpperCase()}
        </Tag>
      )
    }
  ];

  const summaryCards = (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} md={8}>
        <Card>
          <Statistic
            title="Assigned Units"
            value={totalAssignedUnits}
            prefix={<TeamOutlined />}
            loading={loading.stats}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Card>
          <Statistic
            title="Attendance Rate"
            value={attendanceRate}
            suffix="%"
            prefix={<PercentageOutlined />}
            loading={loading.stats}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Card>
          <Statistic
            title="Enrolled Students"
            value={totalEnrolledStudents}
            prefix={<ScheduleOutlined />}
            loading={loading.stats}
          />
        </Card>
      </Col>
    </Row>
  );

  return (
    <div style={{ padding: screens.md ? 24 : 16 }}>
      <Card
        title={<Title level={4} style={{ margin: 0 }}>Attendance Management</Title>}
        extra={
          <Space wrap>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownloadReport}
              disabled={!selectedUnit}
            >
              {screens.md ? 'Download Report' : 'Download'}
            </Button>
            <Button
              type="primary"
              icon={<QrcodeOutlined />}
              onClick={handleGenerateQR}
              disabled={!selectedUnit}
            >
              {screens.md ? 'Generate QR Code' : 'QR Code'}
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space wrap>
            <Select
              placeholder="Select Unit"
              style={{ width: 200 }}
              onChange={setSelectedUnit}
              value={selectedUnit}
              loading={loading.units}
              options={units.map(unit => ({
                label: unit.name,
                value: unit.id
              }))}
            />
            
            <Button
              onClick={handleViewAttendance}
              loading={loading.attendance}
              disabled={!selectedUnit}
            >
              View Attendance
            </Button>
          </Space>

          {summaryCards}

          <Space wrap style={{ width: '100%' }}>
            <Input
              placeholder="Search students..."
              prefix={<SearchOutlined />}
              style={{ width: 240 }}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
            
            <Select
              placeholder="Filter by Year"
              allowClear
              suffixIcon={<CalendarOutlined />}
              style={{ width: 150 }}
              onChange={year => setFilters(prev => ({ ...prev, year }))}
            >
              {[1, 2, 3, 4].map(year => (
                <Option key={year} value={year}>Year {year}</Option>
              ))}
            </Select>

            <Select
              placeholder="Filter by Semester"
              allowClear
              suffixIcon={<BookOutlined />}
              style={{ width: 170 }}
              onChange={semester => setFilters(prev => ({ ...prev, semester }))}
            >
              {[1, 2, 3].map(sem => (
                <Option key={sem} value={sem}>Semester {sem}</Option>
              ))}
            </Select>

            <Select
              placeholder="Filter by Status"
              allowClear
              suffixIcon={<FilterOutlined />}
              style={{ width: 150 }}
              onChange={status => setFilters(prev => ({ ...prev, status }))}
            >
              <Option value="present">Present</Option>
              <Option value="absent">Absent</Option>
            </Select>
          </Space>

          <Skeleton active loading={loading.attendance}>
            <Table
              columns={columns}
              dataSource={filteredAttendance}
              rowKey="regNo"
              scroll={{ x: true }}
              pagination={{
                pageSize: 8,
                responsive: true,
                showSizeChanger: false
              }}
              locale={{
                emptyText: 'No attendance records found'
              }}
            />
          </Skeleton>
        </Space>
      </Card>

      <Modal
        title="Class QR Code"
        open={isQRModalOpen}
        onCancel={() => setIsQRModalOpen(false)}
        footer={null}
        centered
      >
        <div style={{ textAlign: 'center', padding: 24 }}>
          {qrData && (
            <>
              {/* <QRCode 
                value={qrData} 
                size={256}
                level="H"
                includeMargin
              /> */}
              <Text type="secondary" style={{ marginTop: 16, display: 'block' }}>
                Scan this QR code to mark attendance
              </Text>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AttendanceManagement;