import { FaLeaf, FaDrumstickBite, FaStar, FaRegStar, FaMinus, FaPlus } from "react-icons/fa";
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import axios from 'axios';

import { SERVER_URI } from '../App';
import { addToCart, updateQuantity, removeCartItem } from '../redux/userSlice';
import type { RootState } from '../redux/store';
import type { Item } from '../pages/schema';
interface FoodCardProps {
    data: Item;
}

function FoodCard({ data }: FoodCardProps) {
    const dispatch = useDispatch();

    // 1. Get the quantity directly from Redux. No local useState needed!
    const cartItem = useSelector((state: RootState) =>
        state.user.cartItems.find(i => i._id === data._id)
    );

    const quantity = cartItem?.quantity || 0;

    // Track item click
    const trackClick = async () => {
        try {
            await axios.post(`${SERVER_URI}/api/item/track-click`, {
                itemId: data._id
            }, { withCredentials: true });
        } catch (error) {
            console.error('Error tracking click:', error);
        }
    };

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            i < rating
                ? <FaStar key={i} size={14} className='text-orange-400' />
                : <FaRegStar key={i} size={14} className='text-gray-300' />
        ));
    };

    // 2. Actions now dispatch directly to Redux
    const handleAddToCart = () => {
        trackClick(); // Track click when adding to cart
        dispatch(addToCart({
            ...data,
            quantity: 1,
        }));
        toast.success(`${data.name} added!`);
    };

    const handleUpdateQuantity = (newQty: number) => {
        if (newQty <= 0) {
            dispatch(removeCartItem(data._id));
            toast.error("Removed from cart");
        } else {
            dispatch(updateQuantity({ _id: data._id, quantity: newQty }));
        }
    };

    return (
        <div className='group w-full max-w-[280px] bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 overflow-hidden flex flex-col'>
            <div className='relative w-full h-[180px] overflow-hidden'>
                <div className='absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm p-1.5 rounded-xl shadow-sm border border-gray-100'>
                    {data.foodType === "veg" ? (
                        <FaLeaf className='text-green-600' size={16} />
                    ) : (
                        <FaDrumstickBite className='text-red-600' size={16} />
                    )}
                </div>
                <img src={data.image} alt={data.name} className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-700' />
            </div>

            <div className='p-4 flex flex-col flex-1'>
                <h3 className='font-bold text-gray-800 text-lg leading-tight truncate'>{data.name}</h3>
                <div className='flex items-center gap-1.5 mb-4'>
                    <div className='flex items-center'>{renderStars(data.rating?.average || 0)}</div>
                    <span className='text-[10px] font-bold text-gray-400'>({data.rating?.count || 0})</span>
                </div>

                <div className='mt-auto flex items-center justify-between gap-2 pt-2 border-t border-gray-50'>
                    <div className='flex flex-col'>
                        <span className='text-[10px] text-gray-400 font-bold uppercase tracking-wider'>Price</span>
                        <span className='font-black text-xl text-gray-900'>₹{data.price}</span>
                    </div>

                    {quantity === 0 ? (
                        <button
                            onClick={handleAddToCart}
                            className='bg-[#ff4d2d] hover:bg-[#e64528] text-white px-6 py-2 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95'
                        >
                            ADD
                        </button>
                    ) : (
                        <div className='flex items-center bg-gray-900 text-white rounded-xl overflow-hidden shadow-lg'>
                            <button className='p-2.5 hover:bg-gray-800' onClick={() => handleUpdateQuantity(quantity - 1)}>
                                <FaMinus size={10} />
                            </button>
                            <span className='w-6 text-center font-bold text-sm'>{quantity}</span>
                            <button className='p-2.5 hover:bg-gray-800' onClick={() => handleUpdateQuantity(quantity + 1)}>
                                <FaPlus size={10} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FoodCard;
