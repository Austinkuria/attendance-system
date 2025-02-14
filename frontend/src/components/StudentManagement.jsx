// import { useState, useEffect, useMemo } from 'react';
// import {
//   Table,
//   Button,
//   Modal,
//   Form,
//   Input,
//   Select,
//   message,
//   Space,
//   Upload,
//   Popconfirm,
//   Card,
//   Typography
// } from 'antd';
// import { PlusOutlined, UploadOutlined, DownloadOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
// import { getStudents, addStudent, deleteStudent, importStudents, downloadStudents, getCourses, getDepartments } from '../services/api';

// const { Option } = Select;
// const { Title } = Typography;

// const StudentManagement = () => {
//   const [students, setStudents] = useState([]);
//   const [courses, setCourses] = useState([]);
//   const [departments, setDepartments] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [form] = Form.useForm();
//   const [editingStudent, setEditingStudent] = useState(null);
//   const [selectedDepartment, setSelectedDepartment] = useState(null);

//   useEffect(() => {
//     fetchStudents();
//     fetchCourses();
//     fetchDepartments();
//   }, []);

//   // Filter courses based on selected department
//   const filteredCourses = useMemo(() => {
//     if (!selectedDepartment) return [];
//     return courses.filter(course => course.department?._id === selectedDepartment);
//   }, [courses, selectedDepartment]);

//   const fetchStudents = async () => {
//     try {
//       setLoading(true);
//       const data = await getStudents();
//       setStudents(data);
//     } catch {
//       message.error('Failed to fetch students');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchCourses = async () => {
//     try {
//       const data = await getCourses();
//       setCourses(data);
//     } catch {
//       message.error('Failed to fetch courses');
//     }
//   };

//   const fetchDepartments = async () => {
//     try {
//       const data = await getDepartments();
//       setDepartments(data);
//     } catch {
//       message.error('Failed to fetch departments');
//     }
//   };

//   const handleSubmit = async (values) => {
//     try {
//       // Get department and course names from their IDs
//       const department = departments.find(d => d._id === values.department);
//       const course = courses.find(c => c._id === values.course);

//       if (!department || !course) {
//         message.error('Invalid department or course selected');
//         return;
//       }

//       const studentData = {
//         ...values,
//         department: department.name,
//         course: course.name
//       };

//       if (editingStudent) {
//         await addStudent({ ...studentData, _id: editingStudent._id });
//         message.success('Student updated successfully');
//       } else {
//         await addStudent(studentData);
//         message.success('Student added successfully');
//       }
//       setModalVisible(false);
//       form.resetFields();
//       setEditingStudent(null);
//       fetchStudents();
//     } catch {
//       message.error(editingStudent ? 'Failed to update student' : 'Failed to add student');
//     }
//   };

//   const handleEdit = (student) => {
//     setEditingStudent(student);
//     const departmentId = student.department?._id;
//     setSelectedDepartment(departmentId);
//     form.setFieldsValue({
//       firstName: student.firstName,
//       lastName: student.lastName,
//       email: student.email,
//       regNo: student.regNo,
//       course: student.course?._id,
//       department: departmentId,
//       year: student.year,
//       semester: student.semester
//     });
//     setModalVisible(true);
//   };

//   const handleDelete = async (id) => {
//     try {
//       await deleteStudent(id);
//       message.success('Student deleted successfully');
//       fetchStudents();
//     } catch {
//       message.error('Failed to delete student');
//     }
//   };

//   const handleImport = async (file) => {
//     try {
//       await importStudents(file);
//       message.success('Students imported successfully');
//       fetchStudents();
//       return false;
//     } catch {
//       message.error('Failed to import students');
//       return false;
//     }
//   };

//   const handleDownload = async () => {
//     try {
//       await downloadStudents();
//       message.success('Download started');
//     } catch {
//       message.error('Failed to download students list');
//     }
//   };

