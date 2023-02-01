import { createSlice } from "@reduxjs/toolkit";

const initialState = {}

export const userConfigSlice = createSlice({
	name: 'userConfig',
	initialState,
	reducers: {
    receiveUserConfig: (_, action) => {
      return action.payload;
    }
  }
})

export const { receiveUserConfig } = userConfigSlice.actions;
export default userConfigSlice.reducer;

export async function fetchConfig() {
  try {
    const response = await fetch(`http://localhost:8000/user_config`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/vnd.api+json'
      }
    })
    const payload = await response.json();
    if (response.ok) {
      return payload.data.attributes
    } else {
      console.error(payload.data)
      throw(new Error(payload.data.detail))
    }
  } catch (error) {
    console.error(error)
    return {}
  }
}