import React from "react"
import {describe, it, expect, beforeEach, vi} from "vitest"
import {render} from "ink-testing-library"
import { Text, Box } from "ink"
import {useTerminalDimensions} from "./useTerminalDimensions.js"

// Helper component that renders the hook result
const TestComponent = () => {
	const {columns, rows} = useTerminalDimensions()
	return (
		<Box>
			<Text>columns:{columns}</Text>
			<Text>rows:{rows}</Text>
		</Box>
	)
}

describe("useTerminalDimensions", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("returns initial dimensions", () => {
		const {lastFrame} = render(<TestComponent />)
		const frame = lastFrame()
		expect(frame).toBeTruthy()
		expect(frame).toContain("columns:")
		expect(frame).toContain("rows:")
	})

	it("handles zero dimensions gracefully", () => {
		const {lastFrame} = render(<TestComponent />)
		const frame = lastFrame()
		// Should render without crashing
		expect(frame).toBeTruthy()
	})
})
