import { useContext } from "react"
import { useSelector } from "react-redux"
import { now, unixToTime } from "../util/timestampTools"
import { StationContext } from "./Station"
import Arrival from "./Arrival"

export default function ({ arrivals, direction}) {
  return (
    <div className='arrivals-container'>
      <span className="direction">{direction}</span>
      {
        arrivals.length > 0 ?
          <Arrivals arrivals={arrivals} /> :
          <NoArrivals />
      }
    </div>
  )
}

function NoArrivals() {
  const lookaheadTime = useSelector(state => state.userConfig.lookaheadTime)
  return (<div className="no-arrivals">No arrivals found within {lookaheadTime / 60} minutes</div>)
}

function Arrivals({ arrivals }) {
  return (
    <div className='arrivals-list'>
      { arrivals.map(arrival => <Arrival key={arrival.id} arrival={arrival} />) }
    </div>
  )
}