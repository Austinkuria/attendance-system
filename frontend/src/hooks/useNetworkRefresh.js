import { useEffect } from 'react';

/**
 * Hook to trigger a function when the network reconnects
 * 
 * @param {Function} refreshCallback - Function to call when network reconnects
 * @param {Array} dependencies - Dependencies for the effect (optional)
 */
const useNetworkRefresh = (refreshCallback, dependencies = []) => {
    useEffect(() => {
        // Handler function for the custom event
        const handleNetworkReconnection = () => {
            console.log('Network reconnected, refreshing data...');
            if (typeof refreshCallback === 'function') {
                refreshCallback();
            }
        };

        // Add event listener for the custom event
        window.addEventListener('networkReconnected', handleNetworkReconnection);

        // Clean up
        return () => {
            window.removeEventListener('networkReconnected', handleNetworkReconnection);
        };
    }, [...dependencies]); // Re-run if any dependencies change
};

export default useNetworkRefresh;
