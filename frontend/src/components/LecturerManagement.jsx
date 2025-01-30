import { useState, useEffect } from 'react';
import { getLecturers, addLecturer, deleteLecturer } from '../services/api';

const LecturerManagement = () => {
  const [lecturers, setLecturers] = useState([]);
  const [newLecturer, setNewLecturer] = useState({ name: '', email: '' });

  useEffect(() => {
    getLecturers().then(response => setLecturers(response.data));
  }, []);

  const handleAddLecturer = () => {
    addLecturer(newLecturer).then(response => {
      setLecturers([...lecturers, response.data]);
      setNewLecturer({ name: '', email: '' });
    });
  };

  const handleDeleteLecturer = (id) => {
    deleteLecturer(id).then(() => {
      setLecturers(lecturers.filter(lecturer => lecturer.id !== id));
    });
  };

  return (
    <div>
      <h3>Manage Lecturers</h3>
      <div>
        <input
          type="text"
          placeholder="Name"
          value={newLecturer.name}
          onChange={(e) => setNewLecturer({ ...newLecturer, name: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          value={newLecturer.email}
          onChange={(e) => setNewLecturer({ ...newLecturer, email: e.target.value })}
        />
        <button onClick={handleAddLecturer}>Add Lecturer</button>
      </div>
      <ul>
        {lecturers.map(lecturer => (
          <li key={lecturer.id}>
            {lecturer.name} - {lecturer.email}
            <button onClick={() => handleDeleteLecturer(lecturer.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LecturerManagement;
