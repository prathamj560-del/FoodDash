import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react'
import { IoIosArrowRoundBack } from "react-icons/io";
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaUtensils, FaCloudUploadAlt } from "react-icons/fa";
import axios from 'axios';
import { ClipLoader } from 'react-spinners';

import { SERVER_URI } from '../../App';
import { setMyShopData } from "../../redux/ownerSlice";

const CATEGORIES = [
    "Snacks", "Main Course", "Desserts", "Pizza", "Burgers",
    "Sandwiches", "South Indian", "North Indian", "Chinese",
    "Fast Food", "Others"
] as const;

type Category = typeof CATEGORIES[number] | "";

function AddItem() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // State management
    const [loading, setLoading] = useState<boolean>(false);
    const [name, setName] = useState<string>("");
    const [price, setPrice] = useState<string>("");
    const [frontendImage, setFrontendImage] = useState<string | null>(null);
    const [backendImage, setBackendImage] = useState<File | null>(null);
    const [category, setCategory] = useState<Category>("");
    const [foodType, setFoodType] = useState<"veg" | "non veg">("veg");

    const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setBackendImage(file);
            setFrontendImage(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!name || !price || !category) return; // Basic validation

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("category", category);
            formData.append("foodType", foodType);
            formData.append("price", price);
            if (backendImage) {
                formData.append("image", backendImage);
            }

            const result = await axios.post(
                `${SERVER_URI}/api/item/add-item`,
                formData,
                { withCredentials: true }
            );

            dispatch(setMyShopData(result.data));
            setLoading(false);
            navigate("/");
        } catch (error) {
            console.error("Submission error:", error);
            setLoading(false);
        }
    };

    return (
        <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8'>
            {/* Back Button */}
            <button
                onClick={() => navigate("/")}
                className='absolute top-6 left-6 p-2 hover:bg-white rounded-full transition-all shadow-sm group'
            >
                <IoIosArrowRoundBack size={32} className='text-gray-600 group-hover:text-[#ff4d2d]' />
            </button>

            <div className='w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100'>
                {/* Header Section */}
                <div className='bg-gradient-to-r from-orange-50 to-white px-8 py-10 text-center border-b border-orange-100'>
                    <div className='inline-flex p-4 rounded-2xl bg-white shadow-sm mb-4 text-[#ff4d2d]'>
                        <FaUtensils size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-gray-800 tracking-tight">Add New Dish</h1>
                    <p className='text-gray-500 mt-2 text-sm'>Enter the details of the food item below</p>
                </div>

                <form className='p-8 space-y-6' onSubmit={handleSubmit}>
                    {/* Name Input */}
                    <div>
                        <label className='block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1'>Item Name</label>
                        <input
                            type="text"
                            placeholder='e.g. Spicy Paneer Pizza'
                            className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]/20 focus:border-[#ff4d2d] transition-all'
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                            required
                        />
                    </div>

                    {/* Image Upload Area */}
                    <div>
                        <label className='block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1'>Food Image</label>
                        <div className='relative group'>
                            <input
                                type="file"
                                accept='image/*'
                                className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10'
                                onChange={handleImage}
                            />
                            <div className={`w-full h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${frontendImage ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-gray-50 group-hover:bg-gray-100'}`}>
                                {frontendImage ? (
                                    <img src={frontendImage} alt="Preview" className='w-full h-full object-cover rounded-2xl' />
                                ) : (
                                    <>
                                        <FaCloudUploadAlt className='text-gray-400 mb-2' size={30} />
                                        <span className='text-sm text-gray-500 font-medium'>Click to upload image</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Price, Category, and Type Grid */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1'>Price (₹)</label>
                            <input
                                type="number"
                                placeholder='0.00'
                                className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]/20 focus:border-[#ff4d2d]'
                                onChange={(e) => setPrice(e.target.value)}
                                value={price}
                                required
                            />
                        </div>

                        <div>
                            <label className='block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1'>Food Type</label>
                            <select
                                className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]/20 focus:border-[#ff4d2d] appearance-none'
                                onChange={(e) => setFoodType(e.target.value as "veg" | "non veg")}
                                value={foodType}
                            >
                                <option value="veg">🟢 Veg</option>
                                <option value="non veg">🔴 Non-Veg</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className='block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1'>Category</label>
                        <select
                            className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]/20 focus:border-[#ff4d2d]'
                            onChange={(e) => setCategory(e.target.value as Category)}
                            value={category}
                            required
                        >
                            <option value="">Select a category</option>
                            {CATEGORIES.map((cate) => (
                                <option value={cate} key={cate}>{cate}</option>
                            ))}
                        </select>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className='w-full bg-[#ff4d2d] text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-600 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:transform-none'
                        disabled={loading}
                    >
                        {loading ? <ClipLoader size={24} color='white' /> : "Add Item to Menu"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default AddItem;