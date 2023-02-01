import React, { useEffect } from 'react'

import './Station.scss'

export const StationContext = React.createContext();

import { useInterval } from '../hooks/useInterval';
import { useSelector, useDispatch } from 'react-redux';
import { replaceArrivalsForStopId, fetchArrivals } from '../store/arrivalsSlice';
import StationName from './StationName';

import Arrivals from './Arrivals';


function Station({ northBoundArrivals, southBoundArrivals }) {
	return (
		<div className='station'>
      <StationName />
      <div className="station-arrivals">
          <Arrivals arrivals={northBoundArrivals} direction="North" />
          <Arrivals arrivals={southBoundArrivals} direction="South" />
      </div>
		</div>
	)
}

export default function ({ stopId }) {
  const dispatch = useDispatch();

	const fetchNorth = async () => {
    const arrivals = await fetchArrivals(stopId, 'N');
    dispatch(
      replaceArrivalsForStopId({
        stopId: `${stopId}N`,
        data: arrivals
      })
    )
  }

	const fetchSouth = async () => {
    const arrivals = await fetchArrivals(stopId, 'S');
    dispatch(
      replaceArrivalsForStopId({
        stopId: `${stopId}S`,
        data: arrivals
      })
    )
  }

	useEffect(() => {
		fetchNorth()
		fetchSouth()
	}, [])

	useInterval(fetchNorth, 15000)
	useInterval(fetchSouth, 15000)

  const northBoundArrivals = useSelector(state => state.arrivals[`${stopId}N`] || [])
  const southBoundArrivals = useSelector(state => state.arrivals[`${stopId}S`] || [])

	return (
    <StationContext.Provider value={stopId}>
      <Station
        northBoundArrivals={northBoundArrivals}
        southBoundArrivals={southBoundArrivals}
      />
    </StationContext.Provider>
	)
}