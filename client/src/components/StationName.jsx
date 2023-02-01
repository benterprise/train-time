import { useContext } from "react"
import { useSelector } from "react-redux"
import { StationContext } from "./Station"

function StationName({ stopName, walkTime }) {
  return (
    <div className="station-info">
      <div className="station-name">
        <span>{stopName}</span>
      </div>
      <div className="station-info-times">
        <span>{walkTime / 60} minutes walk</span>
      </div>
    </div>
  )
}

export default function() {
  const stopId = useContext(StationContext)
  const stationInfo = useSelector(state => state.stations.byId[stopId])
  const userConfig = useSelector(state => state.userConfig)
  try {
    return (
      <StationName
        stopName={stationInfo.stopName}
        walkTime={userConfig.walkTimeToStations[stopId]}
        cushionTime={userConfig.cushionTime}
      />
    )
  } catch (error) {
    return null
  }
}