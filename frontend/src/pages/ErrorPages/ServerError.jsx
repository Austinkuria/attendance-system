import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";

const ServerError = () => {
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
        status="500"
        title={<span style={{ color: themeColors.text }}>500</span>}
        subTitle={
          <span style={{ color: themeColors.text }}>
            Sorry, something went wrong on our end.
          </span>
        }
        extra={
          <Button
            type="primary"
            onClick={() => navigate("/")}
            style={{
              background: themeColors.primary,
              borderColor: themeColors.primary,
              color: isDarkMode ? themeColors.text : "#fff",
              borderRadius: "8px",
              transition: "all 0.3s",
            }}
          >
            Back Home
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

export default ServerError;