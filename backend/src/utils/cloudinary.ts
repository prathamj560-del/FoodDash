import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import fs from "fs";
import dotenv from 'dotenv'
dotenv.config()
/**
 * Cloudinary Configuration
 * Ideally, move the config() call outside the function to avoid 
 * re-configuring on every single upload.
 */

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath: string): Promise<string | undefined> => {
    try {
        if (!localFilePath) return;

        // Upload the file to Cloudinary
        const response: UploadApiResponse = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // File has been uploaded successfully
        console.log("File uploaded on Cloudinary:", response.url);

        // Remove the locally saved temporary file
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return response.secure_url;

    } catch (error) {
        // Remove the locally saved temporary file as the upload operation failed
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        const err = error as UploadApiErrorResponse;
        console.error("Cloudinary Upload Error:", err.message);
        return ;
    }
};

export default uploadOnCloudinary;