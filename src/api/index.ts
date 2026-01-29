import { readFileSync, existsSync } from "fs"
import { homedir } from "os"
import { join } from "path"

// 构建产物使用用户主目录的配置文件
const isProduction = process.env.NODE_ENV === "production"

if (isProduction) {
	const configDir = join(homedir(), ".kimi-chat-cli")
	const configPath = join(configDir, "chatclirc")
	if (!existsSync(configPath)) {
		console.error(`Config file not found: ${configPath}`)
		console.error(`Please create the config file with your APP_TOKEN:`)
		console.error(`mkdir -p ${configDir}`)
		console.error(`echo 'APP_TOKEN="your_token_here"' > ${configPath}`)
		process.exit(1)
	}
	try {
		const configContent = readFileSync(configPath, "utf-8")
		// 使用正则匹配 APP_TOKEN="内容" 或 APP_TOKEN=内容
		// 匹配成功后，内容会存在 match[1] 中
		const match = configContent.match(/^APP_TOKEN=["']?([^"']+)["']?$/m)

		if (match && match[1]) {
			process.env.APP_TOKEN = match[1]
		} else {
			// 兼容性处理：如果没匹配到格式，但文件不为空，尝试直接作为 token
			// 或者抛出更详细的格式错误
			console.error(`Invalid config format in: ${configPath}`)
			console.error(`Expected: APP_TOKEN="your_token"`)
			process.exit(1)
		}
	} catch (error) {
		console.error(`Error reading config file: ${configPath}`)
		process.exit(1)
	}
} else {
	// 开发环境动态加载 dotenv
	const dotenv = await import("dotenv")
	dotenv.config()
}

// 自定义 API 配置
export const API_CONFIG = {
	endpoint: "https://www.kimi.com/apiv2/kimi.gateway.chat.v1.ChatService",
	headers: {
		Authorization: `Bearer ${process.env.APP_TOKEN}`,
		"sec-ch-ua":
			'"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
	},
}
