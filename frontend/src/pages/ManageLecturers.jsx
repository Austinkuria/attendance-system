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
} from "antd";
import {
  SearchOutlined,
  UserAddOutlined,
  // LoadingOutlined,
  ExclamationCircleOutlined,
  // UserOutlined,
  LeftOutlined,
  EditOutlined,
  DeleteOutlined,
  IdcardOutlined,
  BookOutlined,
  UnorderedListOutlined,
  // CheckCircleOutlined,
  ApartmentOutlined,
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
} from "../services/api";
import "../styles.css";
import api from "../services/api";
const { Header, Content } = Layout;
const { Option } = Select;

const ManageLecturers = () => {
  const navigate = useNavigate();
  const [lecturers, setLecturers] = useState([]);
  const [units, setUnits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState("");
  const [globalSuccess, setGlobalSuccess] = useState("");

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterUnit, setFilterUnit] = useState("");

  // Modal states
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isUnitsModalVisible, setIsUnitsModalVisible] = useState(false);

  // Lecturer selection and form data
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [lecturerToDelete, setLecturerToDelete] = useState(null);
  const [selectedLecturerForUnits, setSelectedLecturerForUnits] = useState(null);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [unitForm] = Form.useForm();

  // Back-to-top button state
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [file, setFile] = useState(null);

  // ---------------------------
  // Authentication & Scroll
  // ---------------------------
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

  // ---------------------------
  // Data Fetching
  // ---------------------------
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
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

  // ---------------------------
  // Filtering Lecturers
  // ---------------------------
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

  // ---------------------------
  // Modal Handlers
  // ---------------------------
  const openUnitsModal = (lecturer) => {
    setSelectedLecturerForUnits(lecturer);
    unitForm.resetFields();
    setIsUnitsModalVisible(true);
  };

  // ---------------------------
  // CRUD Handlers
  // ---------------------------
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
        //  Refresh the lecturers list
        const updated = await getLecturers();
        setLecturers(updated || []);

        //  Clear the form fields
        addForm.resetFields();

        //  Close the modal
        setIsAddModalVisible(false);

        //  Show success message
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

      // Check if selectedLecturer has a valid _id
      if (!selectedLecturer?._id) {
        message.error("Selected lecturer is invalid.");
        return;
      }

      // Prepare updated lecturer data
      const updatedLecturer = { ...selectedLecturer, ...values };

      // Call the API to update the lecturer
      const response = await updateLecturer(selectedLecturer._id, updatedLecturer);

      // Check if the update was successful
      if (response?.message === "Lecturer updated successfully") {
        //  Update the list of lecturers in the state (refresh)
        const updated = await getLecturers();
        setLecturers(updated || []);

        //  Clear the form fields
        editForm.resetFields();

        //  Close the modal
        setIsEditModalVisible(false);

        //  Show success message
        message.success("Lecturer updated successfully");
      } else {
        // Show error message if the response is not successful
        message.error("Failed to update lecturer");
      }
    } catch (err) {
      // Handle errors that might occur during the update process
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

      // Find the unit to add
      const unitToAdd = units.find((unit) => unit._id === newUnit);
      if (!unitToAdd) {
        throw new Error("Unit not found");
      }

      // Prepare updated units array
      const updatedUnits = [
        ...(Array.isArray(selectedLecturerForUnits.assignedUnits)
          ? selectedLecturerForUnits.assignedUnits
          : []),
        unitToAdd,
      ];

      // Prepare the updated lecturer data
      const updatedLecturer = {
        ...selectedLecturerForUnits,
        assignedUnits: updatedUnits,
      };

      // Call the API to update lecturer with the new units
      const response = await updateLecturer(selectedLecturerForUnits._id, updatedLecturer);

      if (response?.message === "Lecturer updated successfully") {
        // Fetch updated lecturers list and update state
        const updated = await getLecturers();
        setLecturers(updated || []);
        setSelectedLecturerForUnits(updatedLecturer);

        // Reset the form and close the modal
        unitForm.resetFields();
        setIsUnitsModalVisible(false);

        // Show success message
        message.success("Unit assigned successfully");
      }
    } catch (err) {
      // Handle error if assignment fails
      setGlobalError(err.response?.data?.message || "Failed to assign unit");
      message.error("Failed to assign unit");
    } finally {
      setLoading(false);
    }
  };

  // Handle CSV file upload (only CSV allowed)
const handleFileUpload = (e) => {
  const selectedFile = e.target.files[0];
  const validCSVTypes = ["text/csv", "application/vnd.ms-excel"];

  if (selectedFile && validCSVTypes.includes(selectedFile.type)) {
    setFile(selectedFile);
    setGlobalError(null); // Clear any previous errors
  } else {
    setGlobalError("Invalid file type. Please upload a valid CSV file.");
    setFile(null);
  }
};

