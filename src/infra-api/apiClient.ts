import axios from 'axios'

function takeCompactDataArray(payload: unknown): unknown {
    if (payload === null || typeof payload !== 'object' || !('data' in payload)) {
        throw new Error('Payload must be an object with a "data" property (same shape as getCompact.php)')
    }
    const { data } = payload as { data: unknown }
    if (data === undefined) {
        throw new Error('Payload "data" is missing')
    }
    return data
}

/**
 * PUT only the `data` array from the compact soccer stats payload to your REST API.
 */
export async function postGameCompact(responsePayload: unknown): Promise<void> {
    const url = process.env.GAME_COMPACT_API_URL
    if (!url || url.trim() === '') {
        throw new Error('GAME_COMPACT_API_URL is required')
    }

    const token = process.env.GAME_COMPACT_API_TOKEN

    const base = url.replace(/\/+$/, '')
    const putUrl = `${base}/api/SoccerStats`

    const body = takeCompactDataArray(responsePayload)

    await axios.put(
        putUrl,
        body,
        {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            timeout: 120_000,
            validateStatus: status => status >= 200 && status < 300
        }
    )
}
