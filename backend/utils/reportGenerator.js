// Zero-dependency native CSV and PDF document generator for attendance reports

const generateCsvReport = (records, studentInfo = {}) => {
  const hasMultipleStudents = records.some(r => r.studentName);

  const headers = hasMultipleStudents
    ? [
        "Student Name",
        "Registration Number",
        "Date",
        "Session Time",
        "Unit Code",
        "Unit Name",
        "Status",
        "Check-in Method",
        "Attended At"
      ]
    : [
        "Date",
        "Session Time",
        "Unit Code",
        "Unit Name",
        "Status",
        "Check-in Method",
        "Attended At"
      ];

  const rows = records.map((rec) => {
    const sessionDate = rec.session?.startTime ? new Date(rec.session.startTime).toLocaleDateString() : (rec.timestamp ? new Date(rec.timestamp).toLocaleDateString() : "N/A");
    const sessionTime = rec.session?.startTime ? new Date(rec.session.startTime).toLocaleTimeString() : "N/A";
    const unitCode = rec.session?.unit?.code || rec.unitCode || "N/A";
    const unitName = (rec.session?.unit?.name || rec.unitName || "Untitled Unit").replace(/"/g, '""');
    const status = rec.status || "Present";
    const method = rec.check_in_method || "QR_SCAN";
    const attendedAt = rec.attendedAt ? new Date(rec.attendedAt).toLocaleTimeString() : sessionTime;
    const studentName = (rec.studentName || studentInfo.fullName || "N/A").replace(/"/g, '""');
    const studentRegNo = (rec.studentRegNo || studentInfo.regNumber || "N/A").replace(/"/g, '""');

    if (hasMultipleStudents) {
      return `"${studentName}","${studentRegNo}","${sessionDate}","${sessionTime}","${unitCode}","${unitName}","${status}","${method}","${attendedAt}"`;
    }
    return `"${sessionDate}","${sessionTime}","${unitCode}","${unitName}","${status}","${method}","${attendedAt}"`;
  });

  const studentHeader = studentInfo.fullName
    ? `# Context: ${studentInfo.fullName} (${studentInfo.regNumber || "N/A"})\n# Course/Scope: ${studentInfo.courseName || "All"}\n# Generated: ${new Date().toISOString()}\n\n`
    : "";

  return studentHeader + [headers.join(","), ...rows].join("\n");
};

// Generates a valid standard PDF-1.4 file buffer without external npm dependencies
const generatePdfReport = (records, studentInfo = {}) => {
  const escapePdf = (str) => String(str || "").replace(/[()\\]/g, "\\$&");

  const lines = [
    "QRollCall - Attendance Report",
    `Student: ${studentInfo.fullName || "Student"} | Reg No: ${studentInfo.regNumber || "N/A"}`,
    `Course: ${studentInfo.courseName || "N/A"} | Generated: ${new Date().toLocaleDateString()}`,
    "--------------------------------------------------------------------------------",
    "Date         Unit Code   Unit Name                              Status     Method",
    "--------------------------------------------------------------------------------"
  ];

  records.forEach((rec) => {
    const d = rec.session?.startTime ? new Date(rec.session.startTime).toLocaleDateString() : (rec.timestamp ? new Date(rec.timestamp).toLocaleDateString() : "N/A");
    const code = (rec.session?.unit?.code || rec.unitCode || "N/A").padEnd(11, " ");
    const name = (rec.session?.unit?.name || rec.unitName || "Unit").slice(0, 36).padEnd(38, " ");
    const st = (rec.status || "Present").padEnd(10, " ");
    const m = rec.check_in_method || "QR_SCAN";
    lines.push(`${d.padEnd(12, " ")} ${code} ${name} ${st} ${m}`);
  });

  lines.push("--------------------------------------------------------------------------------");
  lines.push(`Total Sessions Recorded: ${records.length}`);

  let streamContent = "BT\n/F1 10 Tf\n40 760 Td\n15 TL\n";
  lines.forEach((line) => {
    streamContent += `(${escapePdf(line)}) '\n`;
  });
  streamContent += "ET\n";

  const streamLength = Buffer.byteLength(streamContent, "utf-8");

  const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  const obj3 = "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n";
  const obj4 = "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n";
  const obj5 = `5 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}endstream\nendobj\n`;

  const header = "%PDF-1.4\n";
  const body = obj1 + obj2 + obj3 + obj4 + obj5;

  const offset1 = Buffer.byteLength(header, "utf-8");
  const offset2 = offset1 + Buffer.byteLength(obj1, "utf-8");
  const offset3 = offset2 + Buffer.byteLength(obj2, "utf-8");
  const offset4 = offset3 + Buffer.byteLength(obj3, "utf-8");
  const offset5 = offset4 + Buffer.byteLength(obj4, "utf-8");
  const xrefOffset = offset5 + Buffer.byteLength(obj5, "utf-8");

  const pad = (n) => String(n).padStart(10, "0");

  const xref =
    "xref\n" +
    "0 6\n" +
    "0000000000 65535 f \n" +
    `${pad(offset1)} 00000 n \n` +
    `${pad(offset2)} 00000 n \n` +
    `${pad(offset3)} 00000 n \n` +
    `${pad(offset4)} 00000 n \n` +
    `${pad(offset5)} 00000 n \n`;

  const trailer =
    `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(header + body + xref + trailer, "utf-8");
};

module.exports = {
  generateCsvReport,
  generatePdfReport
};
