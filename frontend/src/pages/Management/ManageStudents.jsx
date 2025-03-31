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
  Row,
  Col,
  Spin,
} from "antd";
import {
  ImportOutlined,
  DownloadOutlined,
  SearchOutlined,
  UserAddOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  ArrowUpOutlined,
  LeftOutlined,
  EditOutlined,
  DeleteOutlined,
  IdcardOutlined,
  CalendarOutlined,
  BookOutlined,
  UserOutlined,
  NumberOutlined
} from "@ant-design/icons";
import { ThemeContext } from '../../context/ThemeContext';
// import ThemeToggle from '../../components/ThemeToggle';
import { getStudents, deleteStudent, downloadStudents, updateStudentV2 } from "../../services/api";
import api from "../../services/api";
import { useTableStyles } from '../../components/SharedTableStyles';
import { useModalStyles } from '../../components/SharedModalStyles';

const { Content } = Layout;
const { Option } = Select;

const ManageStudents = () => {
  const navigate = useNavigate();
  const { isDarkMode, themeColors } = useContext(ThemeContext);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState({
    regNo: "",
    year: "",
    course: "",
    semester: "",
  });
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState("");
  const [globalSuccess, setGlobalSuccess] = useState("");
  const [file, setFile] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    regNo: "",
    course: "",
    department: "",
    year: "",
    semester: "",
  });
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/auth/login");
  }, [navigate]);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) return navigate("/auth/login");
        const response = await api.get("/department", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDepartments(response.data);
      } catch (err) {
        console.error("Error fetching departments:", err);
        setGlobalError("Failed to fetch departments");
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, [navigate]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) return navigate("/auth/login");
        const response = await api.get("/course", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourses(response.data);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setGlobalError("Failed to fetch courses");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) return navigate("/auth/login");
        const response = await getStudents();
        const data = Array.isArray(response) ? response : [];
        if (isMounted) {
          const formattedStudents = data.map((student) => ({
            ...student,
            regNo: student.regNo || "N/A",
            year: student.year || "N/A",
            semester: student.semester?.toString() || "N/A",
            courseId: student.course?._id || student.course || "N/A",
            courseName: student.course?.name || student.course || "N/A",
            departmentId: student.department?._id || student.department || "N/A",
            departmentName: student.department?.name || student.department || "N/A",
          }));
          setStudents(formattedStudents);
          setGlobalError("");
        }
      } catch (err) {
        console.error("Error fetching students:", err);
        if (isMounted) {
          setGlobalError("Failed to load student data. Please try again later.");
          setStudents([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStudents();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const availableCourses = useMemo(() => {
    return courses.map((course) => ({
      id: course._id,
      name: course.name,
    }));
  }, [courses]);

  const validateForm = () => {
    const errors = {};
    if (!newStudent.firstName) errors.firstName = "First name is required";
    if (!newStudent.lastName) errors.lastName = "Last name is required";
    if (!newStudent.email) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(newStudent.email)) errors.email = "Invalid email format";
    if (!newStudent.password) errors.password = "Password is required";
    if (!newStudent.regNo) errors.regNo = "Registration number is required";
    if (!newStudent.course) errors.course = "Course is required";
    if (!newStudent.department) errors.department = "Department is required";
    if (!newStudent.year) errors.year = "Year is required";
    if (!newStudent.semester) errors.semester = "Semester is required";
    return Object.keys(errors).length === 0;
  };

  const handleAddStudent = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return navigate("/auth/login");

      const payload = {
        ...newStudent,
        role: "student",
        department: newStudent.department,
        course: newStudent.course,
        year: Number(newStudent.year) || 1,
        semester: Number(newStudent.semester) || 1,
      };

      const response = await api.post("/students", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.message === "User created successfully") {
        const updated = await getStudents();
        setStudents(formatStudentData(updated));
        setIsAddModalVisible(false);
        message.success("Student added successfully");
        setNewStudent({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          regNo: "",
          course: "",
          department: "",
          year: "",
          semester: "",
        });
        addForm.resetFields();
      }
    } catch (err) {
      console.error("Error creating student:", err);
      setGlobalError(err.response?.data?.message || err.message || "Failed to create student");
      message.error("Failed to create student");
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return navigate("/auth/login");

      const formattedStudent = {
        firstName: selectedStudent.firstName,
        lastName: selectedStudent.lastName,
        email: selectedStudent.email,
        regNo: selectedStudent.regNo,
        course: selectedStudent.courseId,
        department: selectedStudent.departmentId,
        year: Number(selectedStudent.year) || selectedStudent.year,
        semester: Number(selectedStudent.semester) || selectedStudent.semester,
      };

      console.log("Updating student with data:", formattedStudent);
      
      const response = await updateStudentV2(selectedStudent._id, formattedStudent);

      if (response.message === "Student updated successfully") {
        const updated = await getStudents();
        setStudents(formatStudentData(updated));
        setIsEditModalVisible(false);
        message.success("Student updated successfully");
      }
    } catch (err) {
      console.error("Error updating student:", err);
      setGlobalError(err.response?.data?.message || err.userMessage || "Failed to update student");
      message.error(err.userMessage || "Failed to update student");
    } finally {
      setLoading(false);
    }
  };

  const formatStudentData = (students) => {
    return students.map((s) => ({
      ...s,
      regNo: s.regNo || "N/A",
      year: s.year || "N/A",
      semester: s.semester?.toString() || "N/A",
      courseId: s.course?._id || s.course || "N/A",
      courseName: s.course?.name || s.course || "N/A",
      departmentId: s.department?._id || s.department || "N/A",
      departmentName: s.department?.name || s.department || "N/A",
    }));
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return navigate("/auth/login");
      if (!studentToDelete) {
        message.error("No student selected for deletion");
        return;
      }

      const response = await deleteStudent(studentToDelete);
      if (response.message === "Student deleted successfully") {
        setStudents((prev) => prev.filter((s) => s._id !== studentToDelete));
        message.success("Student deleted successfully");
      } else {
        message.error(response.message || "Failed to delete student");
      }
      setIsDeleteModalVisible(false);
    } catch (err) {
      console.error("Error deleting student:", err);
      setGlobalError(err.response?.data?.message || "Failed to delete student.");
      message.error("Failed to delete student");
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
      if (!token) return navigate("/auth/login");

      const formData = new FormData();
      formData.append("csvFile", file);

      const response = await api.post("/students/upload", formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
      });

      if (response.data.successCount > 0) {
        const updated = await getStudents();
        setStudents(formatStudentData(updated));
        message.success(`Successfully imported ${response.data.successCount} students`);
      }

      setFile(null);
      if (response.data.errorCount > 0) {
        const errorMessages = response.data.errors.map((err, index) => `Row ${index + 1}: ${err.error}`).join("\n");
        setGlobalError(`Some records failed to import:\n${errorMessages}`);
      }
    } catch (err) {
      console.error("CSV import failed:", err);
      setGlobalError("CSV import failed. Please check file format and try again.");
      message.error("CSV import failed");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      await downloadStudents();
      message.success("Students exported successfully");
    } catch (err) {
      console.error("Error downloading students:", err);
      setGlobalError("Failed to download students");
      message.error("Failed to download students");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const searchLower = searchQuery.toLowerCase().trim();
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const studentYear = student.year.toString();
      const studentSemester = student.semester.toString();
      return (
        fullName.includes(searchLower) &&
        student.regNo.toLowerCase().includes(filter.regNo.toLowerCase()) &&
        (filter.year === "" || studentYear === filter.year) &&
        (filter.course === "" || student.courseName === filter.course) &&
        (filter.semester === "" || studentSemester === filter.semester)
      );
    });
  }, [students, searchQuery, filter]);

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
      color: themeColors.text, // Changed from #fff to use theme color
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
    modalHeader: {
      padding: "12px 16px",
      background: themeColors.primary,
      color: themeColors.text,
      borderRadius: "8px 8px 0 0",
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
        color: ${isDarkMode ? themeColors.textSecondary : "#999"} !important; // Changed from hardcoded #a0a0a0 to use theme color
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
        background: inherit;
      }
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
      
      .ant-btn-default:hover {
        background: ${isDarkMode ? themeColors.cardBg : "#fff"} !important;
        border-color: ${themeColors.primary} !important;
        color: ${themeColors.primary} !important;
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
      title: (<><IdcardOutlined style={{ marginRight: 4, color: themeColors.accent }} />Reg No</>),
      dataIndex: "regNo",
      key: "regNo",
      render: (text) => <span style={{ color: themeColors.primary, fontWeight: 500 }}>{text}</span>,
    },
    {
      title: (<><UserOutlined style={{ marginRight: 4, color: themeColors.accent }} />Student Name</>),
      key: "name",
      render: (_, record) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: (<><CalendarOutlined style={{ marginRight: 4, color: themeColors.accent }} />Year</>),
      dataIndex: "year",
      key: "year",
      render: (year) => <span style={{ background: isDarkMode ? themeColors.secondary : "#e6f7ff", padding: "2px 8px", borderRadius: 4 }}>{year}</span>,
    },
    {
      title: (<><BookOutlined style={{ marginRight: 4, color: themeColors.accent }} />Course</>),
      dataIndex: "courseName",
      key: "course",
      render: (course) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          <BookOutlined style={{ color: isDarkMode ? "#a0a0a0" : "#999", marginRight: 4 }} />
          {course}
        </div>
      ),
    },
    {
      title: (<><NumberOutlined style={{ marginRight: 4, color: themeColors.accent }} />Semester</>),
      dataIndex: "semester",
      key: "semester",
      render: (semester) => <span style={{ background: isDarkMode ? themeColors.secondary : "#f5f5f5", padding: "2px 8px", borderRadius: 4 }}>{semester}</span>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            style={{ background: themeColors.primary, borderColor: themeColors.primary }}
            onClick={() => {
              setSelectedStudent({
                ...record,
                courseId: record.courseId,
                departmentId: record.departmentId,
              });
              editForm.setFieldsValue({
                firstName: record.firstName,
                lastName: record.lastName,
                email: record.email,
                regNo: record.regNo,
                course: record.courseId,
                department: record.departmentId,
                year: record.year,
                semester: record.semester,
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
              setStudentToDelete(record._id);
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
        <Spin spinning={loading} tip="Loading students data...">
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
              style={{
                color: themeColors.primary,
                fontSize: '14px',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Back to Admin
            </Button>

            <h2 style={{
              color: isDarkMode ? themeColors.text : "#1890ff",
              margin: 0,
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
            }}>
              <TeamOutlined style={{ marginRight: 8 }} />
              Student Management
            </h2>

            {/* <ThemeToggle /> */}
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              style={{ background: themeColors.primary, borderColor: themeColors.primary }}
              onClick={() => {
                addForm.resetFields();
                setIsAddModalVisible(true);
              }}
            >
              Add
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
              style={{ marginBottom: 16 }}
            />
          )}
          {globalSuccess && (
            <Alert
              message={globalSuccess}
              type="success"
              closable
              onClose={() => setGlobalSuccess("")}
              style={{ marginBottom: 16 }}
            />
          )}

          <div style={styles.filtersContainer} className="filters-container">
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={8}>
                <Input
                  placeholder="Search students by name ..."
                  prefix={<SearchOutlined />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                />
              </Col>
              <Col xs={12} md={4}>
                <Input
                  placeholder="Reg No"
                  prefix={<IdcardOutlined />}
                  value={filter.regNo}
                  onChange={(e) => setFilter((prev) => ({ ...prev, regNo: e.target.value }))}
                  style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                />
              </Col>
              <Col xs={12} md={4}>
                <Select
                  placeholder="All Years"
                  style={{ width: "100%" }}
                  value={filter.year || undefined}
                  onChange={(value) => setFilter((prev) => ({ ...prev, year: value }))}
                  allowClear
                  dropdownStyle={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                >
                  {["1", "2", "3", "4"].map((year) => (
                    <Option key={year} value={year}>Year {year}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={12} md={4}>
                <Select
                  placeholder="All Courses"
                  style={{ width: "100%" }}
                  value={filter.course || undefined}
                  onChange={(value) => setFilter((prev) => ({ ...prev, course: value }))}
                  allowClear
                  dropdownStyle={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                >
                  {availableCourses.map((course) => (
                    <Option key={course.id} value={course.name}>{course.name}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={12} md={4}>
                <Select
                  placeholder="All Semesters"
                  style={{ width: "100%" }}
                  value={filter.semester || undefined}
                  onChange={(value) => setFilter((prev) => ({ ...prev, semester: value }))}
                  allowClear
                  dropdownStyle={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                >
                  {["1", "2", "3"].map((sem) => (
                    <Option key={sem} value={sem}>Semester {sem}</Option>
                  ))}
                </Select>
              </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
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
                      style={{ background: themeColors.primary, borderColor: themeColors.primary, margin: '8px' }}
                      onClick={handleImport}
                    >
                      {file ? `Import ${file.name}` : "CSV Import"}
                    </Button>
                  </Col>
                </Row>
              </Col>
              <Col xs={12} md={8}>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  block
                  style={{ background: themeColors.primary, borderColor: themeColors.primary }}
                  onClick={handleExport}
                >
                  Export
                </Button>
              </Col>
            </Row>
          </div>

          <Table
            dataSource={filteredStudents}
            columns={columns}
            rowKey="_id"
            scroll={{ x: "max-content", y: 400 }}
            style={styles.table}
            className="ant-table-custom"
          />
        </Spin>
      </Content>

      <Modal
        title={
          <div style={{ ...modalStyles.modalTitle, color: themeColors.textInvert }}>
            <UserAddOutlined style={{ marginRight: 8 }} />
            Add New Student
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
            onClick={handleAddStudent}
            loading={loading}
            style={{
              background: themeColors.primary,
              borderColor: themeColors.primary,
              color: themeColors.textInvert
            }}
          >
            Create Student
          </Button>,
        ]}
        styles={{
          header: modalStyles.modalHeader,
          body: modalStyles.modalBody,
          footer: modalStyles.modalFooter,
          content: modalStyles.modalContainer
        }}
        className="form-modal"
      >
        <Spin spinning={loading} tip="Processing student data...">
          <Form form={addForm} layout="vertical" style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}>
            <Form.Item
              name="firstName"
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>First Name</span>}
              rules={[{ required: true, message: "First name is required" }]}
            >
              <Input
                autoComplete="new-firstName"
                onChange={(e) => setNewStudent((prev) => ({ ...prev, firstName: e.target.value }))}
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              />
            </Form.Item>
            <Form.Item
              name="lastName"
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Last Name</span>}
              rules={[{ required: true, message: "Last name is required" }]}
            >
              <Input
                autoComplete="new-lastName"
                onChange={(e) => setNewStudent((prev) => ({ ...prev, lastName: e.target.value }))}
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              />
            </Form.Item>
            <Form.Item
              name="email"
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Email</span>}
              rules={[{ required: true, message: "Email is required" }, { type: "email", message: "Invalid email format" }]}
            >
              <Input
                autoComplete="new-email"
                onChange={(e) => setNewStudent((prev) => ({ ...prev, email: e.target.value }))}
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              />
            </Form.Item>
            <Form.Item
              name="password"
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Password</span>}
              rules={[{ required: true, message: "Password is required" }]}
            >
              <Input.Password
                autoComplete="new-password"
                onChange={(e) => setNewStudent((prev) => ({ ...prev, password: e.target.value }))}
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              />
            </Form.Item>
            <Form.Item
              name="regNo"
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Registration Number</span>}
              rules={[{ required: true, message: "Registration number is required" }]}
            >
              <Input
                onChange={(e) => setNewStudent((prev) => ({ ...prev, regNo: e.target.value }))}
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              />
            </Form.Item>
            <Form.Item
              name="course"
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Course</span>}
              rules={[{ required: true, message: "Course is required" }]}
            >
              <Select
                placeholder="Select Course"
                onChange={(value) => setNewStudent((prev) => ({ ...prev, course: value }))}
                dropdownStyle={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              >
                {availableCourses.map((course) => (
                  <Option key={course.id} value={course.id}>{course.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="department"
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Department</span>}
              rules={[{ required: true, message: "Department is required" }]}
            >
              <Select
                placeholder="Select Department"
                onChange={(value) => setNewStudent((prev) => ({ ...prev, department: value }))}
                dropdownStyle={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              >
                {departments.map((dept) => (
                  <Option key={dept._id} value={dept._id}>{dept.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="year"
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Year</span>}
              rules={[{ required: true, message: "Year is required" }]}
            >
              <Select
                placeholder="Select Year"
                onChange={(value) => setNewStudent((prev) => ({ ...prev, year: value }))}
                dropdownStyle={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              >
                {["1", "2", "3", "4"].map((year) => (
                  <Option key={year} value={year}>Year {year}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="semester"
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Semester</span>}
              rules={[{ required: true, message: "Semester is required" }]}
            >
              <Select
                placeholder="Select Semester"
                onChange={(value) => setNewStudent((prev) => ({ ...prev, semester: value }))}
                dropdownStyle={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              >
                {["1", "2", "3"].map((sem) => (
                  <Option key={sem} value={sem}>Semester {sem}</Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      <Modal
        title={
          <div style={{ ...modalStyles.modalTitle, color: themeColors.textInvert }}>
            <EditOutlined style={{ marginRight: 8 }} />
            Edit Student
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
            onClick={handleEditStudent}
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
        className="edit-modal"
      >
        <Spin spinning={loading} tip="Saving student changes...">
          <Form form={editForm} layout="vertical" style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}>
            <Form.Item
              name="firstName"
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>First Name</span>}
            >
              <Input
                onChange={(e) => setSelectedStudent((prev) => ({ ...prev, firstName: e.target.value }))}
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              />
            </Form.Item>
            <Form.Item
              name="lastName"
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Last Name</span>}
            >
              <Input
                onChange={(e) => setSelectedStudent((prev) => ({ ...prev, lastName: e.target.value }))}
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              />
            </Form.Item>
            <Form.Item
              name="email"
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Email</span>}
            >
              <Input
                onChange={(e) => setSelectedStudent((prev) => ({ ...prev, email: e.target.value }))}
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              />
            </Form.Item>
            <Form.Item
              name="regNo"
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Registration Number</span>}
            >
              <Input
                onChange={(e) => setSelectedStudent((prev) => ({ ...prev, regNo: e.target.value }))}
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              />
            </Form.Item>
            <Form.Item
              name="course"
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Course</span>}
            >
              <Select
                placeholder="Select Course"
                onChange={(value) => setSelectedStudent((prev) => ({ ...prev, courseId: value }))}
                dropdownStyle={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              >
                {availableCourses.map((course) => (
                  <Option key={course.id} value={course.id}>{course.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="department"
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Department</span>}
            >
              <Select
                placeholder="Select Department"
                onChange={(value) => setSelectedStudent((prev) => ({ ...prev, departmentId: value }))}
                dropdownStyle={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              >
                {departments.map((dept) => (
                  <Option key={dept._id} value={dept._id}>{dept.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="year"
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Year</span>}
            >
              <Select
                placeholder="Select Year"
                onChange={(value) => setSelectedStudent((prev) => ({ ...prev, year: value }))}
                dropdownStyle={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              >
                {["1", "2", "3", "4"].map((year) => (
                  <Option key={year} value={year}>Year {year}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="semester"
              label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Semester</span>}
            >
              <Select
                placeholder="Select Semester"
                onChange={(value) => setSelectedStudent((prev) => ({ ...prev, semester: value }))}
                dropdownStyle={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              >
                {["1", "2", "3"].map((sem) => (
                  <Option key={sem} value={sem}>Semester {sem}</Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      <Modal
        title={
          <div style={{ ...modalStyles.modalTitle, color: themeColors.textInvert }}>
            <ExclamationCircleOutlined style={{ marginRight: 8 }} />
            Confirm Deletion
          </div>
        }
        open={isDeleteModalVisible}
        centered
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
            Delete Student
          </Button>,
        ]}
        styles={{
          header: modalStyles.modalHeader,
          body: modalStyles.modalBody,
          footer: modalStyles.modalFooter,
          content: modalStyles.modalContainer
        }}
        className="confirmation-modal"
      >
        <Spin spinning={loading} tip="Processing deletion request...">
          <p style={{ color: themeColors.accent }}>
            <ExclamationCircleOutlined style={{ marginRight: 8 }} />
            Are you sure you want to delete this student? This action cannot be undone.
          </p>
        </Spin>
      </Modal>
    </Layout>
  );
};

export default ManageStudents;