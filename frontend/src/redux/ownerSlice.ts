import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Shop } from "../pages/schema";

interface OwnerSliceState {
    myShopData: Shop | null;
}

const initialState: OwnerSliceState = {
    myShopData: null
};

const ownerSlice = createSlice({
    name: "owner",
    initialState,
    reducers: {
        setMyShopData: (state, action: PayloadAction<Shop | null>) => {
            state.myShopData = action.payload
        }
    }
})

export const { setMyShopData } = ownerSlice.actions
export default ownerSlice.reducer
