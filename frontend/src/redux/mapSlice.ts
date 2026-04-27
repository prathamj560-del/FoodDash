import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface MapSliceState {
    location: {
        lat: number | null;
        lon: number | null;
    };
    address: string | null;
}

const initialState: MapSliceState = {
    location: {
        lat: null,
        lon: null
    },
    address: null
};

const mapSlice = createSlice({
    name: "map",
    initialState,
    reducers: {
        setLocation: (state, action: PayloadAction<{ lat: number; lon: number }>) => {
            const { lat, lon } = action.payload
            state.location.lat = lat
            state.location.lon = lon
        },
        setAddress: (state, action: PayloadAction<string | null>) => {
            state.address = action.payload
        }
    }
})

export const { setAddress, setLocation } = mapSlice.actions
export default mapSlice.reducer
