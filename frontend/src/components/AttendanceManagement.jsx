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
  Typography
} from 'antd';
import { 
  QrcodeOutlined, 
  DownloadOutlined, 
  SearchOutlined, 
  FilterOutlined,
  CalendarOutlined,
  BookOutlined 
} from '@ant-design/icons';
import QRCode from 'qrcode.react';
import {
  generateQRCode,
  getAttendanceData,
  downloadAttendanceReport,
  getLecturerUnits
} from '../services/api';

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Title } = Typography;

const AttendanceManagement = () => {
  const screens = useBreakpoint();
  const [attendance, setAttendance] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrData, setQrData] = useState('');
  const [loading, setLoading] = useState({
    units: true,
    attendance: false
  });
  const [filters, setFilters] = useState({
    search: '',
    year: null,
    semester: null,
    status: null
  });

  // Fetch lecturer's units on mount
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const units = await getLecturerUnits();
        setUnits(units);
      } catch {
        message.error('Failed to fetch units');
      } finally {
        setLoading(prev => ({ ...prev, units: false }));
      }
    };
    
    fetchUnits();
  }, []);

  // Memoized filtered attendance data
  const filteredAttendance = useMemo(() => {
    return attendance.filter(record => {
      const matchesSearch = record.student.toLowerCase().includes(filters.search.toLowerCase());
      const matchesYear = filters.year ? record.year === filters.year : true;
      const matchesSemester = filters.semester ? record.semester === filters.semester : true;
      const matchesStatus = filters.status ? record.status === filters.status : true;
      
      return matchesSearch && matchesYear && matchesSemester && matchesStatus;
    });
  }, [attendance, filters]);

  const handleGenerateQR = async () => {
    if (!selectedUnit) {
      message.error('Please select a unit first');
      return;
    }
    
    try {
      const { qrCode } = await generateQRCode(selectedUnit);
      setQrData(qrCode);
      setIsQRModalOpen(true);
    } catch{
      message.error('Failed to generate QR code');
    }
  };

  const handleViewAttendance = async () => {
    if (!selectedUnit) {
      message.error('Please select a unit first');
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, attendance: true }));
      const data = await getAttendanceData(selectedUnit);
      setAttendance(data);
    } catch {
      message.error('Failed to fetch attendance data');
    } finally {
      setLoading(prev => ({ ...prev, attendance: false }));
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
              rowKey="id"
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
              <QRCode 
                value={qrData} 
                size={256}
                level="H"
                includeMargin
              />
              <p style={{ marginTop: 16, color: 'rgba(0,0,0,0.45)' }}>
                Scan this QR code to mark attendance
              </p>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AttendanceManagement;