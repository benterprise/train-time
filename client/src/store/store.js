import { configureStore } from '@reduxjs/toolkit'
import arrivals from './arrivalsSlice';
import stations from './stationsSlice';
import userConfig from './userConfigSlice';

export const store = configureStore({
  reducer: {
    arrivals,
    stations,
    userConfig
  }
})

export default store;