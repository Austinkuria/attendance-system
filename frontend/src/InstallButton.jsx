import { useEffect, useState } from 'react';
import { Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
// import 'antd/dist/antd.css'; 

let deferredPrompt = null;

const InstallButton = () => {
  const [installable, setInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      // Prevent the default mini-infobar on mobile
      event.preventDefault();
      // Stash the event so it can be triggered later.
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

    // Clear the deferredPrompt so it can only be used once.
    deferredPrompt = null;
    setInstallable(false);
  };

  return (
    installable && (
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
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
