import { Link } from "react-router-dom";
import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  LineChartOutlined,
  FormOutlined,
} from "@ant-design/icons";

const { Sider } = Layout;

const Sidebar = () => {
  return (
    <Sider width={200} theme="light">
      <Menu mode="inline" defaultSelectedKeys={["1"]}>
        <Menu.Item key="1" icon={<DashboardOutlined />}>
          <Link to="/dashboard">Dashboard</Link>
        </Menu.Item>
        <Menu.Item key="2" icon={<UserOutlined />}>
          <Link to="/attendance">Attendance</Link>
        </Menu.Item>
        <Menu.Item key="3" icon={<LineChartOutlined />}>
          <Link to="/analytics">Analytics</Link>
        </Menu.Item>
        <Menu.Item key="4" icon={<FormOutlined />}>
          <Link to="/quizzes">Quizzes</Link>
        </Menu.Item>
      </Menu>
    </Sider>
  );
};

export default Sidebar;