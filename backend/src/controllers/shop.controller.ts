import { Request, Response } from "express";
import Shop from "../models/shop.model";
import uploadOnCloudinary from "../utils/cloudinary";
import fs from 'fs'
import { invalidateCache } from "../middlewares/cache";
/**
 * Extending the Request interface to include properties 
 * added by your auth and multer middlewares.
 */
interface AuthenticatedRequest extends Request {
    userId?: string; // This should be required if the route is protected
    file?: Express.Multer.File;
}

interface ShopData {
    name: string;
    city: string;
    state: string;
    address: string;
    owner?: string;
    image?: string; // Optional: prevents 'null' errors
}

export const createEditShop = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
        const { name, city, state, address } = req.body;

        // Initialize as undefined instead of null to satisfy TS/Mongoose String types
        let imageUrl: string | undefined = undefined;

        // Handle Image Upload
        if (req.file) {
            imageUrl = await uploadOnCloudinary(req.file.path);

            // Clean up the local 'public' folder after Cloudinary upload
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
        }

        let shop = await Shop.findOne({ owner: req.userId });

        // Build the data object using the interface
        const shopData: ShopData = {
            name,
            city,
            state,
            address,
            owner: req.userId,
        };

        // Only attach image if a new one was uploaded
        if (imageUrl) {
            shopData.image = imageUrl;
        }

        if (!shop) {
            // New Shop Creation
            if (!imageUrl) {
                return res.status(400).json({ message: "Shop image is required for new shops" });
            }
            shop = await Shop.create(shopData);
        } else {
            // Edit existing Shop
            // Mongoose will ignore the 'image' field if it's not in the shopData object
            shop = await Shop.findByIdAndUpdate(shop._id, shopData, { new: true });
        }

        if (!shop) {
            return res.status(404).json({ message: "Shop not found or created" });
        }

        // Invalidate cache for this city's shop listings
        await invalidateCache(`shop:*/get-by-city/${city}*`);

        await shop.populate("owner items");
        return res.status(201).json(shop);

    } catch (error) {
        // Cleanup file if error occurs during process
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return res.status(500).json({ message: `Create/Edit shop error: ${errorMessage}` });
    }
};

export const getMyShop = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
        const shop = await Shop.findOne({ owner: req.userId })
            .populate("owner")
            .populate({
                path: "items",
                options: { sort: { updatedAt: -1 } },
            });

        if (!shop) {
            // Return a 404 response instead of null
            return res.status(404).json({ message: "Shop not found" });
        }

        return res.status(200).json(shop);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return res.status(500).json({ message: `Get my shop error: ${errorMessage}` });
    }
};

export const getShopByCity = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { city } = req.params;

        const shops = await Shop.find({
            city: { $regex: new RegExp(`^${city}$`, "i") },
        }).populate("items");

        if (!shops || shops.length === 0) {
            return res.status(404).json({ message: "No shops found in this city" });
        }

        return res.status(200).json(shops);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return res.status(500).json({ message: `Get shop by city error: ${errorMessage}` });
    }
};
