import { Layout, theme } from 'antd';
import Sidebar from "../components/Sidebar";
import AttendanceManagement from "../components/AttendanceManagement";
import Analytics from "../pages/Analytics";
import BackToTop from "../components/BackToTop";

const { Content } = Layout;

const LecturerDashboard = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      
      <Layout>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Attendance Management Section */}
            <section style={{ marginBottom: 48 }}>
              <AttendanceManagement />
            </section>

            {/* Analytics Section */}
            <section>
              <Analytics />
            </section>
          </div>

          <BackToTop />
        </Content>
      </Layout>
    </Layout>
  );
};

export default LecturerDashboard;