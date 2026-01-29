import React, { useEffect, useRef, useState } from "react"
import { Box, Text, Static, useApp, useInput, useStdout } from "ink"
import TextInput from "ink-text-input"
import Spinner from "ink-spinner"
import { fetchMockChatHistory } from "./mocks/history.js"
import { cancelSendMessage, Message, sendMessage } from "./api/message.js"
import { useStreamContent } from "./hooks/useStreamContent.js"
import { ChatInfo, getChat, getChatMessages } from "./api/chat.js"
import { filterMessagesFromResponse } from "./utils/data.js"
import { ViewMode } from "./index.js"
import { COMMANDS, getCommand, isCommand } from "./utils/commands.js"
import { formatTimestamp } from "./utils/ui.js"
import {
	DEFAULT_MODEL,
	findModel,
	findModelId,
	type ModelId,
} from "./utils/models.js"
import { ModelSelector } from "./components/ModelSelector.js"

interface ChatAppProps {
	id: string
	viewMode: ViewMode
	setViewMode: (mode: ViewMode) => void
	setChatId: (id: string) => void
}
const processStates = {
	processing: "Processing",
	thinking: "Thinking",
	generating: "Generating",
	end: "",
}

// 开关状态
export type ToggleState = {
	webSearch: boolean
	longThinking: boolean
}

