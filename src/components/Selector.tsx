import React, { useState } from "react"
import { Box, Text, useInput } from "ink"

interface SelectorProps<T> {
	title: string
	items: T[]
	selectedId?: string
	onSelect: (item: T) => void
	onCancel: () => void
	renderItem: (item: T, index: number, isSelected: boolean) => React.ReactNode
	loading?: boolean
	error?: string | null
	emptyText?: string
	borderColor?: string
}

export function Selector<T extends { id: string }>({
	title,
	items,
	selectedId,
	onSelect,
	onCancel,
	renderItem,
	loading = false,
	error = null,
	emptyText = "暂无数据",
	borderColor = "green",
}: SelectorProps<T>) {
	const initialIndex = selectedId
		? Math.max(0, items.findIndex((item) => item.id === selectedId))
		: 0
	const [cursor, setCursor] = useState(initialIndex)

	useInput(
		(input, key) => {
			if (key.escape) {
				onCancel()
				return
			}

			if (loading || error || items.length === 0) return

			if (key.downArrow || input === "j") {
				setCursor((prev) => (prev + 1) % items.length)
			} else if (key.upArrow || input === "k") {
				setCursor(
					(prev) => (prev - 1 + items.length) % items.length
				)
			} else if (key.return) {
				onSelect(items[cursor]!)
			}
		},
		{ isActive: true }
	)

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor={borderColor}
			paddingX={1}
			width="100%"
		>
			<Box>
				<Text bold color={borderColor}>
					{title}
				</Text>
				<Text color="gray">{" "}(↑↓/jk 选择, Enter 确认, Esc 取消)</Text>
			</Box>
			{loading && (
				<Box>
					<Text color="yellow">加载中...</Text>
				</Box>
			)}
			{error && (
				<Box>
					<Text color="red">加载失败: {error}</Text>
				</Box>
			)}
			{!loading && !error && items.length === 0 && (
				<Box>
					<Text color="gray">{emptyText}</Text>
				</Box>
			)}
			{!loading &&
				!error &&
				items.map((item, index) => (
					<Box key={item.id}>
						<Text color={index === cursor ? "green" : ""}>
							{index === cursor ? "❯ " : "  "}
						</Text>
						{renderItem(item, index, index === cursor)}
					</Box>
				))}
		</Box>
	)
}