// Handle CSV import for lecturers
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
      const formatted = updated.map((l) => ({
        firstName: l.firstName || "N/A",
        lastName: l.lastName || "N/A",
        email: l.email || "N/A",
        department: (l.department && (l.department.name || l.department)) || "N/A",
        assignedUnits: (l.assignedUnits && l.assignedUnits.length > 0)
          ? l.assignedUnits.map(unit => unit.name).join(", ")
          : "N/A",
      }));

      setLecturers(formatted);
      message.success(`Successfully imported ${response.data.successCount} lecturers`);
    }

    setFile(null);

    if (response.data.errorCount > 0) {
      setGlobalError(`${response.data.errorCount} records failed to import. Check errors in response.`);
    }
  } catch (err) {
    console.error("CSV import failed:", err);
    setGlobalError("CSV import failed. Please check file format and try again.");
    message.error("CSV import failed");
  } finally {
    setLoading(false);
  }
};

  // ---------------------------
  // Table Columns
  // ---------------------------
  const columns = [
    {
      title: (
        <>
          <IdcardOutlined style={{ marginRight: 4 }} />
          Name
        </>
      ),
      dataIndex: "firstName",
      key: "name",
      render: (text, record) => (
        <span className="fw-semibold" style={{ color: "#1890ff" }}>
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
          <ApartmentOutlined style={{ marginRight: 4 }} />
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
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
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
            type="danger"
            icon={<DeleteOutlined />}
            size="small"
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

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ background: "var(--ant-bg-color)", padding: "0 20px" }}>
        <Row justify="space-between" align="middle">
          <Button
            type="link"
            icon={<LeftOutlined />}
            onClick={() => navigate("/admin")}
          >
            Back to Admin
          </Button>
          <h2 style={{ color: "var(--ant-primary-color)" }}>
            Lecturer Management
          </h2>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => {
              addForm.resetFields();
              setIsAddModalVisible(true);
            }}
          >
            Add Lecturer
          </Button>
        </Row>
      </Header>
      <Content style={{ padding: "20px" }}>
        {showBackToTop && (
          <Button
            type="primary"
            shape="circle"
            icon={<ArrowUpOutlined />}
            className="back-to-top-btn"
            style={{ position: "fixed", bottom: 50, right: 30, zIndex: 1000 }}
            onClick={() =>
              window.scrollTo({ top: 0, behavior: "smooth" })
            }
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

        {/* Filters */}
        <div style={{ marginBottom: 20, padding: 16, background: "#fff", borderRadius: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
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
                    await downloadLecturers();
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
        {/* Lecturer Table */}
        {loading ? (
          <Skeleton active />
        ) : (
          <Table
            dataSource={filteredLecturers}
            columns={columns}
            rowKey="_id"
            scroll={{ x: "max-content", y: 400 }}
          />
        )}
      </Content>

      {/* Add Lecturer Modal */}
      <Modal
        title={
          <>
            <UserAddOutlined style={{ marginRight: 8 }} />
            Add New Lecturer
          </>
        }
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
          >
            Add Lecturer
          </Button>,
        ]}
      >
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
      </Modal>

      {/* Edit Lecturer Modal */}
      <Modal
        title={
          <>
            <EditOutlined style={{ marginRight: 8 }} />
            Edit Lecturer
          </>
        }
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
          >
            Save Changes
          </Button>,
        ]}
      >
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
          <Button
            key="delete"
            type="primary"
            danger
            onClick={handleConfirmDelete}
            loading={loading}
          >
            Delete Lecturer
          </Button>,
        ]}
      >
        <p>
          <ExclamationCircleOutlined style={{ marginRight: 8 }} />
          Are you sure you want to delete this lecturer? This action cannot be undone.
        </p>
      </Modal>

      {/* Units Management Modal */}
      <Modal
        title={
          <>
            Assigned Units for{" "}
            {selectedLecturerForUnits &&
              `${selectedLecturerForUnits.firstName} ${selectedLecturerForUnits.lastName}`}
          </>
        }
        open={isUnitsModalVisible}
        onCancel={() => setIsUnitsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsUnitsModalVisible(false)}>
            Close
          </Button>,
          <Button key="assign" type="primary" onClick={handleAssignUnit} loading={loading}>
            Assign Unit
          </Button>,
        ]}
      >
        {selectedLecturerForUnits && (
          <>
            <p><strong>Current Units:</strong></p>
            <div style={{ marginBottom: 16 }}>
              {Array.isArray(selectedLecturerForUnits.assignedUnits) &&
                selectedLecturerForUnits.assignedUnits.length > 0
                ? selectedLecturerForUnits.assignedUnits.map((unit) => (
                  <span
                    key={unit._id}
                    style={{
                      background: "#d9d9d9",
                      padding: "4px 8px",
                      marginRight: 4,
                      borderRadius: 4,
                      display: "inline-block",
                    }}
                  >
                    {unit.name || unit.code}
                  </span>
                ))
                : <span style={{ color: "#999" }}>No units assigned</span>}
            </div>
            <Form form={unitForm} layout="vertical">
              <Form.Item
                name="newUnit"
                label={<><BookOutlined style={{ marginRight: 4 }} /> Assign New Unit</>}
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
      </Modal>

    </Layout>
  );
};

export default ManageLecturers;
