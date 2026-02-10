import { API_CONFIG } from "./index.js"

export interface PromptItem {
	id: string
	content: string
	name: string
	emoji: string
	use_count: number
	is_full_content?: boolean // if true, then content is can be use directly
}

export interface PromptResponse {
	items: PromptItem[]
	total: number
	is_end: boolean
}

const BASE_URL = "/prompt-snippet"

export const getPrompSnippets = async () => {
	const body = JSON.stringify({ offset: 0, size: 1000 })

	try {
		const response = await fetch(API_CONFIG.baseEndpoint + BASE_URL + "/list", {
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
			throw new Error(`API Error: ${response.statusText}. ${errorText}`)
		}

		if (!response.body) throw new Error("No response body")

		const data = await response.json()
		return data
	} catch (error: any) {
		console.error("!!! [ERROR] Request failed:", error.message)
		throw error
	}
}
