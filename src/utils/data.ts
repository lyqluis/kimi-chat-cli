import { Message } from "../index.js"

export const filterMessagesFromResponse = (messages: any[]): Message[] => {
	const finalMessages = messages.map((msg) => {
		const block = msg.blocks?.find((block) => block?.text?.content)
		// console.log(block)
		if (block) {
			return {
				id: msg.id,
				role: msg.role,
				timestamp: msg.createTime,
				content: block.text.content,
			} as Message
		}
	})

	return finalMessages.filter((m) => m).reverse()
}
