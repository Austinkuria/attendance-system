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
  FilterOutlined,
} from "@ant-design/icons";
import { getStudents, deleteStudent, downloadStudents } from "../../services/api";
import api from "../../services/api";
import "../../styles.css";

const { Content } = Layout;
const { Option } = Select;

const ManageStudents = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState({
    regNo: "",
    year: "",
    course: "",
    semester: "",
  });
  const [loading, setLoading] = useState(true); // Global loading state
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
        setLoading(true); // Start loading
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
        setLoading(false); // Stop loading
      }
    };
    fetchDepartments();
  }, [navigate]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true); // Start loading
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
        setLoading(false); // Stop loading
      }
    };
    fetchCourses();
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;
    const fetchStudents = async () => {
      try {
        setLoading(true); // Start loading
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
        if (isMounted) setLoading(false); // Stop loading
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
      setLoading(true); // Start loading
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
      setLoading(false); // Stop loading
    }
  };

  const handleEditStudent = async () => {
    try {
      setLoading(true); // Start loading
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

      const response = await api.put(
        `/students/${selectedStudent._id}`,
        formattedStudent,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        const updated = await getStudents();
        setStudents(formatStudentData(updated));
        setIsEditModalVisible(false);
        message.success("Student updated successfully");
      }
    } catch (err) {
      console.error("Error updating student:", err);
      setGlobalError(err.response?.data?.message || "Failed to update student");
      message.error("Failed to update student");
    } finally {
      setLoading(false); // Stop loading
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
      setLoading(true); // Start loading
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
      setLoading(false); // Stop loading
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
      setLoading(true); // Start loading
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
      setLoading(false); // Stop loading
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true); // Start loading
      await downloadStudents();
      message.success("Students exported successfully");
    } catch (err) {
      console.error("Error downloading students:", err);
      setGlobalError("Failed to download students");
      message.error("Failed to download students");
    } finally {
      setLoading(false); // Stop loading
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

  const columns = [
    { title: (<><IdcardOutlined style={{ marginRight: 4 }} />Reg No</>), dataIndex: "regNo", key: "regNo", render: (text) => <span style={{ color: "#1890ff", fontWeight: 500 }}>{text}</span> },
    { title: "Student Name", key: "name", render: (_, record) => `${record.firstName} ${record.lastName}` },
    { title: (<><CalendarOutlined style={{ marginRight: 4 }} />Year</>), dataIndex: "year", key: "year", render: (year) => <span className="ant-tag ant-tag-blue">{year}</span> },
    { title: (<><BookOutlined style={{ marginRight: 4 }} />Course</>), dataIndex: "courseName", key: "course", render: (course) => (<div style={{ display: "flex", alignItems: "center" }}><BookOutlined style={{ color: "#999", marginRight: 4 }} />{course}</div>) },
    { title: (<><FilterOutlined style={{ marginRight: 4 }} />Semester</>), dataIndex: "semester", key: "semester", render: (semester) => <span className="ant-tag">{semester}</span> },
    {
      title: "Actions", key: "actions", render: (_, record) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button type="primary" icon={<EditOutlined />} size="small" onClick={() => {
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
              semester: record.semester
            });
            setIsEditModalVisible(true);
          }}>
            Edit
          </Button>
          <Button type="danger" icon={<DeleteOutlined />} size="small" onClick={() => {
            setStudentToDelete(record._id);
            setIsDeleteModalVisible(true);
          }}>
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: "20px" }}>
        <Spin spinning={loading} tip="Loading...">
          {showBackToTop && (
            <Button
              type="primary"
              shape="circle"
              icon={<ArrowUpOutlined />}
              style={{ position: "fixed", bottom: 50, right: 30, zIndex: 1000 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            />
          )}

          {globalError && (
            <Alert message={globalError} type="error" closable onClose={() => setGlobalError("")} style={{ marginBottom: 16 }} />
          )}
          {globalSuccess && (
            <Alert message={globalSuccess} type="success" closable onClose={() => setGlobalSuccess("")} style={{ marginBottom: 16 }} />
          )}

          <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
            <Button type="link" icon={<LeftOutlined />} onClick={() => navigate("/admin")}>
              Back to Admin
            </Button>
            <h2 style={{ margin: 0 }}><TeamOutlined style={{ marginRight: 8 }} />Student Management</h2>
            <Button type="primary" icon={<UserAddOutlined />} onClick={() => {
              addForm.resetFields();
              setIsAddModalVisible(true);
            }}>
              Add
            </Button>
          </Row>

          <div style={{ marginBottom: 20, padding: 16, background: "#fff", borderRadius: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={8}>
                <Input placeholder="Search students by name ..." prefix={<SearchOutlined />}
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </Col>
              <Col xs={12} md={4}>
                <Input placeholder="Reg No" prefix={<IdcardOutlined />}
                  value={filter.regNo} onChange={(e) => setFilter((prev) => ({ ...prev, regNo: e.target.value }))} />
              </Col>
              <Col xs={12} md={4}>
                <Select placeholder="All Years" style={{ width: "100%" }} value={filter.year || undefined}
                  onChange={(value) => setFilter((prev) => ({ ...prev, year: value }))} allowClear>
                  {["1", "2", "3", "4"].map((year) => (
                    <Option key={year} value={year}>Year {year}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={12} md={4}>
                <Select placeholder="All Courses" style={{ width: "100%" }} value={filter.course || undefined}
                  onChange={(value) => setFilter((prev) => ({ ...prev, course: value }))} allowClear>
                  {availableCourses.map((course) => (
                    <Option key={course.id} value={course.name}>{course.name}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={12} md={4}>
                <Select placeholder="All Semesters" style={{ width: "100%" }} value={filter.semester || undefined}
                  onChange={(value) => setFilter((prev) => ({ ...prev, semester: value }))} allowClear>
                  {["1", "2", "3"].map((sem) => (
                    <Option key={sem} value={sem}>Semester {sem}</Option>
                  ))}
                </Select>
              </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col xs={24} md={8}>
                <Row gutter={8} align="middle">
                  <Col flex="auto"><Input type="file" accept=".csv" onChange={handleFileUpload} /></Col>
                  <Col><Button type="primary" icon={<ImportOutlined />} disabled={!file} onClick={handleImport}>
                    {file ? `Import ${file.name}` : "CSV Import"}
                  </Button></Col>
                </Row>
              </Col>
              <Col xs={12} md={8}>
                <Button type="primary" icon={<DownloadOutlined />} block onClick={handleExport}>
                  Export
                </Button>
              </Col>
            </Row>
          </div>

          <Table dataSource={filteredStudents} columns={columns} rowKey="_id" scroll={{ x: "max-content", y: 400 }} />
        </Spin>
      </Content>

      <Modal
        title={<><UserAddOutlined style={{ marginRight: 8 }} />Add New Student</>}
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsAddModalVisible(false)}>Cancel</Button>,
          <Button key="submit" type="primary" onClick={handleAddStudent} loading={loading}>Create Student</Button>,
        ]}
      >
        <Spin spinning={loading} tip="Adding student...">
          <Form form={addForm} layout="vertical">
            <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: "First name is required" }]}>
              <Input onChange={(e) => setNewStudent((prev) => ({ ...prev, firstName: e.target.value }))} />
            </Form.Item>
            <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: "Last name is required" }]}>
              <Input onChange={(e) => setNewStudent((prev) => ({ ...prev, lastName: e.target.value }))} />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, message: "Email is required" }, { type: "email", message: "Invalid email format" }]}>
              <Input onChange={(e) => setNewStudent((prev) => ({ ...prev, email: e.target.value }))} />
            </Form.Item>
            <Form.Item name="password" label="Password" rules={[{ required: true, message: "Password is required" }]}>
              <Input.Password onChange={(e) => setNewStudent((prev) => ({ ...prev, password: e.target.value }))} />
            </Form.Item>
            <Form.Item name="regNo" label="Registration Number" rules={[{ required: true, message: "Registration number is required" }]}>
              <Input onChange={(e) => setNewStudent((prev) => ({ ...prev, regNo: e.target.value }))} />
            </Form.Item>
            <Form.Item name="course" label="Course" rules={[{ required: true, message: "Course is required" }]}>
              <Select placeholder="Select Course" onChange={(value) => setNewStudent((prev) => ({ ...prev, course: value }))}>
                {availableCourses.map((course) => (
                  <Option key={course.id} value={course.id}>{course.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="department" label="Department" rules={[{ required: true, message: "Department is required" }]}>
              <Select placeholder="Select Department" onChange={(value) => setNewStudent((prev) => ({ ...prev, department: value }))}>
                {departments.map((dept) => (
                  <Option key={dept._id} value={dept._id}>{dept.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="year" label="Year" rules={[{ required: true, message: "Year is required" }]}>
              <Select placeholder="Select Year" onChange={(value) => setNewStudent((prev) => ({ ...prev, year: value }))}>
                {["1", "2", "3", "4"].map((year) => (
                  <Option key={year} value={year}>Year {year}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="semester" label="Semester" rules={[{ required: true, message: "Semester is required" }]}>
              <Select placeholder="Select Semester" onChange={(value) => setNewStudent((prev) => ({ ...prev, semester: value }))}>
                {["1", "2", "3"].map((sem) => (
                  <Option key={sem} value={sem}>Semester {sem}</Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      <Modal
        title={<><EditOutlined style={{ marginRight: 8 }} />Edit Student</>}
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsEditModalVisible(false)}>Cancel</Button>,
          <Button key="submit" type="primary" onClick={handleEditStudent} loading={loading}>Save Changes</Button>,
        ]}
      >
        <Spin spinning={loading} tip="Updating student...">
          <Form form={editForm} layout="vertical">
            <Form.Item name="firstName" label="First Name">
              <Input onChange={(e) => setSelectedStudent((prev) => ({ ...prev, firstName: e.target.value }))} />
            </Form.Item>
            <Form.Item name="lastName" label="Last Name">
              <Input onChange={(e) => setSelectedStudent((prev) => ({ ...prev, lastName: e.target.value }))} />
            </Form.Item>
            <Form.Item name="email" label="Email">
              <Input onChange={(e) => setSelectedStudent((prev) => ({ ...prev, email: e.target.value }))} />
            </Form.Item>
            <Form.Item name="regNo" label="Registration Number">
              <Input onChange={(e) => setSelectedStudent((prev) => ({ ...prev, regNo: e.target.value }))} />
            </Form.Item>
            <Form.Item name="course" label="Course">
              <Select placeholder="Select Course" onChange={(value) => setSelectedStudent((prev) => ({ ...prev, courseId: value }))}>
                {availableCourses.map((course) => (
                  <Option key={course.id} value={course.id}>{course.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="department" label="Department">
              <Select placeholder="Select Department" onChange={(value) => setSelectedStudent((prev) => ({ ...prev, departmentId: value }))}>
                {departments.map((dept) => (
                  <Option key={dept._id} value={dept._id}>{dept.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="year" label="Year">
              <Select placeholder="Select Year" onChange={(value) => setSelectedStudent((prev) => ({ ...prev, year: value }))}>
                {["1", "2", "3", "4"].map((year) => (
                  <Option key={year} value={year}>Year {year}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="semester" label="Semester">
              <Select placeholder="Select Semester" onChange={(value) => setSelectedStudent((prev) => ({ ...prev, semester: value }))}>
                {["1", "2", "3"].map((sem) => (
                  <Option key={sem} value={sem}>Semester {sem}</Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      <Modal
        title="Confirm Deletion"
        open={isDeleteModalVisible}
        centered
        onCancel={() => setIsDeleteModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsDeleteModalVisible(false)}>Cancel</Button>,
          <Button key="delete" type="primary" danger onClick={handleConfirmDelete} loading={loading}>Delete Student</Button>,
        ]}
      >
        <Spin spinning={loading} tip="Deleting student...">
          <p><ExclamationCircleOutlined style={{ marginRight: 8 }} />Are you sure you want to delete this student? This action cannot be undone.</p>
        </Spin>
      </Modal>
    </Layout>
  );
};

export default ManageStudents;