import PropTypes from 'prop-types';
import { FiTrash2, FiEdit } from 'react-icons/fi';

const LecturerCard = ({ lecturer, onDelete, onEdit }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold">
            {lecturer.firstName} {lecturer.lastName}
          </h3>
          <p className="text-gray-600 text-sm">{lecturer.email}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(lecturer)}
            className="text-indigo-600 hover:text-indigo-700 p-2"
          >
            <FiEdit size={20} />
          </button>
          <button
            onClick={() => onDelete(lecturer._id)}
            className="text-red-600 hover:text-red-700 p-2"
          >
            <FiTrash2 size={20} />
          </button>
        </div>
      </div>
      
      <div className="mt-4">
        <p className="text-sm font-medium mb-2">Department:</p>
        <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
          {lecturer.department?.name || 'Unassigned'}
        </span>
      </div>
      
      <div className="mt-4">
        <p className="text-sm font-medium mb-2">Assigned Units:</p>
        <div className="flex flex-wrap gap-2">
          {lecturer.assignedUnits?.map(unit => (
            <span 
              key={unit._id}
              className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm"
            >
              {unit.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

LecturerCard.propTypes = {
  lecturer: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    department: PropTypes.shape({
      name: PropTypes.string
    }),
    assignedUnits: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired
      })
    )
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired
};

export default LecturerCard;