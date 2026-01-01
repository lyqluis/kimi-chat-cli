import { defineConfig } from "tsup"

export default defineConfig({
	// 入口文件
	entry: ["src/cli.tsx"],
	// 输出格式为 ESM
	format: ["esm"],
	// 提升目标环境，支持 Top-level await
	target: "es2022",
	// 开启代码清理
	clean: true,
	// 开启压缩 (Minify)，这有助于 Tree Shaking 彻底删掉 dead code
	minify: true,
	splitting: false, // 强制不拆分文件
	// 显式声明这是一个 Node 环境的项目
	platform: "node",
	// 注入环境变量，解决 dotenv 导入问题
	define: {
		"process.env.NODE_ENV": '"production"',
	},
	// 告诉 tsup 外部依赖，fs, os, path 等 Node 内置模块不需要打包进去
	// external: ["dotenv"],
	// 如果你想直接生成单个 JS 文件，开启 bundle
	bundle: true,
	// 这里的 shims 可以在 ESM 中模拟 __dirname 等变量
	shims: true,
	// 构建成功后，给文件加上执行权限（针对 CLI）
	onSuccess: "chmod +x dist/cli.js",
})
