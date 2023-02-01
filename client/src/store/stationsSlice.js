import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  byId: {},
  stopIds: []
}

export const stationsSlice = createSlice({
	name: 'stations',
	initialState,
	reducers: {
    receiveStations: (_, action) => {
      return action.payload
    }
  }
})

export const { receiveStations } = stationsSlice.actions;
export default stationsSlice.reducer;

export async function fetchStations() {
  try {
    const response = await fetch(`http://localhost:8000/stations`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/vnd.api+json'
      }
    })
    const payload = await response.json();
    if (response.ok) {
      return normalizeStationResponse(payload.data)
    } else {
      console.error(payload.data)
      throw(new Error(payload.data.detail))
    }
  } catch (error) {
    console.error(error)
    return {}
  }
}

function normalizeStationResponse(stations) {
  const state = {
    byId: {},
    stopIds: []
  }
  for(const station of stations) {
    state.stopIds.push(station.id)
    state.byId[station.id] = {
      stopId: station.attributes.stopId,
      stopName: station.attributes.stopName,
      stopCoordinates: station.attributes.stopCoordinates
    }
  }
  return state
}