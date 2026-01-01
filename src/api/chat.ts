import { API_CONFIG } from "./index.js"

export interface ChatInfo {
	id: string
	name: string
	messageContent: string
	lastRequest: {
		options: {
			thinking: boolean
		}
		tools: Array<{
			type: string // "TOOL_TYPE_SEARCH"
			search?: Record<string, unknown> // {}
		}>
		scenario: string // SCENARIO_K2
	}
	createTime: string
	updateTime: string
}

export const getChat = async (id: string): Promise<ChatInfo> => {
	const body = JSON.stringify({ chat_id: id })

	try {
		const response = await fetch(API_CONFIG.endpoint + "/GetChat", {
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

export const getChatMessages = async (id: string, pageSize?: 1000) => {
	const body = JSON.stringify({ chat_id: id, page_size: pageSize })

	try {
		const response = await fetch(API_CONFIG.endpoint + "/ListMessages", {
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

interface DeleteChatPayload {
	chat_id: string
}
interface DeleteChatResponse {
	chatId: string // deleted chat id
}
export const deleteChat = async (id: string): Promise<DeleteChatResponse> => {
	const body = JSON.stringify({ chat_id: id } as DeleteChatPayload)

	try {
		const response = await fetch(API_CONFIG.endpoint + "/DeleteChat", {
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
