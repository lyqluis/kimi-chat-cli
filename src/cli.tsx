#!/usr/bin/env node
import React from "react"
import { render, Text, Box } from "ink"
import meow from "meow"
import App from "./app.js"

const cli = meow(
	`
	Usage
	  $ kimi-chat

	Commands
		/chat 		chat mode
		/history 	open chat history
		/exit 		exit app
		/new 			create new chat
`,
	{
		importMeta: import.meta,
		flags: {
			list: { type: "boolean", shortFlag: "l" },
		},
	}
)
// const sm = new SessionManager();

// 场景 1: 列出历史会话
// if (cli.flags.list) {
// 	// const sessions = sm.listSessions();
// 	const sessions = [
// 		{ id: "asdfas", date: "2026.1.1" },
// 		{ id: "asdfasd", date: "2025.12.11" },
// 	]
// 	render(
// 		<Box flexDirection="column" padding={1}>
// 			<Text bold underline>
// 				Saved Sessions:
// 			</Text>
// 			{sessions.map((s) => (
// 				<Text key={s.id}>
// 					<Text color="cyan">{s.id}</Text> - {s.date}
// 				</Text>
// 			))}
// 		</Box>
// 	)
// }
// // 场景 2: 正常启动 (TODO: 传递 resume ID 给 ChatApp)
// else {
render(<App />)
// }
