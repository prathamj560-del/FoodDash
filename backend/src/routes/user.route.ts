import express from "express"
import { getCurrentUser, updateUserLocation } from "../controllers/user.controller"
import {isAuth} from "../middlewares/isAuth"


const userRouter = express.Router()

userRouter.get("/current", isAuth, getCurrentUser)
userRouter.post('/update-location', isAuth, updateUserLocation)
export default userRouter