import type { HistoryResponse } from "../api/history.js"

const mockChatList = {
	chats: [
		{
			id: "19b7514a-5cb2-8b98-8000-0910e2fe66c7",
			name: "Ink调试技巧",
			messageContent:
				'你遇到的是 `tsx --watch` 模式的典型行为。这个问题的原因是 **终端 raw mode 状态没有正确恢复** 导致的。以下是几种解决方案：\n\n## 方案 1：再按一次 Ctrl+C（最简单）\n\n这是标准行为，不是 bug：\n1. **第一次 Ctrl+C**：退出你的 Ink 应用，tsx 显示 *"Completed running..."*\n2. **第二次 Ctrl+C**：完全退出 tsx watch 模式，终端恢复正常\n\n**为什么？** `tsx --watch` 会保持主进程运行以监听文件变化，需要显式终止。\n\n---\n\n## 方案 2：修改代码 - 正确清理终端状态\n\n你的 Ink 应用退出时可能没有恢复终端状态，导致 stdin 被锁定。\n\n```tsx\nimport { useApp, useStdin } from \'ink\';\nimport { useEffect } from \'react\';\n\nconst App = () => {\n  const { exit } = useApp();\n  const { stdin } = useStdin();\n\n  // 关键：确保组件卸载时恢复终端\n  useEffect(() => {\n    return () => {\n      // 清理函数，恢复终端状态\n      stdin?.setRawMode(false);\n      stdin?.pause();\n    };\n  }, [stdin]);\n\n  // 监听退出\n  useInput((input, key) => {\n    if (key.ctrl && input === "c") {\n      // 先清理再退出\n      stdin?.setRawMode(false);\n      stdin?.pause();\n      exit();\n      \n      // 保险起见，延迟强制退出\n      setTimeout(() => process.exit(0), 50);\n    }\n  });\n\n  return <Text>Press Ctrl+C to exit</Text>;\n};\n```\n\n---\n\n## 方案 3：修改开发命令（推荐）\n\n使用 `nodemon` 代替 `tsx --watch`，它会更好地处理进程退出：\n\n```bash\nnpm install -D nodemon\n```\n\n修改 `package.json`：\n```json\n{\n  "scripts": {\n    "dev": "nodemon --watch src --ext ts,tsx --exec \'tsx src/cli.tsx\'",\n    "dev:raw": "tsx src/cli.tsx"  // 不使用 watch 模式\n  }\n}\n```\n\n现在：\n- `pnpm dev`：文件变化自动重启，**Ctrl+C 一次完全退出**\n- `pnpm dev:raw`：无监听模式，每次手动运行，但 Ctrl+C 行为最正常\n\n---\n\n## 方案 4：不手动捕获 Ctrl+C\n\n**最佳实践**：在开发模式下，**不要**在代码中手动处理 Ctrl+C，让终端和进程自然处理：\n\n```tsx\n// 删除这段代码，让 SIGINT 信号自然传递\n// useInput((input, key) => {\n//   if (key.ctrl && input === "c") {\n//     exit();\n//   }\n// });\n```\n\n这样：\n- Ctrl+C 发送 SIGINT 信号\n- Ink 自动清理并退出\n- tsx watch 捕获退出并显示完成信息\n- 终端状态保持正常\n\n---\n\n## 方案 5：使用 `ink-devtools` 开发模式\n\n```bash\nnpm install -D ink-devtools\n```\n\n修改入口文件：\n```tsx\n// src/cli.tsx\nimport devtools from \'ink-devtools\';\nimport App from \'./app.js\';\n\nif (process.env.NODE_ENV === \'development\') {\n  devtools(<App />);\n} else {\n  render(<App />);\n}\n```\n\n---\n\n## 推荐工作流\n\n```bash\n# 1. 开发时使用（无 watch）\npnpm dev:raw\n\n# 2. 需要监听文件时（按两次 Ctrl+C）\npnpm dev\n\n# 3. 生产构建后测试\npnpm build\n./dist/cli.js\n```\n\n| 方案 | 优点 | 缺点 | 适用场景 |\n|------|------|------|----------|\n| **方案1**（按两次） | 无需修改代码 | 需要按两次 | 快速开发 |\n| **方案2**（清理代码） | 终端状态正常 | 代码侵入 | 复杂应用 |\n| **方案3**（nodemon） | 退出干净 | 额外依赖 | 长期项目 |\n| **方案4**（不捕获） | 最简洁 | 失去自定义逻辑 | 简单 CLI |\n\n**我的建议**：先用 **方案1** 适应 double Ctrl+C，如果长期困扰再改用 **方案3**（nodemon）。',
			createTime: "2025-12-31T15:44:06.133314Z",
			updateTime: "2026-01-01T07:10:18.660478Z",
		},
		{
			id: "19b7828f-7db2-8e20-8000-0910436bcd2f",
			name: "Prettier与Emoji输入",
			messageContent:
				'杀掉 tsx 进程有多种方法，从精确到批量，推荐按以下顺序操作：\n\n### 方法 1：精确杀死（推荐）\n先查看 PID，再杀死指定进程：\n```bash\n# 查找 tsx 进程\nps aux | grep "[t]sx"\n\n# 根据 PID 优雅终止（12345 为示例 PID）\nkill 12345\n\n# 如果未响应，强制终止\nkill -9 12345\n```\n\n---\n\n### 方法 2：一键杀死所有 tsx 进程\n```bash\n# 使用 pkill（最常用）\npkill -f tsx\n\n# 强制杀死\npkill -9 -f tsx\n\n# 使用 killall\nkillall tsx\n```\n\n---\n\n### 方法 3：组合命令（查找并杀死）\n```bash\n# 杀死所有匹配的 tsx 进程\nps aux | grep "[t]sx" | awk \'{print $2}\' | xargs kill\n\n# 强制版本\nps aux | grep "[t]sx" | awk \'{print $2}\' | xargs kill -9\n```\n\n---\n\n### ⚠️ 重要注意事项\n\n**1. 先确认再杀死**\n```bash\n# 先查看会杀死哪些进程（安全预览）\npgrep -fl tsx\n```\n\n**2. 优雅 vs 强制终止**\n-  **`kill PID`**  （默认 SIGTERM）：允许进程清理资源，安全退出\n-  **`kill -9 PID`**  （SIGKILL）：立即强制终止，可能导致数据丢失\n\n**3. 权限问题**\n如果提示 `Operation not permitted`：\n```bash\n# 加上 sudo\nsudo pkill -f tsx\n```\n\n**4. 避免误杀**\n如果进程名可能匹配到其他程序，使用更精确的模式：\n```bash\n# 只杀死包含特定文件名的 tsx 进程\npkill -f "tsx.*server\\.ts"\n\n# 或先手动确认\nps aux | grep tsx\n# 确认后再 kill 特定 PID\n```\n\n---\n\n### 💡 推荐流程\n```bash\n# 1. 查看\npgrep -fl tsx\n\n# 2. 尝试优雅终止\npkill -f tsx\n\n# 3. 验证是否已终止\npgrep -fl tsx\n\n# 4. 如果还有残留，强制终止\npkill -9 -f tsx\n```\n\n这样就能安全有效地清理 tsx 进程了！',
			createTime: "2026-01-01T06:05:09.511854Z",
			updateTime: "2026-01-01T07:06:39.834765Z",
		},
		{
			id: "19b3b86a-d7c2-8045-8000-09105ab8aad1",
			name: "接口术语翻译",
			messageContent:
				"**Chat UI is mostly complete**\n\n在敏捷开发日常交流中，也可以这么说：\n- *The Chat UI is nearly finished*\n- *Chat UI implementation is largely done*\n- *Chat UI is basically finished*",
			createTime: "2025-12-20T11:30:40.681124Z",
			updateTime: "2026-01-01T06:17:33.443044Z",
		},
		{
			id: "d5alb7gpe77ufcapeccg",
			name: "半自动咖啡机咖啡粉用量指南",
			messageContent:
				"一般情况下，半自动咖啡机制作一杯咖啡的咖啡粉用量在7-14克之间[^1^]。\n\n- **制作单杯咖啡**：通常建议使用7-9克咖啡粉[^1^][^11^]。如果使用的是标准的意式浓缩咖啡粉碗，一般容量为18-22克[^5^]，但实际制作单杯时，只需装入适量的粉，根据个人口味和咖啡机的具体情况调整。\n- **制作双杯咖啡**：一般需要12-14克咖啡粉[^1^]。\n\n需要注意的是，咖啡粉的用量会因咖啡豆的种类、研磨粗细程度以及个人口味偏好等因素而有所不同[^11^]。研磨较粗的咖啡粉，体积较大，所需用量较多；研磨较细的咖啡粉，体积较小，所需用量较少[^11^]。此外，萃取时间也很关键，通常萃取时间为25-35秒[^5^]，如果萃取时间过长或过短，可能会影响咖啡的风味[^5^]。",
			createTime: "2025-12-31T16:55:58.878076Z",
			updateTime: "2025-12-31T16:56:15.742390Z",
		},
		{
			id: "19b74ec4-6a12-86a2-8000-09105e0e1864",
			name: "pnpm 与 curl",
			messageContent:
				'## 错误分析\n\n这个错误表明服务器期望接收 **Protocol Buffers (protobuf)** 二进制格式，但你发送的是 **JSON** 格式，导致解析失败。\n\n**根本原因**：你尝试用 HTTP/JSON 访问 gRPC/protobuf 接口，**接口类型不匹配**。\n\n---\n\n## ✅ 解决方案\n\n### **方案 1：使用 `grpcurl` 工具（gRPC 接口）**\n\n```bash\n# 安装 grpcurl\nbrew install grpcurl  # macOS\n# 或\ngo install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest\n\n# 调用 ListChats 服务\ngrpcurl -H "Authorization: Bearer $TOKEN" \\\n        -d \'{"project_id": "your-project-id"}\' \\\n        api.example.com:443 \\\n        chatv1.ChatService/ListChats\n```\n\n### **方案 2：转换为 RESTful JSON 接口**\n\n**检查 API 端点是否正确**，gRPC 网关通常会映射到 REST 路径：\n```bash\n# 尝试添加 /v1/ 或 /api/ 前缀\ncurl -H "Authorization: Bearer $TOKEN" \\\n     -H "Content-Type: application/json" \\\n     -d \'{"project_id":"your-project-id"}\' \\\n     https://api.example.com/v1/chats\n```\n\n### **方案 3：咨询后端团队**\n\n确认接口文档：\n- 是否有 **gRPC-Gateway** JSON 支持？\n- **正确的 REST 端点**是什么？\n- 是否需要 **特定的 Content-Type**（如 `application/grpc`）？\n\n---\n\n## 🔍 快速诊断\n\n```bash\n# 检查接口支持的 Content-Type\ncurl -X OPTIONS -i https://api.example.com/list-chats\n```\n\n**结论**：你的 `curl` 命令格式正确，但**接口要求 protobuf 格式**。需要改用 `grpcurl` 或使用正确的 REST 端点。',
			createTime: "2025-12-31T15:00:00.330981Z",
			updateTime: "2025-12-31T15:36:08.051515Z",
		},
	],
	nextPageToken: "KgsI6IXVygYQ-JzIGA==",
}

export const fetchMockChatHistory = async (): Promise<HistoryResponse> => {
	const chats = mockChatList.chats
	// mockChatList.chats = [...chats, ...chats, ...chats]
	return new Promise((resolve) => {
		setTimeout(() => resolve(mockChatList), 1500)
	})
}
