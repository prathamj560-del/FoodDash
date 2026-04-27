import express from "express"
import { isAuth } from "../middlewares/isAuth"
import { upload } from "../middlewares/multer"
import { createEditShop, getMyShop, getShopByCity } from "../controllers/shop.controller"
import { cacheMiddleware } from "../middlewares/cache"



const shopRouter = express.Router()

shopRouter.post("/create-edit", isAuth, upload.single("image"), createEditShop)
shopRouter.get("/get-my", isAuth, getMyShop)
// Cache shop listings for 5 minutes (300 seconds)
shopRouter.get("/get-by-city/:city", isAuth, cacheMiddleware({ expirySeconds: 300, keyPrefix: 'shop' }), getShopByCity)

export default shopRouter