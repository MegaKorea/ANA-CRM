
export interface InsightRow {
    spend: string
    campaign_id: string
    account_name: string
    campaign_name: string
    actions: { action_type: string; value: string }[]
    date_start: string
    date_stop: string
}

export interface FBApiResponse {
    data: InsightRow[]
    error?: { message: string; code: number }
    paging?: { cursors: { before: string; after: string }; next?: string }
}

export interface FetchInsightsParams {
    startDate: string
    endDate: string
}

const AD_ACCOUNT_IDS = [
    "act_1175215059809297",
]

const access_token = process.env.NEXT_PUBLIC_FB_ACCESS_TOKEN

const baseUrl = "https://graph.facebook.com/v25.0"

export async function fetchInsights({
    startDate,
    endDate,
}: FetchInsightsParams): Promise<{ data: InsightRow[] | null; error: string | null }> {


    if (!access_token) {
        return { data: null, error: "FB_ACCESS_TOKEN chưa được cấu hình trong Environment Variables." }
    }

    const date = `time_range={"since":"${startDate}","until":"${endDate}"}`
    const filtering = `[{"field":"action_type","operator":"CONTAIN","value":"onsite_conversion.messaging_conversation_started_7d"}]`

    try {
        const results = await Promise.all(
            AD_ACCOUNT_IDS.map(async (accountId) => {
                const url =
                    `${baseUrl}/${accountId}/insights?fields=spend,campaign_id,account_name,campaign_name,actions` +
                    `&level=campaign&${date}&filtering=${encodeURIComponent(filtering)}&limit=5000&time_increment=1&access_token=${access_token}`

                const res = await fetch(url, { cache: "no-store" })
                const json: FBApiResponse = await res.json()

                if (json.error) {
                    throw new Error(`Account ${accountId}: ${json.error.message}`)
                }

                return json.data ?? []
            })
        )

        const mergedData = results.flat()
        return { data: mergedData, error: null }
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error"
        return { data: null, error: msg }
    }
}
