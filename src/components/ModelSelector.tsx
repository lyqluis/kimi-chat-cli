import React from "react"
import { Text } from "ink"
import { Selector } from "./Selector.js"
import { AVAILABLE_MODELS, type ModelId } from "../utils/models.js"

interface ModelSelectorProps {
	selectedModel: ModelId
	onSelect: (model: ModelId) => void
	onCancel: () => void
}

export const ModelSelector = ({
	selectedModel,
	onSelect,
	onCancel,
}: ModelSelectorProps) => {
	return (
		<Selector
			title="选择模型:"
			items={AVAILABLE_MODELS}
			selectedId={selectedModel}
			onSelect={(item) => onSelect(item.id)}
			onCancel={onCancel}
			renderItem={(model, _index, isSelected) => (
				<>
					<Text bold={isSelected}>{model.name}</Text>
					<Text color="gray">
						{" "}- {model.description}
					</Text>
				</>
			)}
			borderColor="yellow"
		/>
	)
}
