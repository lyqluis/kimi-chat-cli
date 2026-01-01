// import { Message } from "./storage.js";
import { Buffer } from "buffer"
import { API_CONFIG } from "./index.js"
import type { ChatInfo } from "./chat.js"
import { ToggleState } from "../ui.js"

// 定义 JSON payload 的接口
// interface ChatPayload {
// 	scenario: string
// 	message: {
// 		role: "user" | "assistant" | "system"
// 		blocks: Array<{
// 			text: {
// 				content: string
// 			}
// 		}>
// 	}
// 	options: {
// 		thinking: boolean
// 	}
// }

interface Options {
	thinking: boolean
}

interface Tool {
	type: string // "TOOL_TYPE_SEARCH"
	search: {}
}

// 定义继续聊天的 payload 接口
interface ChatPayload {
	chat_id?: string
	scenario: string // "SCENARIO_K2"
	tools?: Array<Tool>
	message: {
		parent_id?: string // /ListMessages => res.messages[0].id
		role: "user" | "assistant" | "system"
		blocks: Array<{
			message_id?: string // ''
			text: {
				content: string
			}
		}>
		scenario?: string
	}
	options: Options
}

interface OptionsAndTools {
	options: Options
	tools?: Array<Tool>
}

const SEARCH_TOOL = {
	type: "TOOL_TYPE_SEARCH",
	search: {},
}

/**
 * 发送消息并返回一个生成器，用于流式读取数据
 */
async function* sendBufferMessage(
	message: Message,
	chatInfo: ChatInfo,
	optionsAndTools?: OptionsAndTools
) {
	// 1. 构造原始 JSON
	const jsonPayload: ChatPayload = {
		chat_id: chatInfo?.id ?? null,
		scenario: "SCENARIO_K2",
		tools: optionsAndTools.tools ?? chatInfo?.lastRequest?.tools ?? null,
		message: {
			role: "user",
			blocks: [
				{
					text: { content: message.content },
				},
			],
		},
		options: optionsAndTools?.options ?? chatInfo?.lastRequest?.options ?? null,
	}

	// 2. 封装为 Connect 协议格式 (Binary)
	const jsonBuffer = Buffer.from(JSON.stringify(jsonPayload), "utf8")
	const envelope = Buffer.alloc(5)
	envelope.writeUInt8(0, 0) // Flags: 0 表示数据
	envelope.writeUInt32BE(jsonBuffer.length, 1) // 4字节长度
	const body = Buffer.concat([envelope, jsonBuffer])
	// 转换为标准的 Uint8Array
	const finalBody = new Uint8Array(
		body.buffer,
		body.byteOffset,
		body.byteLength
	)

	// 【日志 1】查看发送的二进制数据，确认不是纯文本 JSON
	// console.log(">>> [DEBUG] ENV TOKEN:", API_CONFIG.headers.Authorization);
	// console.log(
	// 	">>> [DEBUG] Sending Binary Body (Hex):",
	// 	body.toString("hex").slice(0, 50) + "..."
	// );
	// console.log(">>> [DEBUG] Payload Length:", jsonBuffer.length);
	// console.log(
	// 	">>> [DEBUG] Binary Prefix (First 10 bytes):",
	// 	Array.from(finalBody.slice(0, 10))
	// 		.map((b) => b.toString(16).padStart(2, "0"))
	// 		.join(" ")
	// );

	try {
		const response = await fetch(API_CONFIG.endpoint + "/Chat", {
			method: "POST",
			headers: {
				...API_CONFIG.headers,
				"Content-Type": "application/connect+json",
				"Connect-Protocol-Version": "1",
			},
			body: finalBody,
		})

		// console.log("<<< [DEBUG] Response Status:", response.status);
		// console.log(
		// 	"<<< [DEBUG] Response Content-Type:",
		// 	response.headers.get("content-type")
		// );

		if (!response.ok) {
			const errorText = await response.text()
			// console.error("!!! [ERROR] Server returned:", errorText);
			throw new Error(`API Error: ${response.statusText}`)
		}

		if (!response.body) throw new Error("No response body")

		const reader = (response.body as any).getReader()
		let leftover = Buffer.alloc(0)

		while (true) {
			const { done, value } = await reader.read()
			if (done) {
				// console.log("<<< [DEBUG] Stream finished.");
				break
			}

			let buffer = Buffer.concat([leftover, Buffer.from(value)])

			// 3. 循环解析二进制帧
			while (buffer.length >= 5) {
				const flag = buffer.readUInt8(0)
				const len = buffer.readUInt32BE(1)

				if (buffer.length >= 5 + len) {
					const messageData = buffer.slice(5, 5 + len)
					buffer = buffer.slice(5 + len)

					// // 【日志 2】查看每一帧的数据块
					// console.log(
					// 	`\n--- [DEBUG] Received Frame (Flag: ${flag}, Length: ${len}) ---`
					// );

					if (flag === 0) {
						try {
							const rawString = messageData.toString("utf8")
							const json = JSON.parse(rawString)

							// 【日志 3】查看解析后的完整 JSON 对象结构
							// console.log("JSON Content:", JSON.stringify(json, null, 2));

							// 根据实际抓包看到的字段提取内容
							// const content = json?.block?.text?.content;
							// if (content) yield content;
							if (json) yield json as ChatEventChunk
						} catch (e) {
							console.error("Non-JSON Data:", messageData.toString("utf8"))
						}
					} else {
						// 如果 Flag 是 2，通常是包含了状态码的 Trailer
						// console.log(
						// 	"End-of-Stream Metadata:",
						// 	messageData.toString("utf8")
						// );
					}
				} else {
					break
				}
			}
			leftover = buffer
		}
	} catch (error: any) {
		console.error("!!! [ERROR] Request failed:", error.message)
		yield `[Error] ${error.message}`
	}
}

