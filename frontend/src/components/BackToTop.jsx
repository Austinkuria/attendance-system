import { useState } from "react";
import { Button } from "antd";
import { UpOutlined } from "@ant-design/icons";

const BackToTop = () => {
    const [open, setVisible] = useState(false);

    const toggleVisible = () => {
        const scrolled = document.documentElement.scrollTop;
        setVisible(scrolled > 300);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("scroll", toggleVisible);

    return (
        <Button
            type="primary"
            shape="circle"
            icon={<UpOutlined />}
            size="large"
            onClick={scrollToTop}
            style={{
                position: "fixed",
                bottom: 20,
                right: 20,
                display: open ? "block" : "none",
            }}
        />
    );
};

export default BackToTop;