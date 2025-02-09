// // FilterControls.js
// import { Select } from 'antd';
// const { Option } = Select;

// const FilterControls = ({ filters, filterOptions, availableCourses, availableYears, availableSemesters, onFilterChange, loading }) => (
//   <div className="flex gap-md mb-lg">
//     <Select
//       placeholder="Select Department"
//       style={{ width: 200 }}
//       onChange={value => onFilterChange('department', value)}
//       value={filters.department}
//       loading={loading.units}
//     >
//       {filterOptions.departments.map(dept => (
//         <Option key={dept} value={dept}>{dept}</Option>
//       ))}
//     </Select>
//     <Select
//       placeholder="Select Course"
//       style={{ width: 200 }}
//       onChange={value => onFilterChange('course', value)}
//       value={filters.course}
//       disabled={!filters.department}
//       loading={loading.units}
//     >
//       {availableCourses.map(course => (
//         <Option key={course} value={course}>{course}</Option>
//       ))}
//     </Select>
//     <Select
//       placeholder="Select Year"
//       style={{ width: 120 }}
//       onChange={value => onFilterChange('year', value)}
//       value={filters.year}
//       disabled={!filters.course}
//       loading={loading.units}
//     >
//       {availableYears.map(year => (
//         <Option key={year} value={year}>Year {year}</Option>
//       ))}
//     </Select>
//     <Select
//       placeholder="Select Semester"
//       style={{ width: 140 }}
//       onChange={value => onFilterChange('semester', value)}
//       value={filters.semester}
//       disabled={!filters.year}
//       loading={loading.units}
//     >
//       {availableSemesters.map(sem => (
//         <Option key={sem} value={sem}>Sem {sem}</Option>
//       ))}
//     </Select>
//   </div>
// );

// export default FilterControls;
