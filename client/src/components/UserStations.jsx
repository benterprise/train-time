import { useSelector } from "react-redux";
import Station from "./Station";

export default function() {
  const stations = useSelector(state => state.userConfig.stations || [])
  return (
    <div className='stations'>
      { stations.map(stopId => <Station key={stopId} stopId={stopId} />) }
    </div>
  )
}