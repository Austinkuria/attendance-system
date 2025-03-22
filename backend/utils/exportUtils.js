/**
 * Utility functions for data export
 */
const logger = require('./logger');

/**
 * Sanitize and validate export data
 * @param {Array} data - The array of data to validate
 * @returns {Array} - The cleaned data array
 */
const sanitizeExportData = (data) => {
  if (!Array.isArray(data)) {
    logger.error('sanitizeExportData: Input is not an array');
    return [];
  }

  // Define expected columns in the correct order
  const expectedColumns = [
    'Unit Code', 'Unit Name', 'Session Date', 'Session Time',
    'Registration Number', 'First Name', 'Last Name', 'Status', 'Attendance Time'
  ];

  return data.map(record => {
    try {
      // Handle record if it's a stringified JSON
      if (typeof record === 'string') {
        try {
          record = JSON.parse(record);
        } catch (e) {
          // If it can't be parsed as JSON, attempt to parse as Tab or comma separated
          try {
            const parts = record.includes('\t')
              ? record.split('\t')
              : record.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // Split by comma, ignoring commas in quotes

            if (parts.length >= 5) { // Minimum fields needed
              const newRecord = {};
              // Map to expected fields - handle the case where we don't have all fields
              expectedColumns.forEach((col, index) => {
                newRecord[col] = parts[index] ? parts[index].replace(/^"|"$/g, '') : 'N/A';
              });
              return newRecord;
            }
          } catch (parseError) {
            logger.error(`Failed to parse as delimited: ${parseError.message}`);
          }

          // If all parsing fails, create a placeholder
          logger.error(`Failed to parse JSON record: ${e.message}`);
          return createPlaceholderRecord();
        }
      }

      // Ensure record is an object
      if (typeof record !== 'object' || record === null) {
        return createPlaceholderRecord();
      }

      // If the record doesn't have the expected structure, try to create it
      if (!record['Unit Code'] && !record['Registration Number']) {
        // Try to extract fields from a different structure
        const newRecord = {};

        // Map commonly found field names to our expected structure
        const fieldMappings = {
          'unitCode': 'Unit Code',
          'unit_code': 'Unit Code',
          'code': 'Unit Code',
          'unitName': 'Unit Name',
          'unit_name': 'Unit Name',
          'name': 'Unit Name',
          'sessionDate': 'Session Date',
          'session_date': 'Session Date',
          'date': 'Session Date',
          'sessionTime': 'Session Time',
          'session_time': 'Session Time',
          'time': 'Session Time',
          'regNo': 'Registration Number',
          'reg_no': 'Registration Number',
          'registrationNumber': 'Registration Number',
          'studentId': 'Registration Number',
          'student_id': 'Registration Number',
          'firstName': 'First Name',
          'first_name': 'First Name',
          'fname': 'First Name',
          'lastName': 'Last Name',
          'last_name': 'Last Name',
          'lname': 'Last Name',
          'status': 'Status',
          'attendanceStatus': 'Status',
          'attendedAt': 'Attendance Time',
          'attendance_time': 'Attendance Time',
          'scanTime': 'Attendance Time'
        };

        // Try to map fields
        Object.entries(record).forEach(([key, value]) => {
          // Check for direct match or mapped field
          const targetField = fieldMappings[key] || key;
          if (expectedColumns.includes(targetField)) {
            newRecord[targetField] = value;
          }

          // Special case for nested student object
          if (key === 'student' && typeof value === 'object') {
            if (value.regNo) newRecord['Registration Number'] = value.regNo;
            if (value.firstName) newRecord['First Name'] = value.firstName;
            if (value.lastName) newRecord['Last Name'] = value.lastName;
          }

          // Special case for nested session object
          if (key === 'session' && typeof value === 'object') {
            if (value.startTime) {
              const date = new Date(value.startTime);
              newRecord['Session Date'] = date.toLocaleDateString();

              if (value.endTime) {
                const endTime = new Date(value.endTime);
                newRecord['Session Time'] = `${date.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`;
              } else {
                newRecord['Session Time'] = date.toLocaleTimeString();
              }
            }

            // Handle unit info if available
            if (value.unit) {
              if (typeof value.unit === 'object') {
                if (value.unit.code) newRecord['Unit Code'] = value.unit.code;
                if (value.unit.name) newRecord['Unit Name'] = value.unit.name;
              } else if (typeof value.unit === 'string') {
                newRecord['Unit Code'] = value.unit;
              }
            }
          }
        });

        // Check if we were able to extract enough information
        if (Object.keys(newRecord).length >= 3) {
          record = newRecord;
        } else {
          // Not enough information extracted
          return createPlaceholderRecord();
        }
      }

      // Ensure all required fields exist
      const normalized = {};
      expectedColumns.forEach(col => {
        normalized[col] = record[col] || 'N/A';
      });

      // Clean up and normalize status field specifically
      if (normalized['Status']) {
        const normalizedStatus = normalized['Status'].toString().toLowerCase();
        normalized['Status'] = normalizedStatus === 'present' ? 'Present' :
          normalizedStatus === 'absent' ? 'Absent' : 'Unknown';
      }

      return normalized;
    } catch (error) {
      logger.error(`Error sanitizing record: ${error.message}`);
      return createPlaceholderRecord();
    }
  });
};

/**
 * Create a placeholder record when data is corrupted
 */
const createPlaceholderRecord = () => {
  return {
    'Unit Code': 'Error',
    'Unit Name': 'Error in Data',
    'Session Date': 'N/A',
    'Session Time': 'N/A',
    'Registration Number': 'N/A',
    'First Name': 'Error',
    'Last Name': 'in Data',
    'Status': 'Unknown',
    'Attendance Time': 'N/A'
  };
};

/**
 * Parse a malformed string to extract structured data
 * @param {string} data - Potentially malformed data string
 * @returns {Object} - Structured data object
 */
const parseAttendanceString = (data) => {
  try {
    // Remove any surrounding braces or brackets that might be malformed
    let cleanData = data.trim()
      .replace(/^\s*[{\[]\s*/, '') // Remove leading { or [
      .replace(/\s*[}\]]\s*$/, ''); // Remove trailing } or ]

    // Try to tokenize the string into key-value pairs
    const parts = cleanData.split(/[\t,;|]\s*/);
    const result = {};

    // Look for patterns like "key:value" or "key=value"
    parts.forEach(part => {
      // Check for key:value or key=value pattern
      const matches = part.match(/^([^:=]+)[:=]\s*(.+)$/);
      if (matches) {
        const [, key, value] = matches;
        result[key.trim()] = value.trim().replace(/^"|"$/g, ''); // Remove quotes if present
      } else if (part.includes('Unit Code')) {
        // If we find something like "Unit Code: DSA2203", extract it
        const unitMatches = part.match(/Unit Code[^A-Za-z0-9]+(.*)/);
        if (unitMatches && unitMatches[1]) {
          result['Unit Code'] = unitMatches[1].trim();
        }
      } else if (part.includes('Status')) {
        // Extract status information
        const statusMatches = part.match(/Status[^A-Za-z0-9]+(.*)/);
        if (statusMatches && statusMatches[1]) {
          result['Status'] = statusMatches[1].trim();
        }
      }
    });

    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    logger.error(`Error parsing malformed string: ${error.message}`);
    return null;
  }
};

module.exports = {
  sanitizeExportData,
  createPlaceholderRecord,
  parseAttendanceString
};
