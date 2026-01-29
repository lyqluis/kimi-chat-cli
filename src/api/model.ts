import { API_CONFIG } from "./index.js"

interface AvailableModel {
	description: string
	displayName: string
	inputPlaceholder: string
	scenario: string
	thinking?: boolean
	kimiPlusId?: string // "ok-computer"
	label: string[] // ['beta']
	legacy?: boolean
}

interface AvailableModelsResponse {
	availableModels: AvailableModel[]
	defaultScenario: {
		scenario: "SCENARIO_K2D5"
		thinking: true
	}
}

export const getAvailableModels =
	async (): Promise<AvailableModelsResponse> => {
		try {
			const response = await fetch(API_CONFIG.endpoint + "/GetChat", {
				method: "POST",
				headers: {
					...API_CONFIG.headers,
					"Content-Type": "application/json",
					"Connect-Protocol-Version": "1",
				},
			})

			if (!response.ok) {
				const errorText = await response.text()
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
