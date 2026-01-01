import {describe, it, expect} from "vitest"
import { COMMANDS, isValidCommand, isCommand, getCommand, isValidCommandInput } from "./commands.js"

describe("COMMANDS", () => {
	it("contains expected commands", () => {
		expect(COMMANDS.history).toBe("history")
		expect(COMMANDS.new).toBe("new")
		expect(COMMANDS.help).toBe("help")
		expect(COMMANDS.clear).toBe("clear")
		expect(COMMANDS.exit).toBe("exit")
	})
})

describe("isValidCommand", () => {
	it("returns true for valid commands", () => {
		expect(isValidCommand("history")).toBe(true)
		expect(isValidCommand("new")).toBe(true)
		expect(isValidCommand("help")).toBe(true)
		expect(isValidCommand("clear")).toBe(true)
		expect(isValidCommand("exit")).toBe(true)
	})

	it("returns false for invalid commands", () => {
		expect(isValidCommand("unknown")).toBe(false)
		expect(isValidCommand("")).toBe(false)
		expect(isValidCommand("HISTORY")).toBe(false)
		expect(isValidCommand("/history")).toBe(false)
	})
})

describe("isCommand", () => {
	it("returns true for command input", () => {
		expect(isCommand("/history")).toBe(true)
		expect(isCommand("/new")).toBe(true)
		expect(isCommand("/help")).toBe(true)
		expect(isCommand("/exit")).toBe(true)
	})

	it("returns false for non-command input", () => {
		expect(isCommand("hello")).toBe(false)
		expect(isCommand("history")).toBe(false)
		expect(isCommand("")).toBe(false)
	})

	it("trims whitespace before checking", () => {
		expect(isCommand("  /history")).toBe(true)
		expect(isCommand("/history  ")).toBe(true)
	})
})

describe("getCommand", () => {
	it("extracts command name", () => {
		expect(getCommand("/history")).toBe("history")
		expect(getCommand("/new")).toBe("new")
		expect(getCommand("/exit")).toBe("exit")
	})

	it("returns null for invalid commands", () => {
		expect(getCommand("/unknown")).toBe(null)
		expect(getCommand("history")).toBe(null)
		expect(getCommand("")).toBe(null)
	})

	it("trims whitespace", () => {
		expect(getCommand("  /history")).toBe("history")
		expect(getCommand("/history  ")).toBe("history")
	})
})

describe("isValidCommandInput", () => {
	it("returns true for valid command input", () => {
		expect(isValidCommandInput("/history")).toBe(true)
		expect(isValidCommandInput("/new")).toBe(true)
		expect(isValidCommandInput("/exit")).toBe(true)
	})

	it("returns false for invalid input", () => {
		expect(isValidCommandInput("/unknown")).toBe(false)
		expect(isValidCommandInput("history")).toBe(false)
		expect(isValidCommandInput("")).toBe(false)
	})
})