//   const columns = [
//     {
//       title: 'Registration No',
//       dataIndex: 'regNo',
//       key: 'regNo',
//       sorter: (a, b) => a.regNo.localeCompare(b.regNo)
//     },
//     {
//       title: 'Name',
//       key: 'name',
//       render: (_, record) => `${record.firstName} ${record.lastName}`,
//       sorter: (a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
//     },
//     {
//       title: 'Email',
//       dataIndex: 'email',
//       key: 'email'
//     },
//     {
//       title: 'Course',
//       dataIndex: ['course', 'name'],
//       key: 'course'
//     },
//     {
//       title: 'Department',
//       dataIndex: ['department', 'name'],
//       key: 'department'
//     },
//     {
//       title: 'Year',
//       dataIndex: 'year',
//       key: 'year'
//     },
//     {
//       title: 'Semester',
//       dataIndex: 'semester',
//       key: 'semester'
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Space>
//           <Button
//             icon={<EditOutlined />}
//             onClick={() => handleEdit(record)}
//           />
//           <Popconfirm
//             title="Are you sure you want to delete this student?"
//             onConfirm={() => handleDelete(record._id)}
//             okText="Yes"
//             cancelText="No"
//           >
//             <Button danger icon={<DeleteOutlined />} />
//           </Popconfirm>
//         </Space>
//       )
//     }
//   ];

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <Space direction="vertical" style={{ width: '100%' }} size="large">
//           <Space style={{ justifyContent: 'space-between', width: '100%' }}>
//             <Title level={4} style={{ margin: 0 }}>Student Management</Title>
//             <Space>
//               <Upload
//                 beforeUpload={handleImport}
//                 accept=".csv"
//                 showUploadList={false}
//               >
//                 <Button icon={<UploadOutlined />}>Import CSV</Button>
//               </Upload>
//               <Button icon={<DownloadOutlined />} onClick={handleDownload}>
//                 Export CSV
//               </Button>
//               <Button
//                 type="primary"
//                 icon={<PlusOutlined />}
//                 onClick={() => {
//                   setEditingStudent(null);
//                   form.resetFields();
//                   setModalVisible(true);
//                 }}
//               >
//                 Add Student
//               </Button>
//             </Space>
//           </Space>

//           <Table
//             columns={columns}
//             dataSource={students}
//             rowKey="_id"
//             loading={loading}
//             scroll={{ x: true }}
//           />
//         </Space>
//       </Card>

//       <Modal
//         title={editingStudent ? 'Edit Student' : 'Add New Student'}
//         open={modalVisible}
//         onCancel={() => {
//           setModalVisible(false);
//           form.resetFields();
//           setEditingStudent(null);
//           setSelectedDepartment(null);
//         }}
//         footer={null}
//       >
//         <Form
//           form={form}
//           layout="vertical"
//           onFinish={handleSubmit}
//         >
//           <Form.Item
//             name="firstName"
//             label="First Name"
//             rules={[{ required: true, message: 'Please enter first name' }]}
//           >
//             <Input />
//           </Form.Item>

//           <Form.Item
//             name="lastName"
//             label="Last Name"
//             rules={[{ required: true, message: 'Please enter last name' }]}
//           >
//             <Input />
//           </Form.Item>

//           <Form.Item
//             name="email"
//             label="Email"
//             rules={[
//               { required: true, message: 'Please enter email' },
//               { type: 'email', message: 'Please enter a valid email' }
//             ]}
//           >
//             <Input />
//           </Form.Item>

//           <Form.Item
//             name="regNo"
//             label="Registration Number"
//             rules={[{ required: true, message: 'Please enter registration number' }]}
//           >
//             <Input />
//           </Form.Item>

//           <Form.Item
//             name="department"
//             label="Department"
//             rules={[{ required: true, message: 'Please select department' }]}
//           >
//             <Select
//               onChange={(value) => {
//                 setSelectedDepartment(value);
//                 form.setFieldValue('course', undefined);
//               }}
//             >
//               {departments.map(dept => (
//                 <Option key={dept._id} value={dept._id}>{dept.name}</Option>
//               ))}
//             </Select>
//           </Form.Item>

//           <Form.Item
//             name="course"
//             label="Course"
//             rules={[{ required: true, message: 'Please select course' }]}
//           >
//             <Select disabled={!selectedDepartment}>
//               {filteredCourses.map(course => (
//                 <Option key={course._id} value={course._id}>{course.name}</Option>
//               ))}
//             </Select>
//           </Form.Item>

//           <Form.Item
//             name="year"
//             label="Year"
//             rules={[{ required: true, message: 'Please select year' }]}
//           >
//             <Select>
//               {[1, 2, 3, 4].map(year => (
//                 <Option key={year} value={year}>Year {year}</Option>
//               ))}
//             </Select>
//           </Form.Item>

//           <Form.Item
//             name="semester"
//             label="Semester"
//             rules={[{ required: true, message: 'Please select semester' }]}
//           >
//             <Select>
//               {[1, 2].map(sem => (
//                 <Option key={sem} value={sem}>Semester {sem}</Option>
//               ))}
//             </Select>
//           </Form.Item>

//           <Form.Item>
//             <Space>
//               <Button type="primary" htmlType="submit">
//                 {editingStudent ? 'Update' : 'Add'} Student
//               </Button>
//               <Button onClick={() => {
//                 setModalVisible(false);
//                 form.resetFields();
//                 setEditingStudent(null);
//                 setSelectedDepartment(null);
//               }}>
//                 Cancel
//               </Button>
//             </Space>
//           </Form.Item>
//         </Form>
//       </Modal>
//     </div>
//   );
// };

// export default StudentManagement;
