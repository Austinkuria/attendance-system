import { useState, useEffect, useContext } from "react";
import { Button } from "antd";
import { UpOutlined } from "@ant-design/icons";
import { ThemeContext } from "../context/ThemeContext";
import PropTypes from 'prop-types';

const BackToTop = ({ debug = false }) => {
    const [visible, setVisible] = useState(false);
    const { themeColors } = useContext(ThemeContext);

    useEffect(() => {
        const toggleVisible = () => {
            const scrolled = document.documentElement.scrollTop;
            setVisible(scrolled > 300);
        };

        // Add event listener inside useEffect
        window.addEventListener("scroll", toggleVisible);

        // Important: Remove the event listener on cleanup
        return () => window.removeEventListener("scroll", toggleVisible);
    }, []); // Empty dependency array to run only once on mount

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

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
                zIndex: 1000,
                display: visible ? "block" : "none",
                backgroundColor: themeColors?.primary || "#1890ff",
                borderColor: themeColors?.primary || "#1890ff",
                color: "#fff",
                // Debug border
                outline: debug ? "3px solid red" : "none",
                boxShadow: debug ? "0 0 0 5px rgba(255,0,0,0.5)" : "0 4px 10px rgba(0, 0, 0, 0.2)",
                // Make click target area more obvious in debug mode
                padding: debug ? "8px" : undefined,
                // Add a transparent border to visualize the clickable area
                border: debug ? "2px dashed #ff0000" : undefined,
            }}
        />
    );
};

// Add prop types validation
BackToTop.propTypes = {
    debug: PropTypes.bool
};

export default BackToTop;