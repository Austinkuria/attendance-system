import { useState } from "react";
import { Button, Table, Modal, Select, Input, Space } from "antd";
// import QRCode from "qrcode.react";
import {
//   generateQRCode,
  getAttendanceData,
  downloadAttendanceReport,
} from "../services/api";

const { Option } = Select;

const AttendanceManagement = () => {
//   const [qrCode, setQRCode] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const handleGenerateQR = async () => {
    if (!selectedUnit) {
      Modal.error({ title: "Error", content: "Please select a unit first." });
      return;
    }
    // const qrRes = await generateQRCode(selectedUnit);
    // setQRCode(qrRes.qrCode);
    setIsQRModalOpen(true);
  };

  const handleViewAttendance = async () => {
    if (!selectedUnit) {
      Modal.error({ title: "Error", content: "Please select a unit first." });
      return;
    }
    const attendanceRes = await getAttendanceData(selectedUnit);
    setAttendance(attendanceRes);
  };

  const handleDownloadReport = async () => {
    if (!selectedUnit) {
      Modal.error({ title: "Error", content: "Please select a unit first." });
      return;
    }
    await downloadAttendanceReport(selectedUnit);
  };

  const filteredAttendance = attendance.filter((record) =>
    record.student.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="p-4">
      <h2>Attendance Management</h2>
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="Select Unit"
          style={{ width: 200 }}
          onChange={(value) => setSelectedUnit(value)}
          value={selectedUnit}
        >
          <Option value="unit1">Unit 1</Option>
          <Option value="unit2">Unit 2</Option>
          <Option value="unit3">Unit 3</Option>
        </Select>
        <Button onClick={handleGenerateQR}>Generate QR Code</Button>
        <Button onClick={handleViewAttendance}>View Attendance</Button>
        <Button onClick={handleDownloadReport}>Download Report</Button>
      </Space>
      <Input
        placeholder="Search by student name"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginBottom: 16, width: 200 }}
      />
      <Table
        columns={[
          { title: "Student", dataIndex: "student", key: "student" },
          { title: "Status", dataIndex: "status", key: "status" },
          { title: "Timestamp", dataIndex: "timestamp", key: "timestamp" },
        ]}
        dataSource={filteredAttendance}
      />
      <Modal
        title="QR Code"
        open={isQRModalOpen}
        onCancel={() => setIsQRModalOpen(false)}
        footer={null}
      >
        {/* {qrCode && <QRCode value={qrCode} size={256} />} */}
      </Modal>
    </div>
  );
};

export default AttendanceManagement;