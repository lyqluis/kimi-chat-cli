export const COMMANDS = {
	history: "history",
	new: "new",
	help: "help",
	clear: "clear",
	exit: "exit",
} as const

export const isValidCommand = (value: string): boolean => {
	return value in COMMANDS
}

export const isCommand = (value: string): boolean => {
	return value.trim().startsWith("/")
}

export const getCommand = (value: string): string | null => {
	const command = value.trim().slice(1)
	return isValidCommand(command) ? command : null
}

export const isValidCommandInput = (value: string): boolean => {
	const command = getCommand(value)
	return command !== null
}
