import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

const MethodNotAllowed = () => {
  const navigate = useNavigate();

  return (
    <Result
      status="405"
      title="405"
      subTitle="Method Not Allowed. Please try again."
      extra={
        <Button type="primary" onClick={() => navigate("/")}>
          Back Home
        </Button>
      }
    />
  );
};

export default MethodNotAllowed;
