import { useState, useEffect } from 'react';
import { getStudents, addStudent, deleteStudent } from '../services/api';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({ name: '', email: '' });

  useEffect(() => {
    getStudents().then(response => setStudents(response.data));
  }, []);

  const handleAddStudent = () => {
    addStudent(newStudent).then(response => {
      setStudents([...students, response.data]);
      setNewStudent({ name: '', email: '' });
    });
  };

  const handleDeleteStudent = (id) => {
    deleteStudent(id).then(() => {
      setStudents(students.filter(student => student.id !== id));
    });
  };

  return (
    <div>
      <h3>Manage Students</h3>
      <div>
        <input
          type="text"
          placeholder="Name"
          value={newStudent.name}
          onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          value={newStudent.email}
          onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
        />
        <button onClick={handleAddStudent}>Add Student</button>
      </div>
      <ul>
        {students.map(student => (
          <li key={student.id}>
            {student.name} - {student.email}
            <button onClick={() => handleDeleteStudent(student.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StudentManagement;
