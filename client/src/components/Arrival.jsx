import { useContext } from "react"
import { useSelector } from "react-redux"
import { now, unixToTime } from "../util/timestampTools"
import { StationContext } from "./Station"

function Arrival({ arrival, leaveBy }) {
  if (leaveBy > now()) {
    return (
      <div className="arrival-item">
        <div className="arrival-time">
          <span>{arrival.attributes.line}</span>
          <span>{unixToTime(arrival.attributes.arrivalTime)}</span>
        </div>
        <div className="leave-time">
          <span>Leave</span>
          <span>{unixToTime(leaveBy)}</span>
        </div>
      </div>
    )
  }
}

export default function ({ arrival }) {
  const stopId = useContext(StationContext)
  const userConfig = useSelector(state => state.userConfig)
  try {
    const leaveBy = arrival.attributes.arrivalTime - userConfig.walkTimeToStations[stopId] - userConfig.cushionTime
    return (
      <Arrival
        arrival={arrival}
        leaveBy={leaveBy}
      />
    )
  } catch (error) {
    return null
  }
}