import React, { useState } from "react"
import { Box, Text, useInput } from "ink"
import {
	AVAILABLE_MODELS,
	findModelIndex,
	type ModelId,
} from "../utils/models.js"

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
	const [cursor, setCursor] = useState(
		Math.min(0, findModelIndex(selectedModel))
	)

	useInput(
		(input, key) => {
			if (key.escape) {
				onCancel()
				return
			}

			if (key.downArrow || input === "j") {
				setCursor((prev) => (prev + 1) % AVAILABLE_MODELS.length)
			} else if (key.upArrow || input === "k") {
				setCursor(
					(prev) =>
						(prev - 1 + AVAILABLE_MODELS.length) % AVAILABLE_MODELS.length
				)
			} else if (key.return) {
				onSelect(AVAILABLE_MODELS[cursor]!.id)
			}
		},
		{ isActive: true }
	)

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor="yellow"
			paddingX={1}
			width="100%"
		>
			<Box>
				<Text bold color="yellow">
					选择模型:
				</Text>
				<Text color="gray">{"  "}(↑↓/jk 选择, Enter 确认, Esc 取消)</Text>
			</Box>
			{AVAILABLE_MODELS.map((model, index) => (
				<Box key={model.id}>
					<Text color={index === cursor ? "green" : ""}>
						{index === cursor ? "❯ " : "  "}
					</Text>
					<Text bold={index === cursor}>{model.name}</Text>
					<Text color="gray">
						{" "}
						{"-"} {model.description}
					</Text>
				</Box>
			))}
		</Box>
	)
}