// --- 类型定义 ---
export interface Message {
	id: string
	role: "user" | "assistant" | "system"
	content: string
	timestamp: number
}

/** 常见的操作类型 */
type OpType = "set" | "append"

/** 数据掩码，决定了 message 或 block 内部哪个字段有效 */
type MaskType =
	| "message"
	| "chat.name"
	| "block.multiStage"
	| "block.stage"
	| "block.think"
	| "block.think.content"
/** 消息实体 */
interface ChatMessage {
	id: string
	parentId: string
	role: "user" | "assistant" | "system"
	status: "MESSAGE_STATUS_COMPLETED" | "MESSAGE_STATUS_GENERATING"
	scenario: string
	createTime: string
	blocks?: ContentBlock[]
}
/** 会话信息 */
/** 内容块（包含文本、思考过程、阶段状态等） */
interface ContentBlock {
	id: string
	parentId: string
	messageId?: string
	createTime?: string
	// 对应 mask: block.think 或 block.think.content
	think?: {
		content: string
	}
	// 对应 mask: block.multiStage
	multiStage?: {
		stages: Stage[]
	}
	// 对应 mask: block.stage
	stage?: Stage
	// 对应文本内容
	text?: {
		content: string
	}
}
/** 任务阶段状态 */
interface Stage {
	name: "STAGE_NAME_THINKING" | string
	status: "STAGE_STATUS_START" | "STAGE_STATUS_RUNNING" | "STAGE_STATUS_END"
	createTime: string
}
interface ChatEventChunk {
	op?: OpType
	mask?: MaskType
	eventOffset: number
	heartbeat?: Record<string, never> // 空对象 {}
	message?: Partial<ChatMessage>
	chat?: Partial<ChatInfo>
	block?: Partial<ContentBlock>
}
export interface SendMessageCallbacks {
	onChatUpdate?: (chat: Partial<ChatInfo>, eventOffset: number) => void // 聊天信息变更
	onStageUpdate?: (stage: Stage) => void // 阶段状态变更
	onThinkingUpdate?: (content: string) => void // 思考内容更新
	onAnswerUpdate?: (content: string) => void // 回答文本更新
	onMessageUpdate?: (message: Partial<ChatMessage>) => void // ? 消息状态变更
	onComplete?: (answer: string, think: string) => void // 流式结束
	onError?: (error: Error) => void // 错误处理
	onProgress?: (chunk: ChatEventChunk) => void
}
export async function sendMessage(
	message: Message,
	chatInfo,
	optionsAndToolsState: ToggleState,
	callbacks: SendMessageCallbacks
): Promise<string> {
	let fullResponse = ""
	let think = ""
	let answer = ""

	// handle options and tools
	const optionsAndTools = {
		options: { thinking: optionsAndToolsState.longThinking },
	} as OptionsAndTools
	optionsAndToolsState.webSearch && (optionsAndTools.tools = [SEARCH_TOOL])

	try {
		// 调用之前写的生成器函数
		const generator = sendBufferMessage(message, chatInfo, optionsAndTools)
		let messageUpdadated = false

		for await (const chunk of generator) {
			// 1. 更新累积的完整内容
			// TODO: just handle text for now
			// - return process status
			if (chunk.chat) {
				callbacks?.onChatUpdate?.(chunk.chat, chunk.eventOffset)
			} else if (chunk.message?.status === "MESSAGE_STATUS_GENERATING") {
				// TODO: temp is only update assistant message, update user and ai message
				// if chunk.message
				// - role === 'system' | 'user' | 'assistant'
				!messageUpdadated && callbacks?.onMessageUpdate?.(chunk.message)
				messageUpdadated = true
			} else if (chunk.mask?.includes("think")) {
				// update thinking
				const thinkString = chunk.block.think.content
				think += thinkString
				callbacks.onThinkingUpdate?.(thinkString)
			} else if (chunk.mask?.includes("text")) {
				// update answer
				const textString = chunk.block.text.content
				answer += textString
				callbacks?.onAnswerUpdate?.(textString)
			} else if (chunk?.block?.exception?.error) {
				// 高峰期算力不足
				const errorString =
					chunk.block.exception.error?.localizedMessage?.message
				answer += errorString
				callbacks?.onError?.(errorString)
			} else if (chunk?.message?.status === "MESSAGE_STATUS_CANCELLED") {
				// cancel send
				answer = "已停止输出"
			}

			// fullResponse += chunk;
			// 2. 通过回调把碎片传给 UI 渲染
			callbacks?.onProgress?.(chunk)
		}
		// console.log("full res:", fullResponse);
		// TODO: add think to ui
		return answer
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : "Unknown error"
		// callbacks?.onProgress?.(`\n[API Error: ${errorMsg}]`)
		console.error(`\n[API Error: ${errorMsg}]`)
		throw error
	}
}

interface CancelChatPayload {
	chat_id: string
	message_id: string
}

export const cancelSendMessage = async (
	payload: CancelChatPayload
): Promise<{}> => {
	const body = JSON.stringify(payload)

	try {
		const response = await fetch(API_CONFIG.endpoint + "/CancelChat", {
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
		throw new Error("Cancel Chat Error: " + error.message)
	}
}
