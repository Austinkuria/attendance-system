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
  // Skeleton,
  Row,
  Col,
} from "antd";
import {
  ImportOutlined,
  DownloadOutlined,
  SearchOutlined,
  UserAddOutlined,
  LoadingOutlined,
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
  // CheckCircleOutlined,
} from "@ant-design/icons";
import { getStudents, deleteStudent, downloadStudents, getCourseByDepartment } from "../services/api";
import api from "../services/api";
import "../styles.css";

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
  // const [formErrors, setFormErrors] = useState({});
  const [departments, setDepartments] = useState([]);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Redirect if not authenticated
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/auth/login");
  }, [navigate]);

  // Back-to-top scroll handler
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch departments data
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/auth/login");
          return;
        }
        const response = await api.get("/department", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDepartments(response.data);
      } catch (err) {
        console.error("Error fetching departments:", err);
      }
    };
    fetchDepartments();
  }, [navigate]);

  // Fetch students
  useEffect(() => {
    let isMounted = true;
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/auth/login");
          return;
        }
        const response = await getStudents();
        const data = Array.isArray(response) ? response : [];
        if (isMounted) {
          const formattedStudents = data.map((student) => ({
            ...student,
            regNo: student.regNo || "N/A",
            year: student.year || "N/A",
            semester: student.semester?.toString() || "N/A",
            course:
              (student.course && (student.course.name || student.course)) ||
              "N/A",
            department:
              (student.department &&
                (student.department.name || student.department)) ||
              "N/A",
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

  // Courses dropdown derived from students
  const courses = useMemo(() => {
    const courseSet = new Set();
    students.forEach((student) => {
      if (student.course && student.course !== "N/A") {
        courseSet.add(student.course);
      }
    });
    return Array.from(courseSet).sort();
  }, [students]);

  // Validate new student form
  const validateForm = () => {
    const errors = {};
    if (!newStudent.firstName) errors.firstName = "First name is required";
    if (!newStudent.lastName) errors.lastName = "Last name is required";
    if (!newStudent.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(newStudent.email)) {
      errors.email = "Invalid email format";
    }
    if (!newStudent.password) errors.password = "Password is required";
    if (!newStudent.regNo) errors.regNo = "Registration number is required";
    if (!newStudent.course) errors.course = "Course is required";
    if (!newStudent.department) errors.department = "Department is required";
    if (!newStudent.year) errors.year = "Year is required";
    if (!newStudent.semester) errors.semester = "Semester is required";
    // setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

// Handle add student
const handleAddStudent = async () => {
  if (!validateForm()) return;

  try {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth/login");
      return;
    }

    // Fetch department ID
    const deptResponse = await api.get(`/department?name=${newStudent.department}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!deptResponse.data || deptResponse.data.length === 0) {
      message.error("Department not found");
      return;
    }
    const departmentId = deptResponse.data[0]._id;

    // Fetch Course ID
    const courseResponse = await getCourseByDepartment(departmentId, newStudent.course);

    if (!courseResponse || courseResponse.length === 0) {
      message.error("Course not found in the specified department");
      return;
    }
    const courseId = courseResponse[0]._id;

    // Send request with ObjectIds
    const payload = {
      ...newStudent,
      role: "student",
      department: departmentId, // Ensure this is a valid ObjectId
      course: courseId, // Ensure this is a valid ObjectId
      year: Number(newStudent.year), // Convert to number
      semester: Number(newStudent.semester), // Convert to number
    };

    const response = await api.post("/students", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data.message === "User created successfully") {
      const updated = await getStudents();
      const formatted = updated.map((s) => ({
        ...s,
        regNo: s.regNo || "N/A",
        year: s.year || "N/A",
        semester: s.semester?.toString() || "N/A",
        course: (s.course && (s.course.name || s.course)) || "N/A",
        department: (s.department && (s.department.name || s.department)) || "N/A",
      }));
      setStudents(formatted);
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
    setGlobalError(err.response?.data?.message || "Failed to create student");
    message.error("Failed to create student");
  } finally {
    setLoading(false);
  }
};
  // Handle edit student
  const handleEditStudent = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/auth/login");
        return;
      }
      const response = await api.put(
        `/user/${selectedStudent._id}`,
        selectedStudent,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.message === "User updated successfully") {
        const updated = await getStudents();
        const formatted = updated.map((s) => ({
          ...s,
          regNo: s.regNo || "N/A",
          year: s.year || "N/A",
          semester: s.semester?.toString() || "N/A",
          course: (s.course && (s.course.name || s.course)) || "N/A",
          department:
            (s.department && (s.department.name || s.department)) || "N/A",
        }));
        setStudents(formatted);
        setIsEditModalVisible(false);
        message.success("Student updated successfully");
      }
    } catch (err) {
      console.error("Error updating student:", err);
      setGlobalError(err.response?.data?.message || "Failed to update student");
      message.error("Failed to update student");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete student
  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/auth/login");
        return;
      }
      await deleteStudent(studentToDelete, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents((prev) => prev.filter((s) => s._id !== studentToDelete));
      setIsDeleteModalVisible(false);
      message.success("Student deleted successfully");
    } catch (err) {
      console.error("Error deleting student:", err);
      setGlobalError("Failed to delete student. Please check your permissions.");
      message.error("Failed to delete student");
    } finally {
      setLoading(false);
    }
  };

  // Handle CSV file upload (only CSV allowed)
  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile?.type === "text/csv") {
      setFile(selectedFile);
    } else {
      setGlobalError("Invalid file type. Please upload a CSV file.");
      setFile(null);
    }
  };

  // Handle CSV import
  const handleImport = async () => {
    if (!file) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/auth/login");
        return;
      }
      const formData = new FormData();
      formData.append("csvFile", file);
      const response = await api.post("/upload-students", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.successCount > 0) {
        const updated = await getStudents();
        const formatted = updated.map((s) => ({
          ...s,
          regNo: s.regNo || "N/A",
          year: s.year || "N/A",
          semester: s.semester?.toString() || "N/A",
          course: (s.course && (s.course.name || s.course)) || "N/A",
          department:
            (s.department && (s.department.name || s.department)) || "N/A",
        }));
        setStudents(formatted);
        message.success(`Successfully imported ${response.data.successCount} students`);
      }
      setFile(null);
      if (response.data.errorCount > 0) {
        setGlobalError(`${response.data.errorCount} records failed to import`);
      }
    } catch (err) {
      console.error("CSV import failed:", err);
      setGlobalError("CSV import failed. Please check file format and try again.");
      message.error("CSV import failed");
    } finally {
      setLoading(false);
    }
  };

  // Filter students based on search and filter criteria
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
        (filter.course === "" || student.course === filter.course) &&
        (filter.semester === "" || studentSemester === filter.semester)
      );
    });
  }, [students, searchQuery, filter]);

  // Define table columns using Ant Design's Table component
  const columns = [
    {
      title: (
        <>
          <IdcardOutlined style={{ marginRight: 4 }} />
          Reg No
        </>
      ),
      dataIndex: "regNo",
      key: "regNo",
      render: (text) => <span style={{ color: "#1890ff", fontWeight: 500 }}>{text}</span>,
    },
    {
      title: "Student Name",
      key: "name",
      render: (_, record) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: (
        <>
          <CalendarOutlined style={{ marginRight: 4 }} />
          Year
        </>
      ),
      dataIndex: "year",
      key: "year",
      render: (year) => <span className="ant-tag ant-tag-blue">{year}</span>,
    },
    {
      title: (
        <>
          <BookOutlined style={{ marginRight: 4 }} />
          Course
        </>
      ),
      dataIndex: "course",
      key: "course",
      render: (course) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          <BookOutlined style={{ color: "#999", marginRight: 4 }} />
          {course}
        </div>
      ),
    },
    {
      title: (
        <>
          <FilterOutlined style={{ marginRight: 4 }} />
          Semester
        </>
      ),
      dataIndex: "semester",
      key: "semester",
      render: (semester) => <span className="ant-tag">{semester}</span>,
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
            onClick={() => {
              setSelectedStudent(record);
              // Pre-fill edit form fields
              editForm.setFieldsValue({
                firstName: record.firstName,
                lastName: record.lastName,
                email: record.email,
                regNo: record.regNo,
                course: record.course,
                year: record.year,
                semester: record.semester,
              });
              setIsEditModalVisible(true);
            }}
          >
            Edit
          </Button>
          <Button
            type="danger"
            icon={<DeleteOutlined />}
            size="small"
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

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <LoadingOutlined spin style={{ fontSize: 24, marginRight: 8 }} />
        Loading student records...
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: "20px" }}>
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

        {/* Header */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
          <Button type="link" icon={<LeftOutlined />} onClick={() => navigate("/admin")}>
            Back to Admin
          </Button>
          <h2 style={{ margin: 0 }}>
            <TeamOutlined style={{ marginRight: 8 }} />
            Student Management
          </h2>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => {
              addForm.resetFields();
              setIsAddModalVisible(true);
            }}
          >
            Add
          </Button>
        </Row>

        {/* Filters and Actions */}
        <div style={{ marginBottom: 20, padding: 16, background: "#fff", borderRadius: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={8}>
              <Input
                placeholder="Search students by name ..."
                prefix={<SearchOutlined />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Col>
            <Col xs={12} md={4}>
              <Input
                placeholder="Reg No"
                prefix={<IdcardOutlined />}
                value={filter.regNo}
                onChange={(e) => setFilter((prev) => ({ ...prev, regNo: e.target.value }))}
              />
            </Col>
            <Col xs={12} md={4}>
              <Select
                placeholder="All Years"
                style={{ width: "100%" }}
                value={filter.year || undefined}
                onChange={(value) => setFilter((prev) => ({ ...prev, year: value }))}
                allowClear
              >
                {["1", "2", "3", "4"].map((year) => (
                  <Option key={year} value={year}>
                    Year {year}
                  </Option>
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
              >
                {courses.map((course) => (
                  <Option key={course} value={course}>
                    {course}
                  </Option>
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
              >
                {["1", "2", "3"].map((sem) => (
                  <Option key={sem} value={sem}>
                    Semester {sem}
                  </Option>
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
                onClick={async () => {
                  try {
                    await downloadStudents();
                  } catch (err) {
                    console.error("Error downloading students:", err);
                    setGlobalError("Failed to download students");
                    message.error("Failed to download students");
                  }
                }}
              >
                Export
              </Button>
            </Col>
          </Row>
        </div>

        {/* Students Table */}
        <Table
          dataSource={filteredStudents}
          columns={columns}
          rowKey="_id"
          scroll={{ y: 400 }}
        />
      </Content>

      {/* Add Student Modal */}
      <Modal
        title={
          <>
            <UserAddOutlined style={{ marginRight: 8 }} />
            Add New Student
          </>
        }
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsAddModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleAddStudent} loading={loading}>
            Create Student
          </Button>,
        ]}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item
            label="First Name"
            name="firstName"
            initialValue={newStudent.firstName}
            rules={[{ required: true, message: "First name is required" }]}
          >
            <Input onChange={(e) => setNewStudent((prev) => ({ ...prev, firstName: e.target.value }))} />
          </Form.Item>
          <Form.Item
            label="Last Name"
            name="lastName"
            initialValue={newStudent.lastName}
            rules={[{ required: true, message: "Last name is required" }]}
          >
            <Input onChange={(e) => setNewStudent((prev) => ({ ...prev, lastName: e.target.value }))} />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            initialValue={newStudent.email}
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Invalid email format" },
            ]}
          >
            <Input onChange={(e) => setNewStudent((prev) => ({ ...prev, email: e.target.value }))} />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            initialValue={newStudent.password}
            rules={[{ required: true, message: "Password is required" }]}
          >
            <Input.Password onChange={(e) => setNewStudent((prev) => ({ ...prev, password: e.target.value }))} />
          </Form.Item>
          <Form.Item
            label="Registration Number"
            name="regNo"
            initialValue={newStudent.regNo}
            rules={[{ required: true, message: "Registration number is required" }]}
          >
            <Input onChange={(e) => setNewStudent((prev) => ({ ...prev, regNo: e.target.value }))} />
          </Form.Item>
          <Form.Item
            label="Course"
            name="course"
            initialValue={newStudent.course}
            rules={[{ required: true, message: "Course is required" }]}
          >
            <Select onChange={(value) => setNewStudent((prev) => ({ ...prev, course: value }))} placeholder="Select Course">
              {courses.map((course) => (
                <Option key={course} value={course}>
                  {course}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="Department"
            name="department"
            initialValue={newStudent.department}
            rules={[{ required: true, message: "Department is required" }]}
          >
            <Select onChange={(value) => setNewStudent((prev) => ({ ...prev, department: value }))} placeholder="Select Department">
              {departments.map((dept) => (
                <Option key={dept._id} value={dept.name}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="Year"
            name="year"
            initialValue={newStudent.year}
            rules={[{ required: true, message: "Year is required" }]}
          >
            <Select onChange={(value) => setNewStudent((prev) => ({ ...prev, year: value }))} placeholder="Select Year">
              {["1", "2", "3", "4"].map((year) => (
                <Option key={year} value={year}>
                  Year {year}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="Semester"
            name="semester"
            initialValue={newStudent.semester}
            rules={[{ required: true, message: "Semester is required" }]}
          >
            <Select onChange={(value) => setNewStudent((prev) => ({ ...prev, semester: value }))} placeholder="Select Semester">
              {["1", "2", "3"].map((sem) => (
                <Option key={sem} value={sem}>
                  Semester {sem}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        title={
          <>
            <EditOutlined style={{ marginRight: 8 }} />
            Edit Student
          </>
        }
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsEditModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleEditStudent} loading={loading}>
            Save Changes
          </Button>,
        ]}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="First Name" name="firstName">
            <Input onChange={(e) =>
              setSelectedStudent((prev) => ({ ...prev, firstName: e.target.value }))
            } />
          </Form.Item>
          <Form.Item label="Last Name" name="lastName">
            <Input onChange={(e) =>
              setSelectedStudent((prev) => ({ ...prev, lastName: e.target.value }))
            } />
          </Form.Item>
          <Form.Item label="Email" name="email">
            <Input onChange={(e) =>
              setSelectedStudent((prev) => ({ ...prev, email: e.target.value }))
            } />
          </Form.Item>
          <Form.Item label="Registration Number" name="regNo">
            <Input onChange={(e) =>
              setSelectedStudent((prev) => ({ ...prev, regNo: e.target.value }))
            } />
          </Form.Item>
          <Form.Item label="Course" name="course">
            <Select onChange={(value) =>
              setSelectedStudent((prev) => ({ ...prev, course: value }))
            } placeholder="Select Course">
              {courses.map((course) => (
                <Option key={course} value={course}>
                  {course}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Year" name="year">
            <Select onChange={(value) =>
              setSelectedStudent((prev) => ({ ...prev, year: value }))
            } placeholder="Select Year">
              {["1", "2", "3", "4"].map((year) => (
                <Option key={year} value={year}>
                  Year {year}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Semester" name="semester">
            <Select onChange={(value) =>
              setSelectedStudent((prev) => ({ ...prev, semester: value }))
            } placeholder="Select Semester">
              {["1", "2", "3"].map((sem) => (
                <Option key={sem} value={sem}>
                  Semester {sem}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Confirm Deletion"
        open={isDeleteModalVisible}
        onCancel={() => setIsDeleteModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsDeleteModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="delete" type="primary" danger onClick={handleConfirmDelete} loading={loading}>
            Delete Student
          </Button>,
        ]}
      >
        <p>
          <ExclamationCircleOutlined style={{ marginRight: 8 }} />
          Are you sure you want to delete this student? This action cannot be undone.
        </p>
      </Modal>
    </Layout>
  );
};

export default ManageStudents;
