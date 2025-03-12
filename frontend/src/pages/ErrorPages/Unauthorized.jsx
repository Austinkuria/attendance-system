import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";

const Unauthorized = () => {
  const navigate = useNavigate();
  const { themeColors,isDarkMode } = useContext(ThemeContext);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: themeColors.background,
        padding: "16px",
      }}
    >
      <Result
        status="401"
        title={<span style={{ color: themeColors.text }}>401</span>}
        subTitle={
          <span style={{ color: themeColors.text }}>
            You are not authorized. Please log in.
          </span>
        }
        extra={
          <Button
            type="primary"
            onClick={() => navigate("/auth/login")}
            style={{
              background: themeColors.primary,
              borderColor: themeColors.primary,
              color: isDarkMode ? themeColors.text : "#fff",
              borderRadius: "8px",
              transition: "all 0.3s",
            }}
          >
            Go to Login
          </Button>
        }
      />
      <style>{`
        .ant-result-title {
          color: ${themeColors.text} !important;
        }
        .ant-result-subtitle {
          color: ${themeColors.text} !important;
        }
        .ant-btn-primary:hover,
        .ant-btn-primary:focus {
          background: ${themeColors.focus} !important;
          border-color: ${themeColors.focus} !important;
          color: ${themeColors.text} !important;
        }
      `}</style>
    </div>
  );
};

export default Unauthorized;