import { useState, useEffect, useContext } from 'react';
import { Button } from 'antd';
import { ArrowUpOutlined } from '@ant-design/icons';
import { ThemeContext } from '../context/ThemeContext';

const BackToTop = () => {
    const [visible, setVisible] = useState(false);
    const { themeColors } = useContext(ThemeContext);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                setVisible(true);
            } else {
                setVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <>
            {visible && (
                <Button
                    type="primary"
                    shape="circle"
                    icon={<ArrowUpOutlined />}
                    onClick={scrollToTop}
                    style={{
                        position: 'fixed',
                        bottom: 32,
                        right: 32,
                        zIndex: 10000,
                        background: themeColors.primary,
                        borderColor: themeColors.primary,
                        color: themeColors.text,
                        width: 50,
                        height: 50,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
                        pointerEvents: 'auto',
                    }}
                    className="back-to-top-btn"
                />
            )}
            <style>{`
        .back-to-top-btn:hover {
          background-color: ${themeColors.focus} !important;
          border-color: ${themeColors.focus} !important;
          transform: scale(1.1);
        }
      `}</style>
        </>
    );
};

export default BackToTop;