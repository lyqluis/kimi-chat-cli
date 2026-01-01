import { SendMessageCallbacks } from "../api/message.js"
import { Message } from "../index.js"

// 模拟函数补全
export async function mockSendLongMessage(
	message: Message,
	chatInfo,
	callbacks: SendMessageCallbacks
) {
	return new Promise<string>((resolve) => {
		let text =
			"这是一个很长的测试回复，用来测试当内容超过屏幕高度时是否还会闪烁。我们移除了外层的边框，这样 Ink 就只需要重绘最后几行，而不需要重绘整个屏幕。这种“追加式”UI 是 CLI 工具最稳定的形态。"
		// 故意把回复变长，测试滚动
		text += text
		text += text
		text += text
		text += text
		// text += text

		let i = 0
		const interval = setInterval(() => {
			callbacks?.onAnswerUpdate(text[i])
			i += 2
			if (i >= text.length) {
				clearInterval(interval)
				resolve(text)
			}
		}, 20)
	})
}

// 模拟获取聊天信息
export async function mockGetChat(): Promise<any> {
	// 模拟网络请求延迟
	await new Promise((resolve) => setTimeout(resolve, 2000))

	const res = {
		chat: {
			id: "19b7514a-5cb2-8b98-8000-0910e2fe66c7",
			name: "Ink调试技巧",
			messageContent:
				"要将 `mockService` 替换为真实的 API 服务，你需要保持 **接口一致**（`sendMessage(history, onProgress)`），但修改内部实现。以下是完整的替换方案：\n\n## 方案一：直接替换为 Fetch API（推荐）\n\n```tsx\n// src/services/api.ts\nexport const apiService = {\n  async sendMessage(\n    history: Message[],\n    onProgress: (chunk: string) => void\n  ): Promise<string> {\n    const API_URL = process.env.API_URL || 'http://localhost:3000/api/chat';\n    const API_KEY = process.env.API_KEY;\n\n    try {\n      // 1. 建立 SSE 连接\n      const response = await fetch(API_URL, {\n        method: 'POST',\n        headers: {\n          'Content-Type': 'application/json',\n          'Authorization': `Bearer ${API_KEY}`,\n        },\n        body: JSON.stringify({\n          messages: history.map(msg => ({\n            role: msg.role,\n            content: msg.content,\n          })),\n          stream: true, // 启用流式响应\n        }),\n      });\n\n      if (!response.ok) {\n        throw new Error(`API Error: ${response.status}`);\n      }\n\n      // 2. 处理流式响应\n      const reader = response.body?.getReader();\n      if (!reader) {\n        throw new Error('Response body is not readable');\n      }\n\n      const decoder = new TextDecoder();\n      let fullContent = '';\n\n      while (true) {\n        const { done, value } = await reader.read();\n        \n        if (done) break;\n\n        // 解码字节流\n        const chunk = decoder.decode(value, { stream: true });\n        \n        // 处理 SSE 格式数据（需要后端返回正确的 SSE 格式）\n        const lines = chunk.split('\\n\\n');\n        \n        for (const line of lines) {\n          if (line.startsWith('data: ')) {\n            const data = line.slice(6); // 移除 \"data: \" 前缀\n            \n            if (data === '[DONE]') {\n              return fullContent;\n            }\n\n            try {\n              const parsed = JSON.parse(data);\n              const content = parsed.choices?.[0]?.delta?.content || '';\n              \n              if (content) {\n                fullContent += content;\n                onProgress(content); // 实时回调\n              }\n            } catch (e) {\n              console.warn('Failed to parse chunk:', data);\n            }\n          }\n        }\n      }\n\n      return fullContent;\n\n    } catch (error) {\n      console.error('API call failed:', error);\n      \n      // 提供降级方案：返回错误信息给 UI\n      onProgress('\\n\\n[Error: API call failed]');\n      throw error;\n    }\n  },\n};\n```\n\n## 方案二：适配 OpenAI 兼容 API\n\n如果后端是 OpenAI 兼容格式：\n\n```tsx\n// src/services/openai-api.ts\nexport const openaiService = {\n  async sendMessage(\n    history: Message[],\n    onProgress: (chunk: string) => void\n  ): Promise<string> {\n    const response = await fetch('https://api.openai.com/v1/chat/completions', {\n      method: 'POST',\n      headers: {\n        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,\n        'Content-Type': 'application/json',\n      },\n      body: JSON.stringify({\n        model: 'gpt-3.5-turbo',\n        messages: history,\n        stream: true,\n      }),\n    });\n\n    const reader = response.body?.getReader();\n    const decoder = new TextDecoder();\n    let fullContent = '';\n\n    while (true) {\n      const { done, value } = await reader.read();\n      if (done) break;\n\n      const lines = decoder.decode(value).split('\\n');\n      for (const line of lines) {\n        if (line.startsWith('data: ')) {\n          const data = line.slice(6);\n          if (data === '[DONE]') return fullContent;\n          \n          try {\n            const parsed = JSON.parse(data);\n            const content = parsed.choices[0].delta.content || '';\n            fullContent += content;\n            onProgress(content);\n          } catch (e) {}\n        }\n      }\n    }\n\n    return fullContent;\n  },\n};\n```\n\n## 方案三：非流式 API 适配\n\n如果后端不支持流式响应，需要模拟进度：\n\n```tsx\n// src/services/non-stream-api.ts\nexport const apiService = {\n  async sendMessage(\n    history: Message[],\n    onProgress: (chunk: string) => void\n  ): Promise<string> {\n    const response = await fetch(process.env.API_URL, {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ messages: history }),\n    });\n\n    const data = await response.json();\n    const fullResponse = data.response || data.content;\n\n    // 模拟打字机效果\n    const chars = fullResponse.split('');\n    for (let i = 0; i < chars.length; i++) {\n      onProgress(chars[i]);\n      await new Promise(resolve => setTimeout(resolve, 30)); // 30ms 延迟\n    }\n\n    return fullResponse;\n  },\n};\n```\n\n## 步骤：替换到项目中\n\n### 1. 删除 mockService，导入 apiService\n\n```tsx\n// src/app.tsx\n// 删除这行\n// import { mockService } from './mock-service';\n\n// 添加这行（根据你的方案选择）\nimport { apiService } from './services/api'; // 或 './services/openai-api'\n\n// 在 handleSubmit 中替换\nconst finalContent = await apiService.sendMessage(\n  [...messages, userMsg],\n  (chunk) => setStreamBuffer((prev) => prev + chunk)\n);\n```\n\n### 2. 配置环境变量\n\n创建 `.env` 文件：\n```bash\n# .env\nAPI_URL=http://localhost:3000/api/chat\nAPI_KEY=your-api-key-here\nOPENAI_API_KEY=sk-your-openai-key  # 如果使用 OpenAI\n```\n\n### 3. 错误处理增强\n\n在 `app.tsx` 的 `handleSubmit` 中添加错误处理：\n\n```tsx\ntry {\n  const finalContent = await apiService.sendMessage(...);\n  // ... 成功逻辑\n} catch (error) {\n  // 显示错误消息\n  const errorMsg: Message = {\n    id: (Date.now() + 1).toString(),\n    role: \"assistant\",\n    content: `❌ 错误: ${error.message}`,\n    timestamp: Date.now(),\n    isError: true,\n  };\n  setMessages((prev) => [...prev, errorMsg]);\n} finally {\n  setIsThinking(false);\n  setStreamBuffer(\"\");\n}\n```\n\n### 4. 服务端实现参考（Node.js）\n\n如果你需要自己实现后端：\n\n```javascript\n// server.js (Express + SSE)\nconst express = require('express');\nconst app = express();\napp.use(express.json());\n\napp.post('/api/chat', async (req, res) => {\n  const { messages, stream } = req.body;\n  \n  res.setHeader('Content-Type', 'text/event-stream');\n  res.setHeader('Cache-Control', 'no-cache');\n  res.setHeader('Connection', 'keep-alive');\n\n  // 模拟流式响应\n  const response = \"这是来自真实 API 的回复...\";\n  const chars = response.split('');\n  \n  let i = 0;\n  const interval = setInterval(() => {\n    if (i < chars.length) {\n      res.write(`data: ${JSON.stringify({\n        choices: [{ delta: { content: chars[i] } }]\n      })}\\n\\n`);\n      i++;\n    } else {\n      clearInterval(interval);\n      res.write('data: [DONE]\\n\\n');\n      res.end();\n    }\n  }, 50);\n});\n\napp.listen(3000);\n```\n\n现在你的应用已经连接到真实 API，将支持真正的流式响应！",
			lastRequest: {
				options: {
					thinking: true,
				},
				tools: [
					{
						type: "TOOL_TYPE_SEARCH",
						search: {},
					},
				],
				scenario: "SCENARIO_K2",
			},
			createTime: "2025-12-31T15:44:06.133314Z",
			updateTime: "2026-01-01T11:32:04.362628Z",
		},
	}

	return res
}
