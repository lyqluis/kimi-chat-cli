import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
	plugins: [react()],
	test: {
		environment: "node",
		include: ["src/**/*.test.{ts,tsx}", "src/**/*.spec.{ts,tsx}"],
		exclude: ["node_modules"],
		globals: true,
		watch: false,
		// 如果遇到 Ink 相关的导入问题，可以尝试取消下面两行的注释：
		// alias: { 'ink-testing-library': 'ink-testing-library/build/index.js' },
		// server: { deps: { fallbackCJS: true } }
	},
})
