import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <Result
      status="401"
      title="401"
      subTitle="You are not authorized. Please log in."
      extra={
        <Button type="primary" onClick={() => navigate("/auth/login")}>
          Go to Login
        </Button>
      }
    />
  );
};

export default Unauthorized;
