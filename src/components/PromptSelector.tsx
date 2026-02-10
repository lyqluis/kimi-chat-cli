import React, { useEffect, useState } from "react"
import { Text } from "ink"
import { Selector } from "./Selector.js"
import { getPrompSnippets, type PromptItem } from "../api/prompt.js"

interface PromptSelectorProps {
	onSelect: (prompt: PromptItem) => void
	onCancel: () => void
}

// 缓存提示词数据，避免重复请求
let cachedPrompts: PromptItem[] | null = null

export const PromptSelector = ({
	onSelect,
	onCancel,
}: PromptSelectorProps) => {
	const [prompts, setPrompts] = useState<PromptItem[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		// 如果有缓存数据，直接使用
		if (cachedPrompts) {
			setPrompts(cachedPrompts)
			setLoading(false)
			return
		}

		// 否则发起请求
		getPrompSnippets()
			.then((data) => {
				const items = data.items || []
				cachedPrompts = items
				setPrompts(items)
				setLoading(false)
			})
			.catch((err) => {
				setError(err instanceof Error ? err.message : "加载失败")
				setLoading(false)
			})
	}, [])

	return (
		<Selector
			title="选择预设提示词:"
			items={prompts}
			onSelect={onSelect}
			onCancel={onCancel}
			renderItem={(prompt, _index, isSelected) => (
				<>
					<Text>{prompt.emoji}</Text>
					<Text bold={isSelected}>{prompt.name}</Text>
					<Text color="gray">
						{"  "}使用 {prompt.use_count} 次
					</Text>
				</>
			)}
			loading={loading}
			error={error}
			emptyText="暂无预设提示词"
			borderColor="magenta"
		/>
	)
}
