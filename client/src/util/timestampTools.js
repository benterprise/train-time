export function unixTimestamp (date = Date.now()) {
	return Math.floor(date / 1000)
}

export function now() {
  return unixTimestamp()
}

export function fromNow(minutes = 0) {
  return unixTimestamp() + (minutes * 60)
}

export function unixToTime(timestamp) {
	const date = new Date(timestamp * 1000)
	return date.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' })
}
