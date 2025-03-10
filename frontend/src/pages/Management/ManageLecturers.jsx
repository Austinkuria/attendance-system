import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Button,
  Alert,
  message,
  Skeleton,
  Row,
  Col,
  Spin, // Added Spin
  Switch, // added for dark mode toggle
} from "antd";
import {
  SearchOutlined,
  UserAddOutlined,
  ExclamationCircleOutlined,
  LeftOutlined,
  EditOutlined,
  DeleteOutlined,
  IdcardOutlined,
  BookOutlined,
  UnorderedListOutlined,
  ArrowUpOutlined,
  DownloadOutlined,
  ImportOutlined,
} from "@ant-design/icons";
import {
  getLecturers,
  deleteLecturer,
  addLecturer,
  updateLecturer,
  getUnits,
  getDepartments,
  downloadLecturers,
} from "../../services/api";
import api from "../../services/api";

const { Content } = Layout;
const { Option } = Select;

const ManageLecturers = () => {
  const navigate = useNavigate();
  const [lecturers, setLecturers] = useState([]);
  const [units, setUnits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState("");
  const [globalSuccess, setGlobalSuccess] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterUnit, setFilterUnit] = useState("");

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isUnitsModalVisible, setIsUnitsModalVisible] = useState(false);

  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [lecturerToDelete, setLecturerToDelete] = useState(null);
  const [selectedLecturerForUnits, setSelectedLecturerForUnits] = useState(null);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [unitForm] = Form.useForm();

  const [showBackToTop, setShowBackToTop] = useState(false);
  const [file, setFile] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false); // dark mode state added

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth/login");
    }
  }, [navigate]);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true); // Trigger global spinner
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/auth/login");
          return;
        }
        const [lecturerRes, unitsRes, deptsRes] = await Promise.all([
          getLecturers(),
          getUnits(),
          getDepartments(),
        ]);
        if (isMounted) {
          setLecturers(lecturerRes || []);
          setUnits(unitsRes || []);
          setDepartments(deptsRes || []);
          setGlobalError("");
        }
      } catch {
        if (isMounted) {
          setGlobalError("Failed to load lecturer data. Please try again later.");
          setLecturers([]);
        }
      } finally {
        if (isMounted) setLoading(false); // Hide global spinner
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const filteredLecturers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return lecturers.filter((l) => {
      const fullName = `${l.firstName} ${l.lastName}`.toLowerCase();
      const email = l.email.toLowerCase();
      const assignedUnits = (Array.isArray(l.assignedUnits) ? l.assignedUnits : [])
        .map((u) => String(u?.code || "").toLowerCase());
      const matchesSearch =
        fullName.includes(query) ||
        email.includes(query) ||
        assignedUnits.some((unit) => unit.includes(query));
      const matchesDept = filterDepartment
        ? l.department?._id === filterDepartment
        : true;
      const matchesUnit = filterUnit
        ? assignedUnits.includes(filterUnit.toLowerCase())
        : true;
      return matchesSearch && matchesDept && matchesUnit;
    });
  }, [lecturers, searchQuery, filterDepartment, filterUnit]);

  const openUnitsModal = (lecturer) => {
    setSelectedLecturerForUnits(lecturer);
    unitForm.resetFields();
    setIsUnitsModalVisible(true);
  };

  const handleAddLecturer = async () => {
    try {
      const values = await addForm.validateFields();
      setLoading(true); // Trigger modal spinner
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/auth/login");
        return;
      }
      const response = await addLecturer({ ...values, role: "lecturer" });
      if (response?.message === "Lecturer created successfully") {
        const updated = await getLecturers();
        setLecturers(updated || []);
        addForm.resetFields();
        setIsAddModalVisible(false);
        message.success("Lecturer added successfully");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to create lecturer";
      if (errorMessage.includes("already exists")) {
        message.warning("This lecturer already exists. Try using a different email.");
      } else {
        message.error(errorMessage);
      }
      setGlobalError(errorMessage);
    } finally {
      setLoading(false); // Hide modal spinner
    }
  };

  const handleEditLecturer = async () => {
    try {
      const values = await editForm.validateFields();
      setLoading(true); // Trigger modal spinner
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/auth/login");
        return;
      }
      if (!selectedLecturer?._id) {
        message.error("Selected lecturer is invalid.");
        return;
      }
      const updatedLecturer = { ...selectedLecturer, ...values };
      const response = await updateLecturer(selectedLecturer._id, updatedLecturer);
      if (response?.message === "Lecturer updated successfully") {
        const updated = await getLecturers();
        setLecturers(updated || []);
        editForm.resetFields();
        setIsEditModalVisible(false);
        message.success("Lecturer updated successfully");
      } else {
        message.error("Failed to update lecturer");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to update lecturer";
      message.error(errorMessage);
    } finally {
      setLoading(false); // Hide modal spinner
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true); // Trigger modal spinner
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/auth/login");
        return;
      }
      await deleteLecturer(lecturerToDelete);
      setLecturers((prev) => prev.filter((l) => l._id !== lecturerToDelete));
      setIsDeleteModalVisible(false);
      message.success("Lecturer deleted successfully");
    } catch {
      setGlobalError("Failed to delete lecturer. Please try again later.");
      message.error("Failed to delete lecturer");
    } finally {
      setLoading(false); // Hide modal spinner
    }
  };

  const handleAssignUnit = async () => {
    try {
      const { newUnit } = await unitForm.validateFields();
      if (!newUnit || !selectedLecturerForUnits) return;
      setLoading(true); // Trigger modal spinner
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/auth/login");
        return;
      }
      const unitToAdd = units.find((unit) => unit._id === newUnit);
      if (!unitToAdd) {
        throw new Error("Unit not found");
      }
      const updatedUnits = [
        ...(Array.isArray(selectedLecturerForUnits.assignedUnits)
          ? selectedLecturerForUnits.assignedUnits
          : []),
        unitToAdd,
      ];
      const updatedLecturer = {
        ...selectedLecturerForUnits,
        assignedUnits: updatedUnits,
      };
      const response = await updateLecturer(selectedLecturerForUnits._id, updatedLecturer);
      if (response?.message === "Lecturer updated successfully") {
        const updated = await getLecturers();
        setLecturers(updated || []);
        setSelectedLecturerForUnits(updatedLecturer);
        unitForm.resetFields();
        setIsUnitsModalVisible(false);
        message.success("Unit assigned successfully");
      }
    } catch (err) {
      setGlobalError(err.response?.data?.message || "Failed to assign unit");
      message.error("Failed to assign unit");
    } finally {
      setLoading(false); // Hide modal spinner
    }
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    const validCSVTypes = ["text/csv", "application/vnd.ms-excel"];
    if (selectedFile && validCSVTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
      setGlobalError(null);
    } else {
      setGlobalError("Invalid file type. Please upload a valid CSV file.");
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setGlobalError("Please select a CSV file before importing.");
      return;
    }
    try {
      setLoading(true); // Trigger global spinner
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/auth/login");
        return;
      }
      const formData = new FormData();
      formData.append("csvFile", file);
      const response = await api.post("/lecturers/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.successCount > 0) {
        const updated = await getLecturers();
        setLecturers(updated);
        message.success(`Successfully imported ${response.data.successCount} lecturers`);
      }
      setFile(null);
      if (response.data.errorCount > 0) {
        const errorMessages = response.data.errors
          .map((err, index) => `Row ${index + 1}: ${err.error}`)
          .join("\n");
        setGlobalError(`Some records failed to import:\n${errorMessages}`);
      }
    } catch {
      setGlobalError("CSV import failed. Please check file format and try again.");
      message.error("CSV import failed");
    } finally {
      setLoading(false); // Hide global spinner
    }
  };

  const styles = useMemo(() => ({
    layout: {
      minHeight: "100vh",
      background: isDarkMode ? "#18191a" : "#f0f2f5",
      padding: 0,
      margin: 0,
      width: "100%",
      overflowX: "hidden",
      boxSizing: "border-box",
    },
    headerRow: {
      marginBottom: "16px",
      padding: "8px",
      background: isDarkMode ? "#3a3b3c" : "#fafafa",
      borderRadius: "8px 8px 0 0",
      flexWrap: "wrap",
      gap: "8px",
      alignItems: "center",
      width: "100%",
      boxSizing: "border-box",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    },
    headerTitle: {
      color: isDarkMode ? "#fff" : "#1890ff",
      margin: 0,
      fontSize: "20px",
    },
    content: {
      width: "100%",
      maxWidth: "100%",
      margin: 0,
      padding: "8px",
      background: isDarkMode ? "#242526" : "#fff",
      borderRadius: 8,
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
      boxSizing: "border-box",
      overflowX: "hidden",
    },
    filtersContainer: {
      // Changed background for full dark appearance on filters
      background: isDarkMode ? "#1f1f1f" : "#fff",
      padding: "8px",
      borderRadius: 4,
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      marginBottom: "16px",
      width: "100%",
      boxSizing: "border-box",
    },
    backToTopButton: {
      position: "fixed",
      bottom: "16px",
      right: "16px",
      zIndex: 1000,
      background: "#1890ff",
      borderColor: "#1890ff",
    },
    table: {
      borderRadius: 8,
      overflow: "hidden",
      background: isDarkMode ? "#242526" : "#fff",
      width: "100%",
      margin: 0,
      padding: 0,
      boxSizing: "border-box",
    },
    actionsContainer: {
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
    },
    unitTag: {
      background: "#d9d9d9",
      padding: "4px 8px",
      marginRight: "4px",
      borderRadius: "4px",
      display: "inline-block",
    },
    modalHeader: {
      padding: "12px 16px",
      background: "#1890ff",
      color: "#fff",
      borderRadius: "8px 8px 0 0",
    },
    modalContent: {
      // Updated modal background for dark mode
      padding: "16px",
      boxSizing: "border-box",
      background: isDarkMode ? "#1f1f1f" : "#fff",
      color: isDarkMode ? "#fff" : "#000",
    },
    responsiveOverrides: `
      /* Dark mode overrides for various components */
      .ant-input::placeholder {
        color: ${isDarkMode ? "#ccc" : "#999"};
      }
      .ant-select-selection-placeholder {
        color: ${isDarkMode ? "#ccc" : "#999"} !important;
      }
      .ant-modal .ant-modal-content {
        background: ${isDarkMode ? "#1f1f1f" : "#fff"} !important;
      }
      .ant-modal .ant-modal-body {
        background: ${isDarkMode ? "#1f1f1f" : "#fff"} !important;
        color: ${isDarkMode ? "#fff" : "#000"} !important;
      }
      .ant-btn:hover {
        background: ${isDarkMode ? "#4a4b4c" : "#e6f7ff"};
      }
      .ant-form-item-label > label {
        color: ${isDarkMode ? "#fff" : "#000"} !important;
      }
      .ant-input, .ant-select-selector {
        background: ${isDarkMode ? "#3a3b3c" : "#fff"} !important;
        color: ${isDarkMode ? "#fff" : "#000"} !important;
      }
      .ant-table-thead > tr > th {
        background: ${isDarkMode ? "#3a3b3c" : "#fafafa"} !important;
        color: ${isDarkMode ? "#fff" : "#000"} !important;
      }
      .ant-table-tbody > tr > td {
        background: ${isDarkMode ? "#242526" : "#fff"} !important;
        color: ${isDarkMode ? "#fff" : "#000"} !important;
      }
      html, body, #root {
        margin: 0;
        padding: 0;
        width: 100%;
        overflow-x: hidden;
      }
      .ant-layout, .ant-layout-content {
        padding: 0 !important;
        margin: 0 !important;
      }
      @media (max-width: 768px) {
        .ant-layout-content { 
          padding: 4px !important; 
        }
        .filters-container { 
          padding: 4px !important; 
        }
        .header-row { 
          padding: 4px !important; 
        }
        .ant-btn {
          font-size: 12px;
          padding: 4px 8px;
        }
        .ant-modal {
          width: 90% !important;
          margin: 0 auto;
        }
        .back-to-top-btn {
          bottom: 40px;
          right: 10px;
        }
      }
      @media (max-width: 576px) {
        .ant-layout-content { 
          padding: 2px !important; 
        }
        .filters-container { 
          padding: 2px !important; 
          margin-bottom: 8px !important;
        }
        .header-row { 
          padding: 2px !important; 
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }
        .ant-row:not(.header-row) {
          flex-direction: column;
          margin: 0;
        }
        .ant-col {
          width: 100%;
          margin-bottom: 8px;
          padding: 0;
        }
        .ant-table {
          font-size: 12px;
        }
        .ant-modal {
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .ant-modal-content {
          border-radius: 0;
        }
        .back-to-top-btn {
          bottom: 30px;
          right: 5px;
          width: 32px;
          height: 32px;
          font-size: 14px;
        }
        .ant-alert {
          margin-bottom: 8px !important;
        }
      }
    `,
  }), [isDarkMode]);

  const columns = [
    {
      title: (
        <>
          <IdcardOutlined style={{ marginRight: 4, color: "#1890ff" }} />
          Name
        </>
      ),
      dataIndex: "firstName",
      key: "name",
      render: (text, record) => (
        <span style={{ fontWeight: 500, color: "#1890ff" }}>
          {record.firstName} {record.lastName}
        </span>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: (
        <>
          <BookOutlined style={{ marginRight: 4, color: "#1890ff" }} />
          Department
        </>
      ),
      dataIndex: "department",
      key: "department",
      render: (dept) => (dept ? dept.name : "N/A"),
    },
    {
      title: "Assigned Units",
      key: "assignedUnits",
      render: (_, record) => (
        <Button
          type="default"
          icon={<UnorderedListOutlined />}
          onClick={() => openUnitsModal(record)}
          size="small"
        >
          Units
        </Button>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div style={styles.actionsContainer}>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            style={{ background: "#1890ff", borderColor: "#1890ff" }}
            onClick={() => {
              setSelectedLecturer(record);
              editForm.setFieldsValue({
                firstName: record.firstName,
                lastName: record.lastName,
                email: record.email,
                department: record.department?._id,
              });
              setIsEditModalVisible(true);
            }}
          >
            Edit
          </Button>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            size="small"
            style={{ background: "#f5222d", borderColor: "#f5222d" }}
            onClick={() => {
              setLecturerToDelete(record._id);
              setIsDeleteModalVisible(true);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout style={styles.layout}>
      <Content style={styles.content} className="ant-layout-content">
        <style>{styles.responsiveOverrides}</style>
        <Spin spinning={loading} tip="Loading data...">
          <Row
            justify="space-between"
            align="middle"
            style={styles.headerRow}
            className="header-row"
          >
            <Button
              type="link"
              icon={<LeftOutlined />}
              onClick={() => navigate("/admin")}
            >
              Back to Admin
            </Button>
            <h2 style={styles.headerTitle}>Lecturer Management</h2>
            {/* Added dark/light mode toggle */}
            <Switch
              checked={isDarkMode}
              onChange={(checked) => setIsDarkMode(checked)}
              checkedChildren="Dark"
              unCheckedChildren="Light"
            />
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              style={{ background: "#1890ff", borderColor: "#1890ff" }}
              onClick={() => {
                addForm.resetFields();
                setIsAddModalVisible(true);
              }}
            >
              Add Lecturer
            </Button>
          </Row>

          {showBackToTop && (
            <Button
              type="primary"
              shape="circle"
              icon={<ArrowUpOutlined />}
              style={styles.backToTopButton}
              className="back-to-top-btn"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            />
          )}

          {globalError && (
            <Alert
              message={globalError}
              type="error"
              closable
              onClose={() => setGlobalError("")}
            />
          )}
          {globalSuccess && (
            <Alert
              message={globalSuccess}
              type="success"
              closable
              onClose={() => setGlobalSuccess("")}
            />
          )}

          <div style={styles.filtersContainer} className="filters-container">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Input
                  placeholder="Search by name, email, or unit code..."
                  prefix={<SearchOutlined />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </Col>
              <Col xs={24} md={8}>
                <Select
                  placeholder="All Departments"
                  value={filterDepartment || undefined}
                  onChange={(value) => setFilterDepartment(value)}
                  style={{ width: "100%" }}
                  allowClear
                >
                  {departments.map((dept) => (
                    <Option key={dept._id} value={dept._id}>
                      {dept.name}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} md={8}>
                <Select
                  placeholder="All Assigned Units"
                  value={filterUnit || undefined}
                  onChange={(value) => setFilterUnit(value)}
                  style={{ width: "100%" }}
                  allowClear
                >
                  {units.map((unit) => (
                    <Option key={unit.code} value={unit.code}>
                      {unit.code} – {unit.name}
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Row gutter={8} align="middle">
                  <Col flex="auto">
                    <Input type="file" accept=".csv" onChange={handleFileUpload} />
                  </Col>
                  <Col>
                    <Button
                      type="primary"
                      icon={<ImportOutlined />}
                      disabled={!file}
                      style={{ background: "#1890ff", borderColor: "#1890ff" }}
                      onClick={handleImport}
                    >
                      {file ? `Import ${file.name}` : "CSV Import"}
                    </Button>
                  </Col>
                </Row>
              </Col>
              <Col xs={24} md={8}>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  block
                  style={{ background: "#1890ff", borderColor: "#1890ff" }}
                  onClick={async () => {
                    try {
                      await downloadLecturers();
                    } catch {
                      setGlobalError("Failed to download lecturers");
                      message.error("Failed to download lecturers");
                    }
                  }}
                >
                  Export
                </Button>
              </Col>
            </Row>
          </div>

          {loading ? (
            <Skeleton active />
          ) : (
            <Table
              dataSource={filteredLecturers}
              columns={columns}
              rowKey="_id"
              scroll={{ x: "max-content", y: 400 }}
              style={styles.table}
              className="ant-table-custom"
            />
          )}
        </Spin>
      </Content>

      <Modal
        title={<span style={styles.modalHeader}>Add New Lecturer</span>}
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsAddModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleAddLecturer}
            loading={loading}
            style={{ background: "#1890ff", borderColor: "#1890ff" }}
          >
            Add Lecturer
          </Button>,
        ]}
        styles={{ body: styles.modalContent }}
      >
        <Spin spinning={loading} tip="Loading data...">
          <Form form={addForm} layout="vertical">
            <Form.Item
              label="First Name"
              name="firstName"
              rules={[{ required: true, message: "First name is required" }]}
            >
              <Input placeholder="Enter first name" />
            </Form.Item>
            <Form.Item
              label="Last Name"
              name="lastName"
              rules={[{ required: true, message: "Last name is required" }]}
            >
              <Input placeholder="Enter last name" />
            </Form.Item>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Email is required" },
                { type: "email", message: "Invalid email format" },
              ]}
            >
              <Input placeholder="Enter email" />
            </Form.Item>
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Password is required" }]}
            >
              <Input.Password placeholder="Enter password" />
            </Form.Item>
            <Form.Item
              label="Department"
              name="department"
              rules={[{ required: true, message: "Department is required" }]}
            >
              <Select placeholder="Select Department">
                {departments.map((dept) => (
                  <Option key={dept._id} value={dept._id}>
                    {dept.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      <Modal
        title={<span style={styles.modalHeader}>Edit Lecturer</span>}
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsEditModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleEditLecturer}
            loading={loading}
            style={{ background: "#1890ff", borderColor: "#1890ff" }}
          >
            Save Changes
          </Button>,
        ]}
        styles={{ body: styles.modalContent }}
      >
        <Spin spinning={loading} tip="Loading data...">
          <Form form={editForm} layout="vertical">
            <Form.Item label="First Name" name="firstName">
              <Input placeholder="First name" />
            </Form.Item>
            <Form.Item label="Last Name" name="lastName">
              <Input placeholder="Last name" />
            </Form.Item>
            <Form.Item label="Email" name="email">
              <Input placeholder="Email" />
            </Form.Item>
            <Form.Item label="Department" name="department">
              <Select placeholder="Select Department">
                {departments.map((dept) => (
                  <Option key={dept._id} value={dept._id}>
                    {dept.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      <Modal
        title={<span style={styles.modalHeader}>Confirm Deletion</span>}
        open={isDeleteModalVisible}
        onCancel={() => setIsDeleteModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsDeleteModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            onClick={handleConfirmDelete}
            loading={loading}
            style={{ background: "#f5222d", borderColor: "#f5222d" }}
          >
            Delete Lecturer
          </Button>,
        ]}
        styles={{ body: styles.modalContent }}
      >
        <Spin spinning={loading} tip="Loading data...">
          <p style={{ color: "#f5222d" }}>
            <ExclamationCircleOutlined style={{ marginRight: 8 }} />
            Are you sure you want to delete this lecturer? This action cannot be undone.
          </p>
        </Spin>
      </Modal>

      <Modal
        title={
          <span style={styles.modalHeader}>
            Assigned Units for{" "}
            {selectedLecturerForUnits &&
              `${selectedLecturerForUnits.firstName} ${selectedLecturerForUnits.lastName}`}
          </span>
        }
        open={isUnitsModalVisible}
        onCancel={() => setIsUnitsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsUnitsModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="assign"
            type="primary"
            onClick={handleAssignUnit}
            loading={loading}
            style={{ background: "#1890ff", borderColor: "#1890ff" }}
          >
            Assign Unit
          </Button>,
        ]}
        styles={{ body: styles.modalContent }}
      >
        <Spin spinning={loading} tip="Loading data...">
          {selectedLecturerForUnits && (
            <>
              <p>
                <strong>Current Units:</strong>
              </p>
              <div style={{ marginBottom: 16 }}>
                {Array.isArray(selectedLecturerForUnits.assignedUnits) &&
                  selectedLecturerForUnits.assignedUnits.length > 0 ? (
                  selectedLecturerForUnits.assignedUnits.map((unit) => (
                    <span key={unit._id} style={styles.unitTag}>
                      {unit.name || unit.code}
                    </span>
                  ))
                ) : (
                  <span style={{ color: "#999" }}>No units assigned</span>
                )}
              </div>
              <Form form={unitForm} layout="vertical">
                <Form.Item
                  name="newUnit"
                  label={
                    <>
                      <BookOutlined style={{ marginRight: 4, color: "#1890ff" }} /> Assign New Unit
                    </>
                  }
                  rules={[{ required: true, message: "Please select a unit" }]}
                >
                  <Select placeholder="Select a unit">
                    {units
                      .filter(
                        (unit) =>
                          !selectedLecturerForUnits.assignedUnits.some(
                            (assignedUnit) => assignedUnit._id === unit._id
                          )
                      )
                      .map((unit) => (
                        <Option key={unit._id} value={unit._id}>
                          {unit.name} – {unit.code}
                        </Option>
                      ))}
                  </Select>
                </Form.Item>
              </Form>
            </>
          )}
        </Spin>
      </Modal>
    </Layout>
  );
};

export default ManageLecturers;