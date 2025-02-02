import { useState } from "react";
import { Form, Input, Button, Table, Modal, Select } from "antd";
const { Option } = Select;
import { sendQuiz, getQuizResults } from "../services/api";

const QuizManagement = () => {
  const [quizResults, setQuizResults] = useState([]);
  const [form] = Form.useForm();
  const [selectedQuiz, setSelectedQuiz] = useState("");

  const handleSendQuiz = async (values) => {
    try {
      await sendQuiz(values);
      Modal.success({ title: "Success", content: "Quiz sent successfully!" });
      form.resetFields();
    } catch {
      Modal.error({ title: "Error", content: "Failed to send quiz." });
    }
  };

  const handleViewResults = async () => {
    if (!selectedQuiz) {
      Modal.error({ title: "Error", content: "Please select a quiz." });
      return;
    }
    try {
      const resultsRes = await getQuizResults(selectedQuiz);
      setQuizResults(resultsRes);
    } catch {
      Modal.error({ title: "Error", content: "Failed to load results." });
    }
  };

  return (
    <div className="p-4">
      <h2>Quiz Management</h2>
      <Form form={form} onFinish={handleSendQuiz}>
        <Form.Item name="question" label="Question">
          <Input />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Send Quiz
          </Button>
        </Form.Item>
      </Form>
      <Select
        placeholder="Select Quiz"
        style={{ width: 200, marginBottom: 16 }}
        onChange={(value) => setSelectedQuiz(value)}
        value={selectedQuiz}
      >
        <Option value="quiz1">Quiz 1</Option>
        <Option value="quiz2">Quiz 2</Option>
      </Select>
      <Button onClick={handleViewResults}>View Results</Button>
      <Table
        columns={[
          { title: "Student", dataIndex: "student", key: "student" },
          { title: "Answer", dataIndex: "answer", key: "answer" },
        ]}
        dataSource={quizResults}
      />
    </div>
  );
};

export default QuizManagement;