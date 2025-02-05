import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout, Menu, Button } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  LineChartOutlined,
  FormOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";

const { Sider } = Layout;

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      theme="light"
      width={200}
    >
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setCollapsed(!collapsed)}
        style={{ margin: "16px 0", width: "100%" }}
      />
      <Menu mode="inline" defaultSelectedKeys={["1"]}>
        <Menu.Item key="1" icon={<DashboardOutlined />}>
          <Link to="/lecturer-dashboard">Dashboard</Link>
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