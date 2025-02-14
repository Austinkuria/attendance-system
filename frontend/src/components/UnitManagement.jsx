// import { useState, useEffect } from 'react';
// import { getUnits, addUnit, deleteUnit } from '../services/api';

// const UnitManagement = () => {
//   const [units, setUnits] = useState([]);
//   const [newUnit, setNewUnit] = useState({ name: '', code: '' });

//   useEffect(() => {
//     getUnits().then(response => setUnits(response.data));
//   }, []);

//   const handleAddUnit = () => {
//     addUnit(newUnit).then(response => {
//       setUnits([...units, response.data]);
//       setNewUnit({ name: '', code: '' });
//     });
//   };

//   const handleDeleteUnit = (id) => {
//     deleteUnit(id).then(() => {
//       setUnits(units.filter(unit => unit.id !== id));
//     });
//   };

//   return (
//     <div>
//       <h3>Manage Units</h3>
//       <div>
//         <input
//           type="text"
//           placeholder="Unit Name"
//           value={newUnit.name}
//           onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
//         />
//         <input
//           type="text"
//           placeholder="Unit Code"
//           value={newUnit.code}
//           onChange={(e) => setNewUnit({ ...newUnit, code: e.target.value })}
//         />
//         <button onClick={handleAddUnit}>Add Unit</button>
//       </div>
//       <ul>
//         {units.map(unit => (
//           <li key={unit.id}>
//             {unit.name} - {unit.code}
//             <button onClick={() => handleDeleteUnit(unit.id)}>Delete</button>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default UnitManagement;
