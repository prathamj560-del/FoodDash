import { configureStore } from "@reduxjs/toolkit";
import ownerSlice from "../redux/ownerSlice";
import mapSlice from "../redux/mapSlice";
import userSlice from "../redux/userSlice"


export const store = configureStore({
    reducer: {
        user: userSlice,
        owner: ownerSlice,
        map: mapSlice
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
