import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  LineChartOutlined,
  FormOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import PropTypes from 'prop-types';

const { Sider } = Layout;

const Sidebar = ({ collapsed, isMobile }) => {
  return (
    <Sider
      collapsed={collapsed}
      width={200}
      collapsedWidth={isMobile ? 0 : 80} // Fully collapse on mobile, partial on desktop
      theme="light"
      style={{
        boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
        overflow: "auto",
        height: "100vh",
        position: "fixed",
        left: 0,
        zIndex: 100,
      }}
    >
      <Menu
        mode="inline"
        defaultSelectedKeys={["1"]}
        style={{ height: "100%", borderRight: 0 }}
        items={[
          {
            key: "1",
            icon: <DashboardOutlined />,
            label: <Link to="/lecturer-dashboard">Dashboard</Link>,
          },
          {
            key: "2",
            icon: <UserOutlined />,
            label: <Link to="/attendance">Attendance</Link>,
          },
          {
            key: "3",
            icon: <LineChartOutlined />,
            label: <Link to="/analytics">Analytics</Link>,
          },
          {
            key: "4",
            icon: <FormOutlined />,
            label: <Link to="/lecturer/quizzes">Quizzes</Link>,
          },
        ]}
      />
    </Sider>
  );
};
Sidebar.propTypes = {
  collapsed: PropTypes.bool.isRequired,
  isMobile: PropTypes.bool.isRequired,
};

export default Sidebar;