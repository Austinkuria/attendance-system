import { useState, useEffect, useMemo, useContext } from "react";
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
  Spin,
} from "antd";
import {
  SearchOutlined,
  UserAddOutlined,
  ExclamationCircleOutlined,
  LeftOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  UnorderedListOutlined,
  ArrowUpOutlined,
  DownloadOutlined,
  ImportOutlined,
  UserOutlined,
  MailOutlined,
  ApartmentOutlined
} from "@ant-design/icons";
import { ThemeContext } from '../../context/ThemeContext';
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
import { useTableStyles } from '../../components/SharedTableStyles';
import { useModalStyles } from '../../components/SharedModalStyles';

const { Content } = Layout;
const { Option } = Select;

const ManageLecturers = () => {
  const navigate = useNavigate();
  const { isDarkMode, themeColors } = useContext(ThemeContext);
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
        setLoading(true);
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
        if (isMounted) setLoading(false);
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
      setLoading(true);
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
      message.error(errorMessage);
      setGlobalError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditLecturer = async () => {
    try {
      const values = await editForm.validateFields();
      setLoading(true);
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
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to update lecturer";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const handleAssignUnit = async () => {
    try {
      const { newUnit } = await unitForm.validateFields();
      if (!newUnit || !selectedLecturerForUnits) return;
      setLoading(true);
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
      setLoading(false);
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
      setLoading(true);
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
      setLoading(false);
    }
  };

  const tableStyles = useTableStyles();
  const modalStyles = useModalStyles();

  const styles = useMemo(() => ({
    layout: {
      minHeight: "100vh",
      background: isDarkMode ? themeColors.background : "#f0f2f5",
      padding: 0,
      margin: 0,
      width: "100%",
      overflowX: "hidden",
      boxSizing: "border-box",
    },
    headerRow: {
      marginBottom: "16px",
      padding: "8px",
      background: isDarkMode ? themeColors.cardBg : "#fafafa",
      borderRadius: "8px 8px 0 0",
      flexWrap: "wrap",
      gap: "8px",
      alignItems: "center",
      width: "100%",
      boxSizing: "border-box",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    },
    headerTitle: {
      color: isDarkMode ? themeColors.text : "#1890ff",
      margin: 0,
      fontSize: "20px",
    },
    content: {
      width: "100%",
      maxWidth: "100%",
      margin: 0,
      padding: "8px",
      background: isDarkMode ? themeColors.cardBg : "#fff",
      borderRadius: 8,
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
      boxSizing: "border-box",
      overflowX: "hidden",
    },
    filtersContainer: {
      background: isDarkMode ? themeColors.cardBg : "#fff",
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
      background: themeColors.primary,
      borderColor: themeColors.primary,
    },
    table: {
      borderRadius: 8,
      overflow: "hidden",
      background: isDarkMode ? themeColors.cardBg : "#fff",
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
      background: isDarkMode ? themeColors.secondary : "#d9d9d9",
      color: isDarkMode ? themeColors.text : "#000",
      padding: "4px 8px",
      marginRight: "4px",
      borderRadius: "4px",
      display: "inline-block",
    },
    modalHeader: {
      textAlign: 'center',
      padding: '16px',
      background: themeColors.primary,
      color: themeColors.textInvert,
      borderBottom: `1px solid ${themeColors.border}`,
      borderRadius: '12px 12px 0 0',
      fontWeight: 600,
      fontSize: '18px',
    },
    modalContent: {
      padding: "16px",
      boxSizing: "border-box",
      background: isDarkMode ? themeColors.cardBg : "#fff",
      color: isDarkMode ? themeColors.text : "#000",
    },
    responsiveOverrides: `
      .ant-input,
      .ant-select-selector,
      .ant-input-password {
        background: ${isDarkMode ? themeColors.cardBg : "#fff"} !important;
        color: ${isDarkMode ? themeColors.text : "#000"} !important;
        border-color: ${isDarkMode ? themeColors.secondary : "#d9d9d9"} !important;
      }
      .ant-input:focus,
      .ant-input-focused,
      .ant-input-password:focus,
      .ant-input-password-focused {
        background: ${isDarkMode ? themeColors.cardBg : "#fff"} !important;
        color: ${isDarkMode ? themeColors.text : "#000"} !important;
        border-color: ${isDarkMode ? themeColors.primary : "#40a9ff"} !important;
        box-shadow: 0 0 0 2px ${isDarkMode ? "rgba(24, 144, 255, 0.2)" : "rgba(24, 144, 255, 0.2)"} !important;
      }
      .ant-input:-webkit-autofill,
      .ant-input-password:-webkit-autofill {
        -webkit-box-shadow: 0 0 0 1000px ${isDarkMode ? themeColors.cardBg : "#fff"} inset !important;
        -webkit-text-fill-color: ${isDarkMode ? themeColors.text : "#000"} !important;
        caret-color: ${isDarkMode ? themeColors.text : "#000"} !important;
      }
      .ant-input::placeholder,
      .ant-select-selection-placeholder {
        color: ${isDarkMode ? themeColors.textSecondary : "#999"} !important; // Changed from hardcoded #a0a0a0
      }
      .ant-form-item {
        background: transparent !important;
      }
      .ant-form-item-label > label {
        color: ${isDarkMode ? themeColors.text : "#000"} !important;
      }
      .ant-table-thead > tr > th {
        background: ${isDarkMode ? themeColors.cardBg : "#fafafa"} !important;
        color: ${isDarkMode ? themeColors.text : "#000"} !important;
      }
      .ant-table-tbody > tr > td {
        background: ${isDarkMode ? themeColors.cardBg : "#fff"} !important;
        color: ${isDarkMode ? themeColors.text : "#000"} !important;
      }
      .ant-modal-content,
      .ant-modal-body {
        background: ${isDarkMode ? themeColors.cardBg : "#fff"} !important;
        color: ${isDarkMode ? themeColors.text : "#000"} !important;
      }
      .ant-modal-header {
        background: ${isDarkMode ? themeColors.cardBg : "#fafafa"} !important;
        border-bottom: ${isDarkMode ? `1px solid ${themeColors.secondary}` : "1px solid #f0f0f0"} !important;
      }
      .ant-modal-title {
        color: ${isDarkMode ? themeColors.text : "#000"} !important;
      }
      .ant-modal-close-x {
        color: ${isDarkMode ? themeColors.text : "#000"} !important;
      }
      .ant-select-dropdown {
        background: ${isDarkMode ? themeColors.cardBg : "#fff"} !important;
      }
      .ant-select-item {
        color: ${isDarkMode ? themeColors.text : "#000"} !important;
        background: ${isDarkMode ? themeColors.cardBg : "#fff"} !important;
      }
      .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
        background: ${isDarkMode ? themeColors.secondary : "#e6f7ff"} !important;
        color: ${isDarkMode ? themeColors.text : "#000"} !important;
      }
      .ant-select-selection-item {
        background: ${isDarkMode ? themeColors.cardBg : "#fff"} !important;
        color: ${isDarkMode ? themeColors.text : "#000"} !important;
      }
      .ant-btn:hover {
        background: ${isDarkMode ? themeColors.secondary : "#e6f7ff"} !important;
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
      /* Button hover styles */
      .ant-btn-primary:not(.ant-btn-dangerous):hover,
      .ant-btn-primary:not(.ant-btn-dangerous):focus {
        background: ${themeColors.primaryHover} !important;
        border-color: ${themeColors.primaryHover} !important;
      }
      
      .ant-btn-dangerous.ant-btn-primary:hover,
      .ant-btn-dangerous.ant-btn-primary:focus {
        background: ${themeColors.accentHover} !important;
        border-color: ${themeColors.accentHover} !important;
      }
      
      .ant-btn:not(.ant-btn-primary):hover,
      .ant-btn:not(.ant-btn-primary):focus {
        border-color: ${themeColors.primary} !important;
        color: ${themeColors.primary} !important;
      }
      
      /* This overrides the earlier generic button hover */
      .ant-btn-default:hover {
        background: ${isDarkMode ? themeColors.cardBg : "#fff"} !important;
        border-color: ${themeColors.primary} !important;
        color: ${themeColors.primary} !important;
      }
      
      /* Remove generic hover state we set earlier */
      .ant-btn:hover {
        background: inherit;
      }
      
      /* Consistent table styling */
      .ant-table {
        background: ${isDarkMode ? themeColors.cardBg : "#fff"} !important;
        color: ${themeColors.text} !important;
        border: 1px solid ${themeColors.border} !important;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }
      .ant-table-thead > tr > th {
        background: ${isDarkMode ? themeColors.backgroundLight : themeColors.tableHeaderBg} !important;
        color: ${themeColors.text} !important;
        font-weight: 600;
        border-bottom: 2px solid ${themeColors.border} !important;
      }
      .ant-table-tbody > tr > td {
        background: ${isDarkMode ? themeColors.cardBg : "#fff"} !important;
        color: ${themeColors.text} !important;
        border-bottom: 1px solid ${themeColors.border} !important;
      }
      .ant-table-tbody > tr:hover > td {
        background: ${isDarkMode ? themeColors.hover : themeColors.tableRowHover} !important;
      }
      .ant-table-row:nth-child(even) {
        background-color: ${isDarkMode ? themeColors.backgroundLight : themeColors.background} !important;
      }
      .ant-table-row:nth-child(even) > td {
        background-color: ${isDarkMode ? themeColors.backgroundLight : themeColors.background} !important;
      }
      .ant-table-title {
        padding: 16px;
        font-weight: 600;
        background: ${themeColors.primary} !important;
        color: ${themeColors.textInvert} !important;
        border-radius: 8px 8px 0 0;
      }
      
      ${tableStyles}
      
      ${modalStyles.styles}
      
    `,
  }), [isDarkMode, themeColors, tableStyles, modalStyles.styles]);

  const columns = [
    {
      title: (
        <>
          <UserOutlined style={{ marginRight: 4, color: themeColors.accent }} />
          Name
        </>
      ),
      dataIndex: "firstName",
      key: "name",
      render: (text, record) => (
        <span style={{ fontWeight: 500, color: themeColors.primary }}>
          {record.firstName} {record.lastName}
        </span>
      ),
    },
    {
      title: (
        <>
          <MailOutlined style={{ marginRight: 4, color: themeColors.accent }} />
          Email
        </>
      ),
      dataIndex: "email",
      key: "email",
    },
    {
      title: (
        <>
          <ApartmentOutlined style={{ marginRight: 4, color: themeColors.accent }} />
          Department
        </>
      ),
      dataIndex: "department",
      key: "department",
      render: (dept) => (dept ? dept.name : "N/A"),
    },
    {
      title: (
        <>
          <BookOutlined style={{ marginRight: 4, color: themeColors.accent }} />
          Assigned Units
        </>
      ),
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
            style={{ background: themeColors.primary, borderColor: themeColors.primary }}
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
            style={{ background: themeColors.accent, borderColor: themeColors.accent }}
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
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              style={{ background: themeColors.primary, borderColor: themeColors.primary }}
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
                  style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                />
              </Col>
              <Col xs={24} md={8}>
                <Select
                  placeholder="All Departments"
                  value={filterDepartment || undefined}
                  onChange={(value) => setFilterDepartment(value)}
                  style={{ width: "100%" }}
                  allowClear
                  dropdownStyle={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
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
                  dropdownStyle={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                >
                  {units.map((unit) => (
                    <Option key={unit.code} value={unit.code}>
                      {unit.code} – {unit.name}
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: 2 }}>
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
                      style={{ background: themeColors.primary, borderColor: themeColors.primary }}
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
                  style={{ background: themeColors.primary, borderColor: themeColors.primary }}
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
        title={
          <div style={modalStyles.modalTitle}>
            <UserAddOutlined />
            Add New Lecturer
          </div>
        }
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        footer={[
          <Button
            key="cancel"
            onClick={() => setIsAddModalVisible(false)}
            style={{
              color: isDarkMode ? themeColors.text : themeColors.text,
              background: isDarkMode ? themeColors.cardBg : '#fff',
              borderColor: themeColors.border
            }}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleAddLecturer}
            loading={loading}
            style={{
              background: themeColors.primary,
              borderColor: themeColors.primary,
              color: themeColors.textInvert
            }}
          >
            Add Lecturer
          </Button>,
        ]}
        styles={{
          header: modalStyles.modalHeader,
          body: modalStyles.modalBody,
          footer: modalStyles.modalFooter,
          content: modalStyles.modalContainer
        }}
      >
        <Spin spinning={loading} tip="Loading data...">
          <Form
            form={addForm}
            layout="vertical"
            style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
          >
            <Form.Item
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>First Name</span>}
              name="firstName"
              rules={[{ required: true, message: "First name is required" }]}
            >
              <Input
                placeholder="Enter first name"
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              />
            </Form.Item>
            <Form.Item
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Last Name</span>}
              name="lastName"
              rules={[{ required: true, message: "Last name is required" }]}
            >
              <Input
                placeholder="Enter last name"
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              />
            </Form.Item>
            <Form.Item
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Email</span>}
              name="email"
              rules={[
                { required: true, message: "Email is required" },
                { type: "email", message: "Invalid email format" },
              ]}
            >
              <Input
                autoComplete="new-email" // Prevent autofill
                placeholder="Enter email"
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              />
            </Form.Item>
            <Form.Item
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Password</span>}
              name="password"
              rules={[{ required: true, message: "Password is required" }]}
            >
              <Input.Password
                autoComplete="new-password" // Prevent autofill
                placeholder="Enter password"
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              />
            </Form.Item>
            <Form.Item
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Department</span>}
              name="department"
              rules={[{ required: true, message: "Department is required" }]}
            >
              <Select
                placeholder="Select Department"
                dropdownStyle={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              >
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
        title={
          <div style={modalStyles.modalTitle}>
            <EditOutlined />
            Edit Lecturer
          </div>
        }
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={[
          <Button
            key="cancel"
            onClick={() => setIsEditModalVisible(false)}
            style={{
              color: isDarkMode ? themeColors.text : themeColors.text,
              background: isDarkMode ? themeColors.cardBg : '#fff',
              borderColor: themeColors.border
            }}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleEditLecturer}
            loading={loading}
            style={{
              background: themeColors.primary,
              borderColor: themeColors.primary,
              color: themeColors.textInvert
            }}
          >
            Save Changes
          </Button>,
        ]}
        styles={{
          header: modalStyles.modalHeader,
          body: modalStyles.modalBody,
          footer: modalStyles.modalFooter,
          content: modalStyles.modalContainer
        }}
      >
        <Spin spinning={loading} tip="Loading data...">
          <Form
            form={editForm}
            layout="vertical"
            style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
          >
            <Form.Item
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>First Name</span>}
              name="firstName"
            >
              <Input
                placeholder="First name"
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              />
            </Form.Item>
            <Form.Item
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Last Name</span>}
              name="lastName"
            >
              <Input
                placeholder="Last name"
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              />
            </Form.Item>
            <Form.Item
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Email</span>}
              name="email"
            >
              <Input
                placeholder="Email"
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              />
            </Form.Item>
            <Form.Item
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Department</span>}
              name="department"
            >
              <Select
                placeholder="Select Department"
                dropdownStyle={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              >
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
        title={
          <div style={modalStyles.modalTitle}>
            <ExclamationCircleOutlined />
            Confirm Deletion
          </div>
        }
        open={isDeleteModalVisible}
        onCancel={() => setIsDeleteModalVisible(false)}
        footer={[
          <Button
            key="cancel"
            onClick={() => setIsDeleteModalVisible(false)}
            style={{
              color: isDarkMode ? themeColors.text : themeColors.text,
              background: isDarkMode ? themeColors.cardBg : '#fff',
              borderColor: themeColors.border
            }}
          >
            Cancel
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            onClick={handleConfirmDelete}
            loading={loading}
            style={{
              background: themeColors.accent,
              borderColor: themeColors.accent,
              color: themeColors.textInvert
            }}
          >
            Delete Lecturer
          </Button>,
        ]}
        styles={{
          header: modalStyles.modalHeader,
          body: modalStyles.modalBody,
          footer: modalStyles.modalFooter,
          content: modalStyles.modalContainer
        }}
      >
        <Spin spinning={loading} tip="Loading data...">
          <p style={{ color: themeColors.accent }}>
            <ExclamationCircleOutlined style={{ marginRight: 8 }} />
            Are you sure you want to delete this lecturer? This action cannot be undone.
          </p>
        </Spin>
      </Modal>

      <Modal
        title={
          <div style={modalStyles.modalTitle}>
            <UnorderedListOutlined />
            Assigned Units for{" "}
            {selectedLecturerForUnits &&
              `${selectedLecturerForUnits.firstName} ${selectedLecturerForUnits.lastName}`}
          </div>
        }
        open={isUnitsModalVisible}
        onCancel={() => setIsUnitsModalVisible(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setIsUnitsModalVisible(false)}
            style={{
              color: isDarkMode ? themeColors.text : themeColors.text,
              background: isDarkMode ? themeColors.cardBg : '#fff',
              borderColor: themeColors.border
            }}
          >
            Close
          </Button>,
          <Button
            key="assign"
            type="primary"
            onClick={handleAssignUnit}
            loading={loading}
            style={{
              background: themeColors.primary,
              borderColor: themeColors.primary,
              color: themeColors.textInvert
            }}
          >
            Assign Unit
          </Button>,
        ]}
        styles={{
          header: modalStyles.modalHeader,
          body: modalStyles.modalBody,
          footer: modalStyles.modalFooter,
          content: modalStyles.modalContainer
        }}
      >
        <Spin spinning={loading} tip="Loading data...">
          {selectedLecturerForUnits && (
            <>
              <p style={{ color: isDarkMode ? themeColors.text : "#000" }}>
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
                  <span style={{ color: isDarkMode ? "#a0a0a0" : "#999" }}>
                    No units assigned
                  </span>
                )}
              </div>
              <Form
                form={unitForm}
                layout="vertical"
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              >
                <Form.Item
                  name="newUnit"
                  label={
                    <span style={{ color: isDarkMode ? themeColors.text : "#000" }}>
                      <BookOutlined style={{ marginRight: 4, color: themeColors.accent }} />
                      Assign New Unit
                    </span>
                  }
                  rules={[{ required: true, message: "Please select a unit" }]}
                >
                  <Select
                    placeholder="Select a unit"
                    dropdownStyle={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                    style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                  >
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