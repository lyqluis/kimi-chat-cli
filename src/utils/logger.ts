// 定义环境类型
type Env = "development" | "production" | "test"

const env: Env = (process.env.NODE_ENV as Env) ?? "development"

/**
 * 只有在非生产环境下才输出日志
 */
export const logger = {
	log: (...args: any[]) => {
		if (env !== "production") {
			console.info("[LOG]:", ...args)
		}
	},
	error: (...args: any[]) => {
		// 错误信息通常在生产环境也需要保留，或者发送到 Sentry 等监控平台
		console.error("[ERROR]:", ...args)
	},
	warn: (...args: any[]) => {
		if (env !== "production") {
			console.warn("[WARN]:", ...args)
		}
	},
	debug: (...args: any[]) => {
		if (env === "development") {
			console.debug("[DEBUG]:", ...args)
		}
	},
}
