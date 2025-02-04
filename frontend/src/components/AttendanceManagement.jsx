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
  Col,
  Badge
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
  ScheduleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import {
  generateQRCode,
  getAttendanceData,
  downloadAttendanceReport,
  getLecturerUnits
} from '../services/api';

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Title, Text } = Typography;

const AttendanceManagement = () => {
  const screens = useBreakpoint();
  const [attendance, setAttendance] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrData, setQrData] = useState('');
  const lecturerId = localStorage.getItem("userId");
  const [loading, setLoading] = useState({
    units: true,
    attendance: false,
    stats: false,
    qr: false
  });
  const [filters, setFilters] = useState({
    search: '',
    year: null,
    semester: null,
    status: null
  });
  const [unitFilters, setUnitFilters] = useState({
    department: null,
    course: null,
    year: null,
    semester: null
  });

  // Extract filter options from units
  const filterOptions = useMemo(() => {
    const departments = new Set();
    const courses = new Set();
    const years = new Set();
    const semesters = new Set();

    units.forEach(unit => {
      if (unit.department?.name) departments.add(unit.department.name);
      if (unit.course?.name) courses.add(unit.course.name);
      if (unit.year) years.add(unit.year);
      if (unit.semester) semesters.add(unit.semester);
    });

    return {
      departments: Array.from(departments).sort(),
      courses: Array.from(courses).sort(),
      years: Array.from(years).sort((a, b) => a - b),
      semesters: Array.from(semesters).sort((a, b) => a - b)
    };
  }, [units]);

  // Filter units based on selections
  const filteredUnits = useMemo(() => {
    return units.filter(unit => {
      const departmentMatch = !unitFilters.department ||
        unit.department?.name === unitFilters.department;
      const courseMatch = !unitFilters.course ||
        unit.course?.name === unitFilters.course;
      const yearMatch = !unitFilters.year || unit.year === unitFilters.year;
      const semesterMatch = !unitFilters.semester ||
        unit.semester === unitFilters.semester;

      return departmentMatch && courseMatch && yearMatch && semesterMatch;
    });
  }, [units, unitFilters]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!lecturerId) {
          message.error("User session expired");
          return;
        }

        setLoading(prev => ({ ...prev, units: true }));

        // Get units assigned to the lecturer
        const unitsData = await getLecturerUnits(lecturerId);

        if (unitsData?.length > 0) {
          setUnits(unitsData);
          setSelectedUnit(unitsData[0]._id);  // Default to first unit
        } else {
          message.info("No units assigned to your account");
        }
      } catch {
        message.error("Failed to load unit data");
      } finally {
        setLoading(prev => ({ ...prev, units: false }));
      }
    };

    if (lecturerId) fetchData();
  }, [lecturerId]);


  // Update selected unit when filters change
  useEffect(() => {
    if (filteredUnits.length > 0 && !filteredUnits.some(u => u._id === selectedUnit)) {
      setSelectedUnit(filteredUnits[0]._id);
    }
  }, [filteredUnits, selectedUnit]);

  // Calculate statistics
  const { totalAssignedUnits, attendanceRate, totalEnrolledStudents } = useMemo(() => {
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const totalStudents = attendance.length || 1;
    return {
      totalAssignedUnits: units.length,
      attendanceRate: totalStudents > 0 ?
        Number(((presentCount / totalStudents) * 100).toFixed(1)) : 0,
      totalEnrolledStudents: attendance.length
    };
  }, [units, attendance]);

  // Process attendance data
  const processedAttendance = useMemo(() => {
    if (!selectedUnit) return [];

    return attendance
      .filter(a => a.unit === selectedUnit)
      .map(record => ({
        ...record,
        student: `${record.firstName} ${record.lastName}`,
        course: record.course?.name || 'N/A'
      }));
  }, [attendance, selectedUnit]);
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
      setLoading(prev => ({ ...prev, qr: true }));
      const { qrCode } = await generateQRCode(selectedUnit);
      setQrData(qrCode);
      setIsQRModalOpen(true);
    } catch (error) {
      console.error('QR generation error:', error);
      message.error('Failed to generate QR code');
    } finally {
      setLoading(prev => ({ ...prev, qr: false }));
    }
  };

  // Fetch attendance data
  const handleViewAttendance = async () => {
    if (!selectedUnit) return;

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

  // Clear all filters
  const clearFilters = () => {
    setUnitFilters({
      department: null,
      course: null,
      year: null,
      semester: null
    });
    setFilters({
      search: '',
      year: null,
      semester: null,
      status: null
    });
  };

  // Table columns
  const columns = [
    {
      title: 'Student',
      dataIndex: 'student',
      key: 'student',
      responsive: ['md'],
      sorter: (a, b) => a.student.localeCompare(b.student)
    },
    {
      title: 'Reg Number',
      dataIndex: 'regNo',
      key: 'regNo',
      responsive: ['md'],
      sorter: (a, b) => a.regNo.localeCompare(b.regNo)
    },
    {
      title: 'Course',
      dataIndex: 'course',
      key: 'course',
      responsive: ['lg'],
      sorter: (a, b) => a.course.localeCompare(b.course)
    },
    {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
      render: year => <Tag color="blue">Year {year}</Tag>,
      responsive: ['sm'],
      sorter: (a, b) => a.year - b.year
    },
    {
      title: 'Semester',
      dataIndex: 'semester',
      key: 'semester',
      render: semester => <Tag color="geekblue">Semester {semester}</Tag>,
      sorter: (a, b) => a.semester - b.semester
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => (
        <Tag color={status === 'present' ? 'green' : 'volcano'}>
          {status.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Present', value: 'present' },
        { text: 'Absent', value: 'absent' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => handleToggleStatus(record._id)}
          icon={<SyncOutlined />}
        >
          Toggle Status
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
              {screens.md ? 'Download Report' : 'Export'}
            </Button>
            <Button
              type="primary"
              icon={<QrcodeOutlined />}
              onClick={handleGenerateQR}
              disabled={!selectedUnit}
              loading={loading.qr}
            >
              {screens.md ? 'Generate QR Code' : 'QR Code'}
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* Unit Filters */}
          <Card
            title="Real-time Unit Filters"
            size="small"
            extra={
              <Button
                type="link"
                onClick={clearFilters}
                disabled={!Object.values(unitFilters).some(Boolean)}
              >
                Clear Filters
              </Button>
            }
          >
            <Space wrap style={{ width: '100%' }}>
              <Select
                placeholder="Department"
                style={{ width: 160 }}
                onChange={val => setUnitFilters(prev => ({ ...prev, department: val }))}
                allowClear
                value={unitFilters.department}
              >
                {filterOptions.departments.map(dept => (
                  <Option key={dept} value={dept}>
                    <Badge color="blue" text={dept} />
                  </Option>
                ))}
              </Select>

              <Select
                placeholder="Course"
                style={{ width: 180 }}
                onChange={val => setUnitFilters(prev => ({ ...prev, course: val }))}
                allowClear
                value={unitFilters.course}
              >
                {filterOptions.courses.map(course => (
                  <Option key={course} value={course}>{course}</Option>
                ))}
              </Select>

              <Select
                placeholder="Year"
                style={{ width: 120 }}
                onChange={val => setUnitFilters(prev => ({ ...prev, year: val }))}
                allowClear
                value={unitFilters.year}
              >
                {filterOptions.years.map(year => (
                  <Option key={year} value={year}>Year {year}</Option>
                ))}
              </Select>

              <Select
                placeholder="Semester"
                style={{ width: 140 }}
                onChange={val => setUnitFilters(prev => ({ ...prev, semester: val }))}
                allowClear
                value={unitFilters.semester}
              >
                {filterOptions.semesters.map(sem => (
                  <Option key={sem} value={sem}>Sem {sem}</Option>
                ))}
              </Select>
            </Space>
          </Card>

          {/* Unit Selection */}
          <Space wrap>
            <Select
              placeholder="Select Unit"
              style={{ width: 240 }}
              onChange={setSelectedUnit}
              value={selectedUnit}
              loading={loading.units}
              optionLabelProp="label"
              options={filteredUnits.map(unit => ({
                label: (
                  <Space>
                    <BookOutlined />
                    {unit.name}
                    <Tag color="blue">{unit.code}</Tag>
                  </Space>
                ),
                value: unit._id
              }))}
            />
            <Button
              onClick={handleViewAttendance}
              loading={loading.attendance}
              disabled={!selectedUnit}
              type="primary"
            >
              Refresh Attendance Data
            </Button>
          </Space>

          {summaryCards}

          {/* Attendance Filters */}
          <Card title="Attendance Records Filter" size="small">
            <Space wrap style={{ width: '100%' }}>
              <Input
                placeholder="Search students..."
                prefix={<SearchOutlined />}
                style={{ width: 240 }}
                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                allowClear
              />

              <Select
                placeholder="Filter by Year"
                allowClear
                suffixIcon={<CalendarOutlined />}
                style={{ width: 150 }}
                onChange={year => setFilters(prev => ({ ...prev, year }))}
                value={filters.year}
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
                value={filters.semester}
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
                value={filters.status}
              >
                <Option value="present">Present</Option>
                <Option value="absent">Absent</Option>
              </Select>
            </Space>
          </Card>

          <Skeleton active loading={loading.attendance}>
            <Table
              columns={columns}
              dataSource={filteredAttendance}
              rowKey="_id"
              scroll={{ x: true }}
              pagination={{
                pageSize: 8,
                responsive: true,
                showSizeChanger: false,
                showTotal: (total) => `Total ${total} students`
              }}
              locale={{
                emptyText: 'No attendance records found'
              }}
              bordered
              size="middle"
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
        destroyOnClose
      >
        <div style={{ textAlign: 'center', padding: 24 }}>
          {qrData && (
            <>
              <img
                src={`data:image/png;base64,${qrData}`}
                alt="Attendance QR Code"
                style={{ width: '100%', maxWidth: 300 }}
              />
              <Text type="secondary" style={{ marginTop: 16, display: 'block' }}>
                Scan this QR code to mark attendance
              </Text>
              <Text code copyable>
                {selectedUnit}
              </Text>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AttendanceManagement;