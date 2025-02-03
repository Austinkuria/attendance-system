import { useEffect, useState, useRef } from 'react';
import { Button, Space } from 'antd';
import { DownloadOutlined, CloseOutlined } from '@ant-design/icons';
import styled, { keyframes } from 'styled-components';

const slideIn = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const InstallBanner = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  padding: 16px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  display: flex;
  align-items: center;
  gap: 16px;
  animation: ${slideIn} 0.3s ease-out;
  
  &.dismissing {
    animation: ${fadeOut} 0.2s ease-in forwards;
  }

  @media (max-width: 768px) {
    bottom: 0;
    right: 0;
    left: 0;
    border-radius: 0;
    justify-content: space-between;
  }
`;

const InstallButton = () => {
  const [installable, setInstallable] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [dismissed, setDismissed] = useState(
    localStorage.getItem('installPromptDismissed') === 'true'
  );
  
  const deferredPrompt = useRef(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      if (dismissed) return;
      
      event.preventDefault();
      deferredPrompt.current = event;
      
      setTimeout(() => {
        setInstallable(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    window.addEventListener('appinstalled', () => {
      setInstallable(false);
      localStorage.setItem('installPromptDismissed', 'true');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      deferredPrompt.current = null;
    };
  }, [dismissed]);

  const handleDismiss = () => {
    setIsDismissing(true);
    setTimeout(() => {
      setInstallable(false);
      setDismissed(true);
      localStorage.setItem('installPromptDismissed', 'true');
    }, 200);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt.current) return;

    try {
      await deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      
      if (outcome === 'accepted') {
        localStorage.setItem('installPromptDismissed', 'true');
      }
    } catch (error) {
      console.error('Installation failed:', error);
    }
    
    deferredPrompt.current = null;
    handleDismiss();
  };

  if (!installable || isDismissing) return null;

  return (
    <InstallBanner className={isDismissing ? 'dismissing' : ''}>
      <Space>
        <Button
          type="primary"
          shape="round"
          icon={<DownloadOutlined />}
          onClick={handleInstallClick}
          size="large"
          aria-label="Install application"
        >
          Install App
        </Button>
        <span>Get the full experience</span>
      </Space>
      <Button
        type="text"
        icon={<CloseOutlined />}
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
      />
    </InstallBanner>
  );
};

export default InstallButton;