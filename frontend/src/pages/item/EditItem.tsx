import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { IoIosArrowRoundBack } from "react-icons/io";
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { FaUtensils, FaCloudUploadAlt } from "react-icons/fa";
import axios from 'axios';
import { ClipLoader } from 'react-spinners';

import { SERVER_URI } from '../../App';
import { setMyShopData } from '../../redux/ownerSlice';
import { categories } from '../../utils/categories';

// --- Interfaces ---
interface FoodItem {
    name: string;
    price: number;
    category: string;
    foodType: string;
    image: string;
}


function EditItem() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { itemId } = useParams<{ itemId: string }>();

    // --- State ---
    const [loading, setLoading] = useState<boolean>(false);
    const [fetchLoading, setFetchLoading] = useState<boolean>(true);
    const [name, setName] = useState<string>("");
    const [price, setPrice] = useState<number | string>(0);
    const [frontendImage, setFrontendImage] = useState<string>("");
    const [backendImage, setBackendImage] = useState<File | null>(null);
    const [category, setCategory] = useState<string>("");
    const [foodType, setFoodType] = useState<string>("");

    // --- Fetch Data ---
    useEffect(() => {
        const fetchItem = async () => {
            try {
                const { data } = await axios.get<FoodItem>(`${SERVER_URI}/api/item/get-by-id/${itemId}`, { withCredentials: true });
                setName(data.name);
                setPrice(data.price);
                setCategory(data.category);
                setFoodType(data.foodType);
                setFrontendImage(data.image);
            } catch (error) {
                console.error("Error fetching item:", error);
            } finally {
                setFetchLoading(false);
            }
        };
        if (itemId) fetchItem();
    }, [itemId]);

    // --- Handlers ---
    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setBackendImage(file);
            setFrontendImage(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("category", category);
            formData.append("foodType", foodType);
            formData.append("price", price.toString());
            if (backendImage) {
                formData.append("image", backendImage);
            }

            const result = await axios.post(`${SERVER_URI}/api/item/edit-item/${itemId}`, formData, { withCredentials: true });
            dispatch(setMyShopData(result.data));
            navigate("/");
        } catch (error) {
            console.error("Update error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading) {
        return (
            <div className='min-h-screen flex items-center justify-center bg-gray-50'>
                <ClipLoader color='#ff4d2d' size={40} />
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8 relative'>
            {/* Back Navigation */}
            <button
                onClick={() => navigate("/")}
                className='absolute top-6 left-6 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all text-gray-600 hover:text-[#ff4d2d]'
            >
                <IoIosArrowRoundBack size={32} />
            </button>

            <div className='max-w-xl w-full bg-white shadow-2xl rounded-[2rem] border border-orange-50 overflow-hidden'>
                {/* Header Decoration */}
                <div className='bg-gradient-to-r from-orange-50 to-white px-8 py-10 flex flex-col items-center border-b border-orange-100'>
                    <div className='bg-white p-4 rounded-2xl shadow-sm mb-4 text-[#ff4d2d]'>
                        <FaUtensils size={30} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-800">Edit Item Details</h2>
                    <p className='text-gray-400 text-sm mt-1 uppercase tracking-widest font-bold'>Update your menu item</p>
                </div>

                <form className='p-8 space-y-6' onSubmit={handleSubmit}>
                    {/* Item Name */}
                    <div>
                        <label className='text-xs font-bold text-gray-400 uppercase ml-1 mb-2 block'>Food Name</label>
                        <input
                            type="text"
                            className='w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium'
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                            placeholder="e.g. Farmhouse Pizza"
                        />
                    </div>

                    {/* Image Preview & Upload */}
                    <div>
                        <label className='text-xs font-bold text-gray-400 uppercase ml-1 mb-2 block'>Food Image</label>
                        <div className='relative group cursor-pointer'>
                            <input
                                type="file"
                                accept='image/*'
                                className='absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer'
                                onChange={handleImageChange}
                            />
                            <div className='w-full h-44 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:bg-gray-100 group-hover:border-orange-300'>
                                {frontendImage ? (
                                    <img src={frontendImage} alt="Preview" className='w-full h-full object-cover' />
                                ) : (
                                    <>
                                        <FaCloudUploadAlt size={35} className='text-gray-300' />
                                        <span className='text-sm text-gray-400 font-medium mt-2'>Click to replace image</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Price & Food Type Grid */}
                    <div className='grid grid-cols-2 gap-4'>
                        <div>
                            <label className='text-xs font-bold text-gray-400 uppercase ml-1 mb-2 block'>Price (₹)</label>
                            <input
                                type="number"
                                className='w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-bold text-orange-600'
                                onChange={(e) => setPrice(e.target.value)}
                                value={price}
                            />
                        </div>
                        <div>
                            <label className='text-xs font-bold text-gray-400 uppercase ml-1 mb-2 block'>Food Type</label>
                            <select
                                className='w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium'
                                onChange={(e) => setFoodType(e.target.value)}
                                value={foodType}
                            >
                                <option value="veg">Veg 🟢</option>
                                <option value="non veg">Non-Veg 🔴</option>
                            </select>
                        </div>
                    </div>

                    {/* Category Select */}
                    <div>
                        <label className='text-xs font-bold text-gray-400 uppercase ml-1 mb-2 block'>Select Category</label>
                        <select
                            className='w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium'
                            onChange={(e) => setCategory(e.target.value)}
                            value={category}
                        >
                            <option value="">Choose a category</option>
                            {categories.map((item, index) => (
                                <option value={item.category} key={index}>
                                    {item.category}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Action Button */}
                    <button
                        className='w-full bg-[#ff4d2d] text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-orange-200 hover:bg-orange-600 hover:-translate-y-1 transition-all active:translate-y-0 disabled:opacity-70 flex items-center justify-center'
                        disabled={loading}
                    >
                        {loading ? <ClipLoader size={24} color='white' /> : "Save Changes"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default EditItem;