import { useState, useEffect } from "react"
import { useStdout } from "ink"

export const useTerminalDimensions = () => {
	const { stdout } = useStdout()

	// 初始化时获取当前宽高
	const [dimensions, setDimensions] = useState({
		columns: stdout.columns,
		rows: stdout.rows,
	})

	useEffect(() => {
		const handler = () => {
			setDimensions({
				columns: stdout.columns,
				rows: stdout.rows,
			})
		}

		// 监听窗口缩放事件
		stdout.on("resize", handler)

		return () => {
			stdout.off("resize", handler)
		}
	}, [stdout])

	return dimensions
}
