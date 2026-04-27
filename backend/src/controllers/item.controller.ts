import { Request, Response } from "express";
import Item from "../models/item.model";
import Shop from "../models/shop.model";
import Order from "../models/order.model";
import SearchHistory from "../models/searchHistory.model";
import uploadOnCloudinary from "../utils/cloudinary";
import mongoose from "mongoose";
import { invalidateCache } from "../middlewares/cache";

// Extend Express Request to include properties added by middleware (Auth/Multer)
interface AuthenticatedRequest extends Request {
    userId?: string;
    file?: Express.Multer.File;
}

export const addItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { name, category, foodType, price } = req.body;
        let image: string | undefined;

        if (req.file) {
            const result = await uploadOnCloudinary(req.file.path);
            image = result ?? undefined;
        }

        const shop = await Shop.findOne({ owner: req.userId });
        if (!shop) {
            return res.status(400).json({ message: "shop not found" });
        }

        const item = await Item.create({
            name,
            category,
            foodType,
            price: Number(price), // Ensure price is a number
            image,
            shop: shop._id,
        });

        shop.items.push(item._id as mongoose.Types.ObjectId);
        await shop.save();

        // Invalidate item caches
        await invalidateCache(`item:*/get-by-city/${shop.city}*`);
        await invalidateCache(`item:*/get-by-shop/${shop._id}*`);

        await shop.populate("owner");
        await shop.populate({
            path: "items",
            options: { sort: { updatedAt: -1 } },
        });

        return res.status(201).json(shop);
    } catch (error) {
        return res.status(500).json({ message: `add item error ${error}` });
    }
};

export const editItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { itemId } = req.params;
        const { name, category, foodType, price } = req.body;

        let image: string | undefined;
        if (req.file) {
            const result = await uploadOnCloudinary(req.file.path);
            image = result ?? undefined;
        }

        // Update only the fields provided
        const updateData: any = { name, category, foodType, price };
        if (image) updateData.image = image;

        const item = await Item.findByIdAndUpdate(itemId, updateData, { new: true }).populate('shop');

        if (!item) {
            return res.status(400).json({ message: "item not found" });
        }

        // Invalidate item caches
        await invalidateCache(`item:*/get-by-id/${itemId}*`);
        await invalidateCache(`item:*/get-by-shop/${item.shop}*`);
        const shop = await Shop.findById(item.shop);
        if (shop) {
            await invalidateCache(`item:*/get-by-city/${shop.city}*`);
        }

        const ownerShop = await Shop.findOne({ owner: req.userId }).populate({
            path: "items",
            options: { sort: { updatedAt: -1 } },
        });

        return res.status(200).json(ownerShop);
    } catch (error) {
        return res.status(500).json({ message: `edit item error ${error}` });
    }
};

export const getItemById = async (req: Request, res: Response) => {
    try {
        const { itemId } = req.params;
        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(400).json({ message: "item not found" });
        }
        return res.status(200).json(item);
    } catch (error) {
        return res.status(500).json({ message: `get item error ${error}` });
    }
};

export const deleteItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { itemId } = req.params;
        const item = await Item.findById(itemId).populate('shop');
        if (!item) {
            return res.status(400).json({ message: "item not found" });
        }

        // Store shop info before deletion
        const itemShop = item.shop as any;
        await Item.findByIdAndDelete(itemId);

        // Invalidate item caches
        await invalidateCache(`item:*/get-by-id/${itemId}*`);
        await invalidateCache(`item:*/get-by-shop/${itemShop._id}*`);
        await invalidateCache(`item:*/get-by-city/${itemShop.city}*`);

        const shop = await Shop.findOne({ owner: req.userId });
        if (shop) {
            // Fix: Compare string IDs because ObjectId objects won't match strictly
            shop.items = shop.items.filter((id) => id.toString() !== itemId);
            await shop.save();
            await shop.populate({
                path: "items",
                options: { sort: { updatedAt: -1 } },
            });
        }

        return res.status(200).json(shop);
    } catch (error) {
        return res.status(500).json({ message: `delete item error ${error}` });
    }
};

export const getItemByCity = async (req: Request, res: Response) => {
    try {
        const { city } = req.params;
        if (!city) {
            return res.status(400).json({ message: "city is required" });
        }

        const shops = await Shop.find({
            city: { $regex: new RegExp(`^${city}$`, "i") },
        });

        const shopIds = shops.map((shop) => shop._id);
        const items = await Item.find({ shop: { $in: shopIds } }).populate("shop", "name image");

        return res.status(200).json(items);
    } catch (error) {
        return res.status(500).json({ message: `get item by city error ${error}` });
    }
};

export const getItemsByShop = async (req: Request, res: Response) => {
    try {
        const { shopId } = req.params;
        const shop = await Shop.findById(shopId).populate("items");
        if (!shop) {
            return res.status(400).json("shop not found");
        }
        return res.status(200).json({
            shop,
            items: shop.items,
        });
    } catch (error) {
        return res.status(500).json({ message: `get item by shop error ${error}` });
    }
};

export const searchItems = async (req: Request, res: Response) => {
    try {
        const { query, city } = req.query;
        if (!query || !city) {
            return res.status(400).json({ message: "Query and city are required" });
        }

        const shops = await Shop.find({
            city: { $regex: new RegExp(`^${city as string}$`, "i") },
        });

        const shopIds = shops.map((s) => s._id);
        const items = await Item.find({
            shop: { $in: shopIds },
            $or: [
                { name: { $regex: query as string, $options: "i" } },
                { category: { $regex: query as string, $options: "i" } },
            ],
        }).populate("shop", "name image");

        return res.status(200).json(items);
    } catch (error) {
        return res.status(500).json({ message: `search item error ${error}` });
    }
};

