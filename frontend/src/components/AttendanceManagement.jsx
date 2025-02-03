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

  const lecturerId = localStorage.getItem('userId');

  // Fetch lecturer units and set initial selected unit
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setLoading(prev => ({ ...prev, units: true }));
        const unitsData = await getLecturerUnits(lecturerId);
        
        if (!unitsData || unitsData.length === 0) {
          message.warning('No units assigned to this lecturer');
          return;
        }
        
        setUnits(unitsData);
        // Set initial selected unit to first in list
        setSelectedUnit(unitsData[0]?._id);
      } catch (error) {
        console.error('Units fetch error:', error);
        message.error('Failed to fetch units');
      } finally {
        setLoading(prev => ({ ...prev, units: false }));
      }
    };

    if (lecturerId) fetchUnits();
  }, [lecturerId]);

  // Fetch enrollments and attendance when unit is selected
  useEffect(() => {
    const fetchUnitData = async () => {
      if (!selectedUnit) return;
      
      try {
        setLoading(prev => ({ ...prev, attendance: true, stats: true }));
        const [attendanceData, enrollmentsData] = await Promise.all([
          getAttendanceData(selectedUnit),
          getUnitEnrollments(selectedUnit)
        ]);
        
        setAttendance(attendanceData);
        setEnrollments(enrollmentsData);
      } catch (error) {
        console.error('Unit data fetch error:', error);
        message.error('Failed to fetch unit data');
      } finally {
        setLoading(prev => ({ ...prev, attendance: false, stats: false }));
      }
    };

    fetchUnitData();
  }, [selectedUnit]);

  // Fix the statistics calculation section - remove duplicate return
const { totalAssignedUnits, attendanceRate, totalEnrolledStudents } = useMemo(() => {
  if (!units || units.length === 0) return {
    totalAssignedUnits: 0,
    attendanceRate: 0,
    totalEnrolledStudents: 0
  };

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const totalStudents = enrollments.length || 1;
  
  return {
    totalAssignedUnits: units.length,
    attendanceRate: Number(((presentCount / totalStudents) * 100).toFixed(1)),
    totalEnrolledStudents: enrollments.length
  };
}, [units, attendance, enrollments]); // Remove selectedUnit from dependencies
  // Process attendance data
  const processedAttendance = useMemo(() => {
    if (!selectedUnit) return [];
    
    return enrollments
      .filter(e => e.unitId === selectedUnit)
      .map(enrollment => {
        const existing = attendance.find(a => 
          a.student === enrollment._id && 
          a.unit === selectedUnit
        );
        
        return existing || {
          _id: enrollment._id,
          regNo: enrollment.regNo,
          student: `${enrollment.firstName} ${enrollment.lastName}`,
          course: enrollment.course?.name || 'N/A',
          year: enrollment.year,
          semester: enrollment.semester,
          status: 'absent',
          unit: selectedUnit
        };
      });
  }, [attendance, enrollments, selectedUnit]);

  // Apply filters
  const filteredAttendance = useMemo(() => {
    return processedAttendance.filter(record => {
      const searchMatch = record.student.toLowerCase().includes(filters.search.toLowerCase());
      const yearMatch = filters.year ? record.year === filters.year : true;
      const semesterMatch = filters.semester ? record.semester === filters.semester : true;
      const statusMatch = filters.status ? record.status === filters.status : true;
      
      return searchMatch && yearMatch && semesterMatch && statusMatch;
    });
  }, [processedAttendance, filters]);

  // Generate QR Code
  const handleGenerateQR = async () => {
    if (!selectedUnit) {
      message.error('Please select a unit first');
      return;
    }
    
    try {
      const { qrCode } = await generateQRCode(selectedUnit);
      setQrData(qrCode);
      setIsQRModalOpen(true);
    } catch (error) {
      console.error('QR generation error:', error);
      message.error('Failed to generate QR code');
    }
  };

  // Fetch attendance data
  const handleViewAttendance = async () => {
    if (!selectedUnit) {
      message.error('Please select a unit first');
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, attendance: true, stats: true }));
      const data = await getAttendanceData(selectedUnit);
      setAttendance(data);
    } catch (error) {
      console.error('Attendance fetch error:', error);
      message.error('Failed to fetch attendance data');
    } finally {
      setLoading(prev => ({ ...prev, attendance: false, stats: false }));
    }
  };

  // Toggle attendance status
  const handleToggleStatus = async (recordId) => {
    const record = processedAttendance.find(r => r._id === recordId);
    if (!record) return;
    
    const newStatus = record.status === 'present' ? 'absent' : 'present';
    
    try {
      setAttendance(prev => {
        const index = prev.findIndex(a => a.student === recordId && a.unit === selectedUnit);
        if (index !== -1) {
          const updatedRecord = { ...prev[index], status: newStatus };
          return [
            ...prev.slice(0, index),
            updatedRecord,
            ...prev.slice(index + 1)
          ];
        }
        return [...prev, { ...record, status: newStatus }];
      });
      message.success(`Marked student as ${newStatus}`);
    } catch (error) {
      console.error('Status update error:', error);
      message.error('Failed to update attendance status');
    }
  };

  // Table columns
  const columns = [
    { title: 'Student', dataIndex: 'student', key: 'student', responsive: ['md'] },
    { title: 'Reg Number', dataIndex: 'regNo', key: 'regNo', responsive: ['md'] },
    { title: 'Course', dataIndex: 'course', key: 'course', responsive: ['lg'] },
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
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          onClick={() => handleToggleStatus(record._id)}
        >
          Mark as {record.status === 'present' ? 'Absent' : 'Present'}
        </Button>
      )
    }
  ];

  // Summary cards
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
              onClick={() => downloadAttendanceReport(selectedUnit)}
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
                value: unit._id
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
              rowKey="_id"
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
              {/* QR Code display implementation */}
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