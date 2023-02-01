import { useState } from "react"
import { useInterval } from "../hooks/useInterval"
import { unixToTime, now } from "../util/timestampTools"

export default function Clock() {
  const [time, setTime] = useState(now())
  useInterval(() => {
    setTime(time + 1)
  }, 1000)
  return (
    <div className="clock">
      <span>{unixToTime(time)}</span>
    </div>
  )
}