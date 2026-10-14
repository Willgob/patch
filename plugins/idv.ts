type ApiResponse = {
    result: string;
    note? : string;
}

async function isVerif(slackId: string): Promise<boolean> {
    try {
        const url = new URL('https://auth.hackclub.com/api/external/check');
        url.searchParams.set('slack_id', slackId);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as ApiResponse;
        return data.result === "verified_eligible";
    } catch (error) {
        console.error('Error checking verification status:', error);
        return false;
    }
}