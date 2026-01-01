import React, { useState } from "react"
import { ChatApp } from "./ui.js"
import { HistoryList } from "./history.js"
import { useApp, useInput } from "ink"
import { ViewMode } from "./index.js"

// type Props = {
// 	name: string | undefined;
// };

// export default function App({name = 'Stranger'}: Props) {
// 	return (
// 		<Text>
// 			Hello, <Text color="green">{name}</Text>
// 		</Text>
// 	);
// }

export default function App() {
	const { exit } = useApp() // 用于退出应用

	// --- 状态管理 ---
	const [viewMode, setViewMode] = useState<ViewMode>("chat")
	const [chatId, setChatId] = useState("")

	// --- 按键监听 ---
	useInput((inputStr, key) => {
		// 1. 优先处理全局退出 (Ctrl+C)
		// 注意：在 Ink 中，如果使用了 useInput，默认的进程退出可能会被拦截，需要手动处理
		if (inputStr === "c" && key.ctrl) {
			exit()
			process.exit(0) // 强制退出 Node 进程
		}

		// 2. Esc 返回
		if (viewMode !== "chat" && key.escape) {
			setViewMode("chat")
			// setInput("")
		}
	})

	if (viewMode === "history") {
		return (
			<HistoryList
				viewMode={viewMode}
				setViewMode={setViewMode}
				setChatId={setChatId}
			/>
		)
	}

	return (
		<ChatApp
			id={chatId}
			viewMode={viewMode}
			setViewMode={setViewMode}
			setChatId={setChatId}
		/>
	)
}
