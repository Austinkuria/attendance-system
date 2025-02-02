import { Layout } from "antd";
import Sidebar from "../components/Sidebar";
import AttendanceManagement from "../components/AttendanceManagement";
import Analytics from "../pages/Analytics";
import QuizManagement from "../components/QuizManagement";
import BackToTop from "../components/BackToTop";

const { Content } = Layout;

const LecturerDashboard = () => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        <Content style={{ padding: "24px" }}>
          {/* <h1>Lecturer Dashboard</h1> */}
          <AttendanceManagement />
          <Analytics />
          <QuizManagement />
          <BackToTop /> 
        </Content>
      </Layout>
    </Layout>
  );
};

export default LecturerDashboard;