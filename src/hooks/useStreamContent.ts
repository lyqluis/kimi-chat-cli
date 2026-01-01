import { useMemo, useState } from "react"
import { useTerminalDimensions } from "./useTerminalDimensions.js"
import stringWidth from "string-width"
import { countActualLines } from "../utils/ui.js"

export const useStreamContent = () => {
	// data
	const [streamBuffer, setStreamBuffer] = useState("")

	// ui
	const { columns, rows } = useTerminalDimensions()
	// // 1. 设置视口高度阈值（留出输入框和间距，约占屏幕 60%）
	// const VIEWPORT_HEIGHT = Math.floor(rows * 0.6)
	// const USABLE_WIDTH = columns - 4

	// 核心参数：非常保守的计算
	// columns 和 rows 在某些环境启动瞬间可能是 0
	const winW = columns || 80
	const winH = rows || 24

	const USABLE_WIDTH = winW - 6 // 留出足够的 Padding
	// PERF: 溢出的文字显示依然有点遮挡边框或者出错
	const VIEWPORT_HEIGHT = Math.max(4, Math.floor(winH * 0.75)) // 动态视口占 75%
	// 2. 核心：计算当前应该显示哪些行
	const displayBuffer = useMemo(() => {
		if (!streamBuffer) return ""

		const allLines = streamBuffer.split("\n")
		const physicalRows: string[] = []

		// 1. 将所有逻辑行展开为物理行
		allLines.forEach((line) => {
			const width = stringWidth(line)
			if (width === 0) {
				physicalRows.push("")
			} else if (width <= USABLE_WIDTH) {
				physicalRows.push(line)
			} else {
				// 这里的逻辑：如果一行太长，手动切开
				// 我们可以用一个简单的循环按宽度切分字符串
				let tempLine = line
				while (stringWidth(tempLine) > 0) {
					// 粗略估算截取位置，这里建议保守一点，每行截取 USABLE_WIDTH 个字符
					// 注意：这只是为了保证高度计算，实际显示效果由 Text 的自动换行处理
					const sliceIndex = Math.floor(
						tempLine.length * (USABLE_WIDTH / stringWidth(tempLine))
					)
					physicalRows.push(tempLine.substring(0, sliceIndex))
					tempLine = tempLine.substring(sliceIndex)
				}
			}
		})

		// 2. 根据视口高度进行截断
		if (physicalRows.length <= VIEWPORT_HEIGHT) {
			return streamBuffer // 还没装满，返回原内容
		}

		// 3. 装满了，只返回最后能放下的几行
		// 关键：这里直接返回文本，因为物理行已经算准了
		return physicalRows.slice(-VIEWPORT_HEIGHT).join("\n")
	}, [streamBuffer, VIEWPORT_HEIGHT, USABLE_WIDTH])
	// const isCapped =
	// 	countActualLines(streamBuffer, USABLE_WIDTH) > VIEWPORT_HEIGHT

	// 计算当前内容实际会占用的物理行数
	const currentPhysicalLines = useMemo(() => {
		// 简单估算：直接复用上面的逻辑或使用 countActualLines
		return countActualLines(streamBuffer, USABLE_WIDTH)
	}, [streamBuffer, USABLE_WIDTH])

	// 决定 Box 的高度：要么随内容长，要么卡在 VIEWPORT_HEIGHT
	const dynamicBoxHeight =
		currentPhysicalLines > VIEWPORT_HEIGHT
			? VIEWPORT_HEIGHT + 1 // +1 给 AI: 标签
			: currentPhysicalLines + 1

	return { streamBuffer, setStreamBuffer, displayBuffer, dynamicBoxHeight }
}
