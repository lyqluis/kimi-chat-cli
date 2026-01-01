import React, { FC, useEffect, useRef, useState } from "react"
import { Box, Text, useInput } from "ink"
import { ViewMode } from "./index.js"
import Spinner from "ink-spinner"
import { ScrollView, ScrollViewRef } from "ink-scroll-view"
import { fetchMockChatHistory } from "./mocks/history.js"
import { useTerminalDimensions } from "./hooks/useTerminalDimensions.js"
import {
	getChatHistory,
	HistoryPayload,
	HistoryResponse,
} from "./api/history.js"
import { deleteChat } from "./api/chat.js"

interface HistoryViewProps {
	viewMode: ViewMode
	setViewMode: (mode: ViewMode) => void
	setChatId: (id: string) => void
}
const CONTENT_LEN = 200

export const HistoryList: FC<HistoryViewProps> = ({
	viewMode,
	setViewMode,
	setChatId,
}) => {
	// states
	const [historyData, setHistoryData] = useState<HistoryResponse | null>(null)
	const [isHistoryLoading, setIsHistoryLoading] = useState(false)
	const [historyIndex, setHistoryIndex] = useState(0)
	const [isExpand, setIsExpand] = useState(false)
	const [hasMore, setHasMore] = useState(false)
	const isHistoryMode = viewMode === "history"

	// ui
	const { rows } = useTerminalDimensions()
	const scrollRef = useRef<ScrollViewRef>(null)

	// handler
	const loadHistory = async (payload?: Partial<HistoryPayload>) => {
		setIsHistoryLoading(true)
		try {
			const res = await getChatHistory(payload)
			setHasMore(res.chats ? true : false)
			if (historyData) {
				// 加载更多，拼接到现有数据
				setHistoryData({
					...res,
					chats: [...historyData.chats, ...res.chats],
				})
			} else {
				// 首次加载
				setHistoryData(res)
			}
		} catch (err) {
			console.error("Failed to fetch history", err)
		} finally {
			setIsHistoryLoading(false)
		}
	}
	const deleteHistory = async (index: number) => {
		const chat = historyData?.chats[index]
		if (!chat) return
		try {
			const res = await deleteChat(chat.id)
			if (res.chatId) {
				// 保存删除前的数据长度，用于重新加载相同数量的数据
				const previousLength = historyData?.chats.length ?? 0
				setHistoryData({
					...historyData,
					chats: historyData.chats.filter((c) => c.id !== res.chatId),
				})
			}
		} catch (error) {
			console.error("Failed to delete history chat", error)
			return
		}
	}

	// 请求历史记录数据
	useEffect(() => {
		if (viewMode === "history" && !historyData) {
			loadHistory({ page_size: 10 })
		}
	}, [viewMode, historyData])

	// History 模式按键
	useInput(
		(inputStr, key) => {
			if (viewMode !== "history") return

			if (historyData && historyData.chats.length > 0) {
				// 上下箭头选择 (如果有数据)
				// PERF: 移动和滚动在展开条件下不太配套
				if (key.upArrow || inputStr === "k") {
					// 检查是否需要处理向上滚动
					const canScrollUp = () => {
						if (!scrollRef.current) return false
						const scrollOffset = scrollRef.current.getScrollOffset()
						return scrollOffset > 0
					}

					if (canScrollUp()) {
						setHistoryIndex((prev) => Math.max(0, prev - 1))
						scrollRef.current?.scrollBy(-2) // Scroll up 1 line
					} else {
						// 如果已经在顶部，则只更新选中索引
						setHistoryIndex((prev) => Math.max(0, prev - 1))
					}
				}
				if (key.downArrow || inputStr === "j") {
					// 检查是否需要处理向下滚动
					const canScrollDown = () => {
						if (!scrollRef.current) return false
						const scrollOffset = scrollRef.current.getScrollOffset()
						const contentHeight = scrollRef.current.getContentHeight()
						const viewportHeight = scrollRef.current.getViewportHeight()
						const bottomOffset = scrollRef.current.getBottomOffset()
						return scrollOffset < bottomOffset && contentHeight > viewportHeight
					}

					if (canScrollDown()) {
						setHistoryIndex((prev) =>
							Math.min(historyData.chats.length - 1, prev + 1)
						)
						scrollRef.current?.scrollBy(2) // Scroll down 1 line
					} else {
						// 如果已经在底部，则只更新选中索引
						setHistoryIndex((prev) =>
							Math.min(historyData.chats.length - 1, prev + 1)
						)
					}
				}
				// space, expand to preview chat
				if (inputStr === " ") {
					setIsExpand(!isExpand)
				}
				// 回车键：加载选中项
				if (key.return) {
					// TODO：
					const h = historyData.chats[historyIndex]
					setChatId(h?.id)
					setViewMode("chat")
					// handleLoadSelectedChat();
				}
				// load more history
				if (inputStr === "M") {
					loadHistory({
						page_size: 10,
						page_token: historyData.nextPageToken,
					})
				}
				// delete chat
				if (inputStr === "D") {
					deleteHistory(historyIndex)
				}
			}
		},
		{ isActive: isHistoryMode }
	)

	const scrollContent = (
		<>
			<ScrollView ref={scrollRef}>
				{historyData &&
					historyData.chats.map((chat, i) => {
						const isSelected = i === historyIndex
						return (
							<Box
								key={chat.id + "-" + i}
								flexDirection="column"
								marginBottom={1}
								paddingX={1}
							>
								{/* 第一行：ID 和 时间 */}
								<Box justifyContent="space-between" width="100%">
									<Text bold color={isSelected ? "yellow" : "blue"}>
										{isSelected ? "> " : "  "}
										{chat.name}
									</Text>
									<Text color="gray">
										{" "}
										{new Date(chat.createTime).toLocaleString()}
									</Text>
								</Box>
								{isSelected && isExpand && (
									<>
										{/* 第二、第三行展开可以看到 */}
										<Box paddingX={2} flexDirection="column">
											{/* 第二行：id */}
											<Text color="gray" dimColor>
												{chat.id}
											</Text>

											{/* 第三行：内容截断显示 */}
											<Text color="gray" italic>
												{chat.messageContent.length > CONTENT_LEN
													? chat.messageContent.substring(0, CONTENT_LEN) +
													  "..."
													: chat.messageContent}
											</Text>
										</Box>
									</>
								)}
							</Box>
						)
					})}
			</ScrollView>
		</>
	)

	return (
		<Box flexDirection="column" flexGrow={1} height={rows - 1}>
			{/* BUG: 一旦scrollview内容溢出，该box可能会被挤压导致渲染不正确 */}
			<Box
				borderStyle="double"
				borderColor="magenta"
				paddingX={1}
				marginBottom={1}
				justifyContent="space-between"
			>
				<Text bold color="magenta">
					📚 Chat History
				</Text>
			</Box>

			{/* 内容区域：列表 */}
			{scrollContent}

			{/* 加载提示 */}
			<Box paddingX={1}>
				<Text color="yellow">
					{isHistoryLoading ? (
						<>
							<Spinner type="dots" /> Loading chat history from server...
						</>
					) : hasMore ? (
						"↓ M to load more"
					) : null}
				</Text>
			</Box>

			{/* 底部提示 */}
			<Box marginTop={1} paddingX={1}>
				<Text color="green" bold>
					Tip:{" "}
				</Text>
				<Text color="gray">
					<Text bold>Enter</Text>: load chat, <Text bold>Esc</Text>: cancel,{" "}
					<Text bold>Space</Text>: expand to preview, <Text bold>M</Text>: load
					more, <Text bold>D</Text>: delete chat
				</Text>
			</Box>
		</Box>
	)
}
