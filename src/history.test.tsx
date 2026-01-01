import React from "react"
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest"
import {render} from "ink-testing-library"

// Mock problematic dependencies before import
vi.mock("./hooks/useTerminalDimensions.js", () => ({
	useTerminalDimensions: () => ({columns: 80, rows: 24}),
}))

vi.mock("./api/history.js", () => ({
	getChatHistory: vi.fn(() => Promise.resolve({
		chats: [],
		nextPageToken: undefined,
	})),
}))

vi.mock("./api/chat.js", () => ({
	deleteChat: vi.fn(() => Promise.resolve({chatId: ""})),
}))

// Import after mocking
const { HistoryList } = await import("./history.js")

// Mock the API and hooks
const defaultProps = {
	viewMode: "history" as const,
	setViewMode: () => {},
	setChatId: () => {},
}

describe("HistoryList", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it("renders without crashing", () => {
		const {lastFrame} = render(<HistoryList {...defaultProps} />)
		const frame = lastFrame()
		expect(frame).toBeTruthy()
	})

	it("renders in history mode", () => {
		const {lastFrame} = render(
			<HistoryList
				{...defaultProps}
				viewMode="history"
			/>
		)
		const frame = lastFrame()
		expect(frame).toBeTruthy()
	})

	it("renders when not in history mode", () => {
		const {lastFrame} = render(
			<HistoryList
				{...defaultProps}
				viewMode="chat"
			/>
		)
		const frame = lastFrame()
		expect(frame).toBeTruthy()
	})

	it("does not crash with empty history data", () => {
		const {lastFrame} = render(<HistoryList {...defaultProps} />)
		const frame = lastFrame()
		expect(frame).toBeTruthy()
	})
})
