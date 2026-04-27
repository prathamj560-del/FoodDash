import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { SERVER_URI } from "../../App";
import { FaArrowLeft, FaStore, FaUtensils } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import FoodCard from "../../components/FoodCart";

// Import your interfaces
import type { Item, Shop as ShopType } from "../schema";

const Shop: React.FC = () => {
    // 1. Type the params - shopId will be string | undefined
    const { shopId } = useParams<{ shopId: string }>();

    // 2. State typing
    const [items, setItems] = useState<Item[]>([]);
    const [shop, setShop] = useState<ShopType | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const navigate = useNavigate();

    const handleShop = async () => {
        if (!shopId) return;

        try {
            setLoading(true);
            // 3. Type the axios response data
            const result = await axios.get<{ shop: ShopType; items: Item[] }>(
                `${SERVER_URI}/api/item/get-by-shop/${shopId}`,
                { withCredentials: true }
            );

            setShop(result.data.shop);
            setItems(result.data.items);
        } catch (err) {
            console.error("Error fetching shop details:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleShop();
    }, [shopId]);

    // Handle initial loading state
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className='min-h-screen bg-gray-50'>
            <button
                className='absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/50 hover:bg-black/70 text-white px-3 py-2 rounded-full shadow-md transition'
                onClick={() => navigate("/")}
            >
                <FaArrowLeft />
                <span>Back</span>
            </button>

            {shop && (
                <div className='relative w-full h-64 md:h-80 lg:h-96'>
                    <img src={shop.image} alt={shop.name} className='w-full h-full object-cover' />
                    <div className='absolute inset-0 bg-gradient-to-b from-black/70 to-black/30 flex flex-col justify-center items-center text-center px-4'>
                        <FaStore className='text-white text-4xl mb-3 drop-shadow-md' />
                        <h1 className='text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg'>{shop.name}</h1>
                        <div className='flex items-center gap-[10px] mt-2'>
                            <FaLocationDot size={22} className="text-red-500" />
                            <p className='text-lg font-medium text-gray-200'>{shop.address}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className='max-w-7xl mx-auto px-6 py-10'>
                <h2 className='flex items-center justify-center gap-3 text-3xl font-bold mb-10 text-gray-800'>
                    <FaUtensils className="text-red-500" />
                    Our Menu
                </h2>

                {items.length > 0 ? (
                    <div className='flex flex-wrap justify-center gap-8'>
                        {items.map((item) => (
                            <FoodCard key={item._id} data={item} />
                        ))}
                    </div>
                ) : (
                    <p className='text-center text-gray-500 text-lg'>No Items Available</p>
                )}
            </div>
        </div>
    );
};

export default Shop;