import PropTypes from 'prop-types';
import { FiTrash2, FiEdit } from 'react-icons/fi';

const LecturerCard = ({ lecturer, onEdit, onDelete }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">
            {lecturer.firstName} {lecturer.lastName}
          </h3>
          <p className="text-gray-500 text-sm">{lecturer.email}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => onEdit(lecturer)} className="text-blue-600 hover:text-blue-800">
            <FiEdit size={20} />
          </button>
          <button onClick={() => onDelete(lecturer)} className="text-red-600 hover:text-red-800">
            <FiTrash2 size={20} />
          </button>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-700 font-medium mb-1">Department:</p>
        <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
          {lecturer.department?.name || 'Unassigned'}
        </span>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-700 font-medium mb-1">Assigned Units:</p>
        <div className="flex flex-wrap gap-2">
          {lecturer.assignedUnits?.map((unit) => (
            <span key={unit._id} className="inline-block bg-gray-300 text-gray-800 px-2 py-1 rounded-full text-sm">
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
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default LecturerCard;
