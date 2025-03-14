// Function to inject analytics
export async function loadAnalytics() {
    try {
        const { injectSpeedInsights } = await import('@vercel/speed-insights');
        const { inject } = await import('@vercel/analytics');
        injectSpeedInsights();
        inject();
    } catch (error) {
        console.error('Vercel Analytics failed to initialize:', error);
    }
}
