import {describe, it, expect} from "vitest"
import { countActualLines, formatTimestamp } from "./ui.js"

describe("countActualLines", () => {
	it("returns 0 for empty string", () => {
		const result = countActualLines("", 80)
		expect(result).toBe(0)
	})

	it("returns 1 for short line", () => {
		const result = countActualLines("Hello", 80)
		expect(result).toBe(1)
	})

	it("calculates single line wrap", () => {
		const longText = "a".repeat(100)
		const result = countActualLines(longText, 80)
		expect(result).toBe(2)
	})

	it("handles multiple lines", () => {
		const multiline = "line1\nline2\nline3"
		const result = countActualLines(multiline, 80)
		expect(result).toBe(3)
	})

	it("handles newline at end", () => {
		const withNewline = "text\n"
		const result = countActualLines(withNewline, 80)
		// "text\n" splits to ["text", ""], so 1 + 1 = 2 lines
		expect(result).toBe(2)
	})

	it("handles empty lines", () => {
		const withEmptyLines = "text\n\ntext"
		const result = countActualLines(withEmptyLines, 80)
		// "text\n\ntext" splits to ["text", "", "text"], so 1 + 1 + 1 = 3 lines
		expect(result).toBe(3)
	})
})

describe("formatTimestamp", () => {
	it("returns time only for today", () => {
		// Create a timestamp for today
		const today = new Date()
		today.setHours(12, 0, 0, 0)
		const result = formatTimestamp(today.getTime())
		// Should not contain the date, only time
		expect(result).not.toContain(String(today.getFullYear()))
	})

	it("returns full date for past dates", () => {
		const pastDate = new Date("2020-01-15T12:00:00Z")
		const result = formatTimestamp(pastDate.getTime())
		// Should contain the date
		expect(result).toContain("2020")
		expect(result).toContain("1")
		expect(result).toContain("15")
	})

	it("handles string timestamp", () => {
		const result = formatTimestamp("2020-01-15T12:00:00Z")
		expect(result).toContain("2020")
	})
})
