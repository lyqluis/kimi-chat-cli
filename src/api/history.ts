import { API_CONFIG } from "./index.js"

export interface ChatHistoryItem {
	id: string
	name: string
	messageContent: string
	createTime: string // ISO 8601 format
	updateTime: string // ISO 8601 format
}
export interface HistoryResponse {
	chats: ChatHistoryItem[]
	nextPageToken: string
}
// API 请求参数
export interface HistoryPayload {
	project_id?: string
	page_size?: number
	page_token?: string
	query?: string
}

export const getChatHistory = async (
	payload?: HistoryPayload
): Promise<HistoryResponse> => {
	const defaultPayload = {
		project_id: "",
		page_size: 5,
		page_token: "",
		query: "",
	}
	const body = JSON.stringify({ ...defaultPayload, ...payload })

	try {
		const response = await fetch(API_CONFIG.endpoint + "/ListChats", {
			method: "POST",
			headers: {
				...API_CONFIG.headers,
				"Content-Type": "application/json",
				"Connect-Protocol-Version": "1",
			},
			body,
		})

		if (!response.ok) {
			const errorText = await response.text()
			// console.error("!!! [ERROR] Server returned:", errorText);
			throw new Error(`API Error: ${response.statusText}`)
		}

		if (!response.body) throw new Error("No response body")

		const data = await response.json()
		return data
	} catch (error: any) {
		console.error("!!! [ERROR] Request failed:", error.message)
		throw error
	}
}
