import React, { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { IoIosArrowRoundBack } from "react-icons/io";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaUtensils } from "react-icons/fa";
import axios from 'axios';
import { ClipLoader } from 'react-spinners';

// Import your root types
import type { RootState, AppDispatch } from "../../redux/store";
import { SERVER_URI } from "../../App";
import { setMyShopData } from "../../redux/ownerSlice";

const CreateEditShop: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    // Redux State Selectors
    const { myShopData } = useSelector((state: RootState) => state.owner);
    const { currentCity, currentState, currentAddress } = useSelector((state: RootState) => state.user);

    // Form State
    const [name, setName] = useState<string>(myShopData?.name || "");
    const [address, setAddress] = useState<string>(myShopData?.address || currentAddress || "");
    const [city, setCity] = useState<string>(myShopData?.city || currentCity || "");
    const [state, setState] = useState<string>(myShopData?.state || currentState || "");

    // Image State
    const [frontendImage, setFrontendImage] = useState<string | null>(myShopData?.image || null);
    const [backendImage, setBackendImage] = useState<File | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // Memory Leak Cleanup for ObjectURLs
    useEffect(() => {
        return () => {
            if (frontendImage && !frontendImage.startsWith('http')) {
                URL.revokeObjectURL(frontendImage);
            }
        };
    }, [frontendImage]);

    const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setBackendImage(file);
            const previewUrl = URL.createObjectURL(file);
            setFrontendImage(previewUrl);
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("city", city);
            formData.append("state", state);
            formData.append("address", address);

            if (backendImage) {
                formData.append("image", backendImage);
            }

            const result = await axios.post(`${SERVER_URI}/api/shop/create-edit`, formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            dispatch(setMyShopData(result.data));
            navigate("/");
        } catch (error) {
            console.error("Error saving shop:", error);
            // Consider adding a toast error here
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='flex justify-center flex-col items-center p-6 bg-gradient-to-br from-orange-50 relative to-white min-h-screen'>
            {/* Back Button */}
            <div
                className='absolute top-[20px] left-[20px] z-[10] cursor-pointer'
                onClick={() => navigate("/")}
            >
                <IoIosArrowRoundBack size={35} className='text-[#ff4d2d] hover:scale-110 transition-transform' />
            </div>

            <div className='max-w-lg w-full bg-white shadow-xl rounded-2xl p-8 border border-orange-100'>
                <div className='flex flex-col items-center mb-6'>
                    <div className='bg-orange-100 p-4 rounded-full mb-4'>
                        <FaUtensils className='text-[#ff4d2d] w-12 h-12' />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900">
                        {myShopData ? "Edit Shop" : "Add Shop"}
                    </h1>
                </div>

                <form className='space-y-5' onSubmit={handleSubmit}>
                    {/* Shop Name */}
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Shop Name</label>
                        <input
                            required
                            type="text"
                            placeholder='Enter Shop Name'
                            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500'
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Shop Image</label>
                        <input
                            type="file"
                            accept='image/*'
                            className='w-full px-4 py-2 border rounded-lg file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100'
                            onChange={handleImage}
                        />
                        {frontendImage && (
                            <div className='mt-4 overflow-hidden rounded-lg shadow-inner'>
                                <img src={frontendImage} alt="Shop preview" className='w-full h-48 object-cover' />
                            </div>
                        )}
                    </div>

                    {/* City & State Grid */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>City</label>
                            <input
                                required
                                type="text"
                                placeholder='City'
                                className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500'
                                onChange={(e) => setCity(e.target.value)}
                                value={city}
                            />
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>State</label>
                            <input
                                required
                                type="text"
                                placeholder='State'
                                className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500'
                                onChange={(e) => setState(e.target.value)}
                                value={state}
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Address</label>
                        <input
                            required
                            type="text"
                            placeholder='Enter Shop Address'
                            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500'
                            onChange={(e) => setAddress(e.target.value)}
                            value={address}
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className='w-full bg-[#ff4d2d] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-orange-600 hover:shadow-lg transition-all duration-200 cursor-pointer disabled:bg-gray-400'
                        disabled={loading}
                    >
                        {loading ? <ClipLoader size={20} color='white' /> : "Save Shop Details"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateEditShop;