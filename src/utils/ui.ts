import stringWidth from "string-width"

export const countActualLines = (text: string, columns: number): number => {
	if (!text) return 0
	const lines = text.split("\n")
	let total = 0
	for (const line of lines) {
		const width = stringWidth(line)
		total += width === 0 ? 1 : Math.ceil(width / columns)
	}
	return total
}

export function formatTimestamp(timestamp: string | number): string {
	const date = new Date(timestamp)
	const now = new Date()
	const isToday = date.toDateString() === now.toDateString()

	if (isToday) {
		return date.toLocaleTimeString()
	}

	return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}
