import { useEffect, useState } from 'react';
import { Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

let deferredPrompt = null;

const InstallButton = () => {
  const [installable, setInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      deferredPrompt = event;
      setInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response: ${outcome}`);

    deferredPrompt = null;
    setInstallable(false);
  };

  return (
    installable && (
      <div
        style={{
          position: 'fixed',
          right: '20px',         
          top: '20px',       
          zIndex: 110000,
          margin: '0 18px 18px 0',
        }}
      >
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleInstallClick}
          size="large"
        >
          Install App
        </Button>
      </div>
    )
  );
};

export default InstallButton;
