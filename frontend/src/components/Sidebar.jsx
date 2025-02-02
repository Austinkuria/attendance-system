import { Menu } from "antd";
import {
  FaHome,
  FaQrcode,
  FaChartLine,
  FaQuestionCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      key: "home",
      icon: <FaHome />,
      label: "Home",
      onClick: () => navigate("/lecturer-dashboard"),
    },
    {
      key: "attendance",
      icon: <FaQrcode />,
      label: "Attendance",
      onClick: () => navigate("/attendance"),
    },
    {
      key: "analytics",
      icon: <FaChartLine />,
      label: "Analytics",
      onClick: () => navigate("/analytics"),
    },
    {
      key: "quizzes",
      icon: <FaQuestionCircle />,
      label: "Quizzes",
      onClick: () => navigate("/quizzes"),
    },
  ];

  return (
    <Menu
      theme="dark"
      mode="inline"
      defaultSelectedKeys={["home"]}
      items={menuItems}
    />
  );
};

export default Sidebar;