// src/components/QuizManagement.jsx
import  { useState } from 'react';
import { Form, Input, Button, Table, Modal, message } from 'antd';
import { sendQuiz, getQuizResults } from '../services/api';

const QuizManagement = () => {
  const [quizResults, setQuizResults] = useState([]);
  const [form] = Form.useForm();
  const [viewQuizId, setViewQuizId] = useState("");

  const handleSendQuiz = async (values) => {
    try {
      await sendQuiz(values);
      form.resetFields();
      message.success("Quiz sent successfully!");
    } catch {
      Modal.error({
        title: "Error",
        content: "Failed to send quiz.",
      });
    }
  };

  const handleViewResults = async () => {
    if (!viewQuizId) {
      Modal.error({
        title: "Error",
        content: "Please enter a quiz ID.",
      });
      return;
    }
    try {
      const resultsRes = await getQuizResults(viewQuizId);
      setQuizResults(resultsRes);
      message.success("Results loaded!");
    } catch {
      Modal.error({
        title: "Error",
        content: "Failed to load results.",
      });
    }
  };

  return (
    <div className="p-4">
      <h2>Quiz Management</h2>

      {/* Section to send a quiz */}
      <Form form={form} onFinish={handleSendQuiz} layout="inline" style={{ marginBottom: '16px' }}>
        <Form.Item
          name="question"
          label="Question"
          rules={[{ required: true, message: "Please input a question!" }]}
        >
          <Input placeholder="Enter your quiz question" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Send Quiz
          </Button>
        </Form.Item>
      </Form>

      {/* Section to view quiz results */}
      <div style={{ marginBottom: "16px" }}>
        <Input
          placeholder="Enter Quiz ID"
          style={{ width: 200, marginRight: "8px" }}
          value={viewQuizId}
          onChange={(e) => setViewQuizId(e.target.value)}
        />
        <Button onClick={handleViewResults} type="default">
          View Results
        </Button>
      </div>

      {/* Table to display quiz results */}
      <Table
        columns={[
          { title: "Student", dataIndex: "student", key: "student" },
          { title: "Answer", dataIndex: "answer", key: "answer" },
        ]}
        dataSource={quizResults}
        rowKey={(record) => record.student || record.id}
      />
    </div>
  );
};

export default QuizManagement;
