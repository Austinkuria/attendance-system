// import { useState } from 'react';
// import { Form, Input, Button, Card, DatePicker, TimePicker } from 'antd';
// // Use the named export QRCodeCanvas from qrcode.react
// import { QRCodeCanvas } from 'qrcode.react';

// const QrCodeGenerator = () => {
//   const [qrData, setQrData] = useState('');

//   // Handler for form submission
//   const onFinish = async (values) => {
//     const { lecturerName, courseName, date, startTime, endTime } = values;

//     // Build the payload for the QR code as a JSON string
//     const qrPayload = {
//       lecturer: lecturerName,
//       course: courseName,
//       date: date.format('YYYY-MM-DD'),
//       startTime: startTime.format('HH:mm'),
//       endTime: endTime.format('HH:mm'),
//     };

//     try {
//       const response = await fetch('/generateQR', {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(qrPayload),
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setQrData(data.qrCode); // Set the QR code from the response
//       } else {
//         console.error('Error generating QR code');
//       }
//     } catch (error) {
//       console.error('Error:', error);
//     }
//   };

//   return (
//     <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
//       <Card title="Smart QR Code Attendance Generator" style={{ marginBottom: 20 }}>
//         <Form layout="vertical" onFinish={onFinish}>
//           <Form.Item
//             label="Lecturer Name"
//             name="lecturerName"
//             rules={[{ required: true, message: 'Please enter the lecturer name' }]}
//           >
//             <Input placeholder="Enter lecturer name" />
//           </Form.Item>

//           <Form.Item
//             label="Course Name"
//             name="courseName"
//             rules={[{ required: true, message: 'Please enter the course name' }]}
//           >
//             <Input placeholder="Enter course name" />
//           </Form.Item>

//           <Form.Item
//             label="Date"
//             name="date"
//             rules={[{ required: true, message: 'Please select the date' }]}
//           >
//             <DatePicker style={{ width: '100%' }} />
//           </Form.Item>

//           <Form.Item
//             label=" Start Time"
//             name="startTime"
//             rules={[{ required: true, message: 'Please select start the time' }]}
//           >
//             <TimePicker style={{ width: '100%' }} format="HH:mm" />
//           </Form.Item>
//           <Form.Item
//             label="End Time"
//             name="endTime"
//             rules={[{ required: true, message: 'Please select end the time' }]}
//           >
//             <TimePicker style={{ width: '100%' }} format="HH:mm" />
//           </Form.Item>

//           <Form.Item>
//             <Button type="primary" htmlType="submit">
//               Generate QR Code
//             </Button>
//           </Form.Item>
//         </Form>
//       </Card>

//       {qrData && (
//         <Card title="Generated QR Code">
//           <div style={{ textAlign: 'center' }}>
//             <QRCodeCanvas value={qrData} size={256} level="H" includeMargin={true} />
//           </div>
//           <p style={{ marginTop: 10, wordBreak: 'break-all' }}>
//             <strong>QR Code contains:</strong> {qrData}
//           </p>
//         </Card>
//       )}
//     </div>
//   );
// };

// export default QrCodeGenerator;
