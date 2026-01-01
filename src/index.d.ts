// 聊天消息
export interface Message {
	id: string
	role: "user" | "assistant" | "system"
	content: string
	timestamp: number
}

// 历史记录单条数据
export interface ChatRecord {
	id: string
	name: string
	messageContent: string
	createTime: string
	updateTime: string
}

// 历史记录 API 响应结构
export interface HistoryResponse {
	chats: ChatRecord[]
	nextPageToken: string
}

export type ViewMode = "chat" | "history"
