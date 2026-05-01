import fetch from 'node-fetch';

/**
 * Pings the server every 10 minutes to prevent Render's free tier from sleeping.
 * Note: An external pinger (like Cron-job.org) is still recommended for reliability.
 */
export const startSelfPinging = (url: string) => {
    if (!url) {
        console.log('Self-pinging: No URL provided, skipping.');
        return;
    }

    console.log(`Self-pinging: Initialized for ${url}`);

    // Ping every 10 minutes (600,000 ms)
    setInterval(async () => {
        try {
            const response = await fetch(url);
            console.log(`Self-pinging: Pinged ${url} - Status: ${response.status}`);
        } catch (error) {
            console.error('Self-pinging: Error pinging server', error);
        }
    }, 600000);
};
