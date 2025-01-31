import { useEffect, useState } from 'react';

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
      <button onClick={handleInstallClick} className="install-btn">
        Install App
      </button>
    )
  );
};

export default InstallButton;
