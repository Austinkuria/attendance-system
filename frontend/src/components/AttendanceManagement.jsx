// src/components/AttendanceManagement.jsx
import  { useState } from 'react';
import { Button, Table, Modal, Select, Input } from 'antd';
// import QRCode from 'qrcode.react';
// import QRCodeGenerator from './QRCodeGenerator';
import {  getAttendanceData, downloadAttendanceReport } from '../services/api';

const { Option } = Select;

const AttendanceManagement = () => {
//   const [qrCode, setQRCode] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Helper function to show error modals
  const showError = (msg) => {
    Modal.error({
      title: 'Error',
      content: msg,
    });
  };

//   const handleGenerateQR = async () => {
//     if (!selectedUnit) {
//       showError("Please select a unit first.");
//       return;
//     }
//     try {
//       const qrRes = await generateQRCode(selectedUnit);
//       setQRCode(qrRes.qrCode);
//       setIsQRModalOpen(true);
//     } catch  {
//       showError("Failed to generate QR code.");
//     }
//   };

  const handleViewAttendance = async () => {
    if (!selectedUnit) {
      showError("Please select a unit first.");
      return;
    }
    try {
      const attendanceRes = await getAttendanceData(selectedUnit);
      setAttendance(attendanceRes);
    } catch {
      showError("Failed to fetch attendance data.");
    }
  };

  const handleDownloadReport = async () => {
    if (!selectedUnit) {
      showError("Please select a unit first.");
      return;
    }
    try {
      await downloadAttendanceReport(selectedUnit);
    } catch {
      showError("Failed to download report.");
    }
  };

  const handleUnitChange = (value) => {
    setSelectedUnit(value);
  };

  // Filter attendance based on search query (e.g., by student name)
  const filteredAttendance = attendance.filter(item =>
    item.student?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4">
      <h2>Attendance Management</h2>
      <div style={{ marginBottom: "16px" }}>
        <Select
          placeholder="Select Unit"
          style={{ width: 200, marginRight: "16px" }}
          onChange={handleUnitChange}
          value={selectedUnit}
        >
          <Option value="unit1">Unit 1</Option>
          <Option value="unit2">Unit 2</Option>
          <Option value="unit3">Unit 3</Option>
        </Select>
        <Input
          placeholder="Search by student name"
          style={{ width: 200 }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* QRCodeGenerator triggers QR code generation */}
      {/* <QRCodeGenerator onGenerate={handleGenerateQR} /> */}

      <div style={{ marginTop: "16px" }}>
        <Button onClick={handleViewAttendance} style={{ marginRight: "8px" }}>
          View Attendance
        </Button>
        <Button onClick={handleDownloadReport}>Download Report</Button>
      </div>

      <Table
        style={{ marginTop: "16px" }}
        columns={[
          { title: "Student", dataIndex: ["student", "name"], key: "student" },
          { title: "Status", dataIndex: "status", key: "status" },
          {
            title: "Timestamp",
            dataIndex: "timestamp",
            key: "timestamp",
            render: (text) => new Date(text).toLocaleString(),
          },
        ]}
        dataSource={filteredAttendance}
        rowKey={(record) => record.student?.id || record.timestamp}
      />

      {/* Modal to display the generated QR code */}
      <Modal
        title="QR Code"
        visible={isQRModalOpen}
        onCancel={() => setIsQRModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsQRModalOpen(false)}>
            Close
          </Button>,
        ]}
      >
        {/* {qrCode && <QRCode value={qrCode} size={256} />} */}
      </Modal>
    </div>
  );
};

export default AttendanceManagement;
