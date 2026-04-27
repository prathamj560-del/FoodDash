import express from "express"

import { upload } from "../middlewares/multer"
import { isAuth } from "../middlewares/isAuth"
import { addItem, deleteItem, editItem, getItemByCity, getItemById, getItemsByShop, rating, searchItems, trackSearch, trackItemClick, getRecommendations } from "../controllers/item.controller"
import { cacheMiddleware } from "../middlewares/cache"



const itemRouter = express.Router()

itemRouter.post("/add-item", isAuth, upload.single("image"), addItem)
itemRouter.post("/edit-item/:itemId", isAuth, upload.single("image"), editItem)
// Cache individual items for 5 minutes
itemRouter.get("/get-by-id/:itemId", isAuth, cacheMiddleware({ expirySeconds: 300, keyPrefix: 'item' }), getItemById)
itemRouter.get("/delete/:itemId", isAuth, deleteItem)
// Cache item listings for 5 minutes
itemRouter.get("/get-by-city/:city", isAuth, cacheMiddleware({ expirySeconds: 300, keyPrefix: 'item' }), getItemByCity)
itemRouter.get("/get-by-shop/:shopId", isAuth, cacheMiddleware({ expirySeconds: 300, keyPrefix: 'item' }), getItemsByShop)
itemRouter.get("/search-items", isAuth, searchItems)
itemRouter.post("/rating", isAuth, rating)

// Recommendation and tracking routes
itemRouter.post("/track-search", isAuth, trackSearch)
itemRouter.post("/track-click", isAuth, trackItemClick)
itemRouter.get("/recommendations", isAuth, getRecommendations)

export default itemRouter