export const rating = async (req: Request, res: Response) => {
    try {
        const { itemId, rating } = req.body;

        if (!itemId || rating === undefined) {
            return res.status(400).json({ message: "itemId and rating is required" });
        }

        const numRating = Number(rating);
        if (numRating < 1 || numRating > 5) {
            return res.status(400).json({ message: "rating must be between 1 to 5" });
        }

        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(400).json({ message: "item not found" });
        }

        const newCount = (item.rating?.count || 0) + 1;
        const currentAverage = item.rating?.average || 0;
        const newAverage = (currentAverage * (item.rating?.count || 0) + numRating) / newCount;

        item.rating = {
            count: newCount,
            average: newAverage,
        };

        await item.save();
        return res.status(200).json({ rating: item.rating });
    } catch (error) {
        return res.status(500).json({ message: `rating error ${error}` });
    }
};

// Track search query
export const trackSearch = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { query, city } = req.body;

        if (!query || !city) {
            return res.status(400).json({ message: "Query and city are required" });
        }

        await SearchHistory.create({
            user: req.userId,
            query,
            city,
            clickedItems: []
        });

        return res.status(200).json({ message: "Search tracked" });
    } catch (error) {
        return res.status(500).json({ message: `track search error ${error}` });
    }
};

// Track item click
export const trackItemClick = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { itemId } = req.body;

        if (!itemId) {
            return res.status(400).json({ message: "Item ID is required" });
        }

        // Increment click count on item
        await Item.findByIdAndUpdate(itemId, { $inc: { clicks: 1 } });

        // Add to recent search history if exists
        const recentSearch = await SearchHistory.findOne({
            user: req.userId
        }).sort({ createdAt: -1 });

        if (recentSearch && !recentSearch.clickedItems.includes(itemId)) {
            recentSearch.clickedItems.push(itemId);
            await recentSearch.save();
        }

        return res.status(200).json({ message: "Click tracked" });
    } catch (error) {
        return res.status(500).json({ message: `track click error ${error}` });
    }
};

// Get personalized recommendations
export const getRecommendations = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { city } = req.query;

        if (!city) {
            return res.status(400).json({ message: "City is required" });
        }

        const userId = req.userId;

        // Get shops in city
        const shops = await Shop.find({
            city: { $regex: new RegExp(`^${city as string}$`, "i") },
        });
        const shopIds = shops.map((s) => s._id);

        // 1. Get user's order history to find favorite categories
        const userOrders = await Order.find({ user: userId })
            .populate({
                path: 'shopOrders.shopOrderItems.item',
                select: 'category'
            })
            .limit(10)
            .sort({ createdAt: -1 });

        const favoriteCategories = new Map<string, number>();
        userOrders.forEach((order: any) => {
            order.shopOrders.forEach((shopOrder: any) => {
                shopOrder.shopOrderItems.forEach((item: any) => {
                    if (item.item && item.item.category) {
                        const category = item.item.category;
                        favoriteCategories.set(category, (favoriteCategories.get(category) || 0) + 1);
                    }
                });
            });
        });

        const topCategories = Array.from(favoriteCategories.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([category]) => category);

        // 2. Get items from favorite categories
        const basedOnOrders = topCategories.length > 0
            ? await Item.find({
                shop: { $in: shopIds },
                category: { $in: topCategories }
            })
                .populate("shop", "name image")
                .limit(10)
                .sort({ rating: -1, clicks: -1 })
            : [];

        // 3. Get trending items (most ordered in last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentOrders = await Order.find({
            createdAt: { $gte: sevenDaysAgo }
        });

        const itemOrderCount = new Map<string, number>();
        recentOrders.forEach((order: any) => {
            order.shopOrders.forEach((shopOrder: any) => {
                shopOrder.shopOrderItems.forEach((item: any) => {
                    const itemId = item.item.toString();
                    itemOrderCount.set(itemId, (itemOrderCount.get(itemId) || 0) + item.quantity);
                });
            });
        });

        const trendingItemIds = Array.from(itemOrderCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([itemId]) => itemId);

        const trending = await Item.find({
            _id: { $in: trendingItemIds },
            shop: { $in: shopIds }
        }).populate("shop", "name image");

        // 4. Get popular items in city (by clicks and ratings)
        const popular = await Item.find({ shop: { $in: shopIds } })
            .populate("shop", "name image")
            .sort({ clicks: -1, "rating.average": -1 })
            .limit(10);

        // 5. Get items user clicked before
        const clickHistory = await SearchHistory.find({ user: userId })
            .populate('clickedItems')
            .sort({ createdAt: -1 })
            .limit(5);

        const clickedItemIds = new Set();
        clickHistory.forEach((search: any) => {
            search.clickedItems.forEach((item: any) => {
                if (item && item._id) clickedItemIds.add(item._id.toString());
            });
        });

        const basedOnClicks = clickedItemIds.size > 0
            ? await Item.find({
                _id: { $in: Array.from(clickedItemIds) }
            }).populate("shop", "name image")
            : [];

        return res.status(200).json({
            basedOnOrders,
            trending,
            popular,
            basedOnClicks
        });
    } catch (error) {
        return res.status(500).json({ message: `get recommendations error ${error}` });
    }
};
