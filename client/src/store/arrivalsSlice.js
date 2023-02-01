import { createSlice } from "@reduxjs/toolkit";
import { unixTimestamp, unixToTime } from '../util/timestampTools'

const initialState = {}

export const arrivalsSlice = createSlice({
    name: 'arrivals',
    initialState,
    reducers: {
        replaceArrivalsForStopId: (state, action) => {
            state[action.payload.stopId] = enrichArrivals(action.payload.data)
        }
    }
})

function enrichArrivals(arrivals) {
  return arrivals.map(arrival => {
    return {
      ...arrival,
      tombstone: false
    }
  })
}

export const { replaceArrivalsForStopId } = arrivalsSlice.actions;
export default arrivalsSlice.reducer;

export async function fetchArrivals(stopId, direction) {
  // TODO attach the user lookaheadTime to query string if exists
  try {
    console.log(`${unixToTime(unixTimestamp())} - Fetching Nearby Arrivals for ${stopId}${direction}`)
    const response = await fetch(`http://localhost:8000/fake_arrivals/${stopId}${direction}`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/vnd.api+json'
      }
    })
    const payload = await response.json();
    if (response.ok) {
      return payload.data
    } else {
      console.error(payload.data)
      throw(new Error(payload.data.detail))
    }
  } catch (error) {
    console.error(error)
    return []
  }
}