export const ChatApp = ({
	id,
	viewMode,
	setViewMode,
	setChatId,
}: ChatAppProps) => {
	const { write } = useStdout()
	const { exit } = useApp()

	// --- 状态管理 ---
	const [messages, setMessages] = useState<Message[]>([])
	const [chatInfo, setChatInfo] = useState<ChatInfo | {}>({})
	const [input, setInput] = useState("")
	const [processState, setProcessState] = useState(processStates.end)
	const [streamInfo, setStreamInfo] = useState({ id: "" })
	const [thinkingStreamBuffer, setThinkingStreamBuffer] = useState("")
	const [toggleState, setToggleState] = useState<ToggleState>({
		webSearch: true,
		longThinking: false,
	})
	const toggleCommandRef = useRef(false) // for prevent input update when use `ctrl + w/l`
	const isChatMode = viewMode === "chat"

	// 模型选择状态
	const [selectedModel, setSelectedModel] = useState<ModelId>(DEFAULT_MODEL) // K2.5
	const [showModelSelector, setShowModelSelector] = useState(false)

	// stream buffer
	const { streamBuffer, setStreamBuffer, displayBuffer, dynamicBoxHeight } =
		useStreamContent()

	// 清屏
	// \x1b[2J: 清除整个屏幕, \x1b[3J: 清除终端的回滚历史 (Scrollback buffer), \x1b[H:  将光标移动到左上角 (0,0)
	const clearOutput = () => write("\x1b[2J\x1b[3J\x1b[H")

	// when id change, get chat info & messages with new id
	// if new chat, id not existed, clear temp chat info and messages
	useEffect(() => {
		if (id && id !== chatInfo.id) {
			// get chat info
			getChat(id)
				.then((res) => {
					const chat = res.chat as ChatInfo
					setChatInfo(chat)
					setChatId(chat.id)
					setSelectedModel(findModelId(chat.lastRequest.scenario))
				})
				.catch((err) => {
					console.error("Failed to get chat:", err)
				})
			// get chat messages
			getChatMessages(id)
				.then((res) => {
					const finalMsgs = filterMessagesFromResponse(res.messages)
					setMessages(finalMsgs)
				})
				.catch((err) => {
					console.error("Failed to get chat messages:", err)
				})
		} else if (!id) {
			setChatInfo({})
			setMessages([])
		}
	}, [id])

	useInput(
		(inputStr, key) => {
			// 模型选择器激活时不处理其他快捷键
			if (showModelSelector) return

			// 取消发送
			if (key.escape) {
				// BUG: shoud be only active when sending message
				cancelSendMessage({
					chat_id: chatInfo?.id,
					message_id: streamInfo.id,
				})
			}
			// 切换开关 (Ctrl+W: 联网搜索, Ctrl+L: 长思考)
			if (key.ctrl && (inputStr === "w" || inputStr === "l")) {
				toggleCommandRef.current = true
				if (inputStr === "w") {
					setToggleState((prev) => ({ ...prev, webSearch: !prev.webSearch }))
				}
				if (inputStr === "l") {
					setToggleState((prev) => ({
						...prev,
						longThinking: !prev.longThinking,
					}))
				}
				setInput(input) // prevent the letter from appearing in the input field
			}
			// 打开模型选择器 (Ctrl+P)
			if (key.ctrl && inputStr === "p") {
				toggleCommandRef.current = true
				setShowModelSelector(true)
				setInput(input) // prevent the letter from appearing in the input field
				return
			}
		},
		{ isActive: isChatMode }
	)

	const handleInputChange = (value: string) => {
		if (toggleCommandRef.current) {
			toggleCommandRef.current = false
			return
		}
		setInput(value)
	}

	const handleSubmit = async (value: string) => {
		if (!value.trim() || processState !== processStates.end) return

		// handle input command
		if (isCommand(value)) {
			switch (getCommand(value)) {
				case COMMANDS.history:
					setViewMode("history")
					setInput("")
					clearOutput()
					break
				case COMMANDS.new: // start a new chat
					setInput("")
					setChatId("")
					setChatInfo({})
					setMessages([])
					setStreamBuffer("")
					clearOutput()
					break
				case COMMANDS.exit:
					exit()
					break
				default:
					setInput("wrong command")
					setTimeout(() => {
						setInput("")
					}, 3000)
					break
			}
			return
		}

		// Chat 逻辑
		// user message
		const userMsg: Message = {
			id: Date.now().toString(),
			role: "user",
			content: value,
			timestamp: Date.now(),
		}

		// 先把用户消息推入 Static 历史
		setMessages((prev) => [...prev, userMsg])
		setInput("")
		setProcessState("Processing")
		setStreamBuffer("") // 此时流缓冲区是空的

		// ai message
		const aiMsg: Message = {
			id: (Date.now() + 1).toString(),
			role: "assistant",
			content: "",
			timestamp: Date.now(),
		}

		try {
			// 获取选中模型的 scenario
			const modelInfo = findModel(selectedModel)

			// 模拟 API 调用
			// 1. if new chat, ge chat info from stream data
			// 2. send msg with existed id
			// const finalContent = await mockSendLongMessage(userMsg, chatInfo, {
			const finalContent = await sendMessage(
				userMsg,
				chatInfo,
				modelInfo,
				toggleState,
				{
					onMessageUpdate: (message) => {
						aiMsg.id = message.id
						setStreamInfo({ id: message.id })
					},
					onChatUpdate: (chat, eventOffset) => {
						if (eventOffset === 1) {
							setChatInfo(chat)
						} else {
							setChatInfo((prevInfo) => ({ ...prevInfo, ...chat }))
						}
					},
					onThinkingUpdate: (content) => {
						if (processState !== processStates.thinking)
							setProcessState(processStates.thinking)
						// setThinkingStreamBuffer((prev) => prev + content)
					},
					onAnswerUpdate: (answerString) => {
						if (processState !== processStates.generating)
							setProcessState(processStates.generating)
						setStreamBuffer((prev) => prev + answerString)
					},
					onError: (errorString) => {
						setStreamBuffer((prev) => prev + errorString)
					},
				}
			)

			// 生成完毕后：
			// 1. 将完整的 AI 回复推入 Static 历史
			aiMsg.content = finalContent
			setMessages((prev) => [...prev, aiMsg])
		} catch (error) {
			console.error(error)
		} finally {
			// 2. 清空流缓冲区，移除动态区域
			setStreamBuffer("")
			setProcessState("")
		}
	}

	// 获取当前选中模型的显示信息
	const currentModelInfo = findModel(selectedModel)

	return (
		<>
			{/* 1. 顶部 Header (高度固定！)
				不要把流式内容放在这里，否则会顶得下面乱跳
			*/}
			<Box
				flexDirection="column"
				paddingX={1}
				borderStyle="round"
				borderColor="cyan"
			>
				<Box
					// marginBottom={1}
					// paddingX={1}
					justifyContent="space-between"
					width="100%"
				>
					<Text bold color="cyan">
						👽 AI Chat CLI{" "}
						<Text color="yellow">
							{processState !== processStates.end ? (
								<>
									<Spinner type="dots" /> {processState}
								</>
							) : null}
						</Text>
					</Text>
					<Text>
						<Text color={toggleState.webSearch ? "green" : "gray"}>
							🌐{toggleState.webSearch ? "✓" : "✗"}
						</Text>
						<Text> </Text>
						<Text color={toggleState.longThinking ? "green" : "gray"}>
							🧠{toggleState.longThinking ? "✓" : "✗"}
						</Text>
						<Text> </Text>
						<Text color="gray" dimColor>
							(ctrl+w/l)
						</Text>
						<Text> | </Text>
						<Text color="yellow">{currentModelInfo.name}</Text>
						<Text> </Text>
						<Text color="gray" dimColor>
							(ctrl+p)
						</Text>
						<Text> | </Text>
						<Text color="green">● Online</Text>
					</Text>
				</Box>
				{(processState || streamBuffer) && (
					<Box
						flexDirection="column"
						// 显式指定 height，确保它不会塌陷或溢出
						height={dynamicBoxHeight}
						paddingX={1}
					>
						<Text>
							{/* 这里的内容已经被 displayBuffer 切准了，绝对不会溢出 Box */}
							{displayBuffer}
							{processState ? "▋" : ""}
						</Text>
					</Box>
				)}
			</Box>

			{/* 2. 历史记录 (Static)
        这些内容一旦渲染就变成终端的普通文本，不再重绘
				每组 user+assistant 对话之间用分割线分隔
      */}
			<Static items={messages}>
				{(msg, index) => {
					const isUser = msg.role === "user"
					const isFirstInPair = isUser

					return (
						<Box key={index} flexDirection="column">
							{isFirstInPair && (
								<Text color="gray" dimColor>
									{"─".repeat(50)}
								</Text>
							)}
							<Box flexDirection="column" marginBottom={0}>
								<Box>
									<Text bold color={isUser ? "green" : "blue"}>
										{isUser ? "You" : "AI"}:{" "}
									</Text>
									<Text color="gray">({formatTimestamp(msg.timestamp)})</Text>
								</Box>
								<Box paddingLeft={2}>
									<Text>{msg.content}</Text>
								</Box>
							</Box>
						</Box>
					)
				}}
			</Static>

			{/*
				4. 底部输入框 (始终固定在最底)
			 */}
			<Box width="100%">
				{showModelSelector ? (
					<ModelSelector
						selectedModel={selectedModel}
						onSelect={(model) => {
							setSelectedModel(model)
							setShowModelSelector(false)
						}}
						onCancel={() => setShowModelSelector(false)}
					/>
				) : (
					<Box
						borderStyle="single"
						borderColor="gray"
						paddingX={1}
						width="100%"
					>
						<Text color="green" bold>
							❯{" "}
						</Text>
						{viewMode === "chat" && processState === processStates.end ? (
							<TextInput
								value={input}
								onChange={handleInputChange}
								onSubmit={handleSubmit}
								placeholder="Type a message..."
							/>
						) : (
							<Text dimColor>AI is processing... (Esc to interrupt)</Text>
						)}
					</Box>
				)}
			</Box>
		</>
	)
}
