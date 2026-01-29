// /api/GetAvailableModels
export type ModelId = string

export interface ModelInfo {
	id: ModelId
	name: string
	scenario: string
	description: string
}

export const AVAILABLE_MODELS: ModelInfo[] = [
	{
		id: "k2.5",
		name: "K2.5",
		scenario: "SCENARIO_K2D5",
		description: "最新一代旗舰模型",
	},
	{
		id: "k2",
		name: "K2",
		scenario: "SCENARIO_K2",
		description: "上一代旗舰模型",
	},
]

export const DEFAULT_MODEL: ModelId = "k2.5"

export const findModelId = (scenario: string): ModelId => {
	return (
		AVAILABLE_MODELS.find((m) => m.scenario === scenario)?.id ?? DEFAULT_MODEL
	)
}

export const findModelIndex = (id: ModelId) =>
	AVAILABLE_MODELS.findIndex((m) => m.id === id)

export const findModel = (id: ModelId) => {
	return AVAILABLE_MODELS.find((m) => m.id === id) ?? AVAILABLE_MODELS[0]!
}
