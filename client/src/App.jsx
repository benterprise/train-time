import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import './App.css'

import Clock from './components/Clock';
import UserStations from './components/UserStations';

import { fetchStations, receiveStations } from './store/stationsSlice';
import { fetchConfig, receiveUserConfig } from './store/userConfigSlice';

function App() {
  return (
    <div className="app">
      <Clock />
      <UserStations />
    </div>
  )
}

export default function () {
  const dispatch = useDispatch()
  // TODO: ideally these are a blocking operation
  // spinner is shown
  useEffect(() => {
    async function config() {
      const config = await fetchConfig()
      dispatch(receiveUserConfig(config))
    }
    config()

    async function stations() {
      const stations = await fetchStations();
      dispatch(receiveStations(stations))
    }
    stations()
  }, [])
  return <App />
}