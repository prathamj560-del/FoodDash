
import { FaMinus, FaPlus } from "react-icons/fa";
import { HiOutlineTrash } from "react-icons/hi2"; // Switched to a slightly bolder trash icon
import { useDispatch } from 'react-redux';
import { removeCartItem, updateQuantity } from '../redux/userSlice';
import toast from 'react-hot-toast';
import type { CartItem } from "../pages/schema";

// 1. Define the Props Interface based on your CartItem interface
interface CartItemCardProps {
    data: CartItem
}


function CartItemCard({ data }: CartItemCardProps) {
    const dispatch = useDispatch();

    const handleIncrease = () => {
        dispatch(updateQuantity({ _id: data._id, quantity: data.quantity + 1 }));
    };

    const handleDecrease = () => {
        if (data.quantity > 1) {
            dispatch(updateQuantity({ _id: data._id, quantity: data.quantity - 1 }));
        } else {
            handleRemove();
        }
    };

    const handleRemove = () => {
        dispatch(removeCartItem(data._id));
        toast.error(`${data.name} removed from cart`);
    };

    return (
        <div className='flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-orange-200 transition-all duration-300 group'>
            <div className='flex items-center gap-4'>
                {/* Image Section */}
                <div className='relative overflow-hidden rounded-xl border border-gray-100'>
                    <img
                        src={data.image}
                        alt={data.name}
                        className='w-20 h-20 object-cover group-hover:scale-110 transition-transform duration-500'
                    />
                </div>

                {/* Details Section */}
                <div className='flex flex-col gap-0.5'>
                    <h3 className='font-bold text-gray-800 leading-tight'>{data.name}</h3>
                    <p className='text-xs font-medium text-gray-400'>
                        ₹{data.price.toLocaleString()} per unit
                    </p>
                    <div className='flex items-center gap-2 mt-1'>
                        <span className='text-sm font-black text-[#ff4d2d]'>
                            ₹{(data.price * data.quantity).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions Section */}
            <div className='flex items-center gap-4'>
                {/* Quantity Controls */}
                <div className='flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100'>
                    <button
                        className='p-2 cursor-pointer text-gray-500 hover:text-[#ff4d2d] hover:bg-white rounded-lg transition-all'
                        onClick={handleDecrease}
                    >
                        <FaMinus size={10} />
                    </button>

                    <span className='w-8 text-center font-bold text-gray-800 text-sm'>
                        {data.quantity}
                    </span>

                    <button
                        className='p-2 cursor-pointer text-gray-500 hover:text-[#ff4d2d] hover:bg-white rounded-lg transition-all'
                        onClick={handleIncrease}
                    >
                        <FaPlus size={10} />
                    </button>
                </div>

                {/* Remove Button */}
                <button
                    className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-300 shadow-sm"
                    onClick={handleRemove}
                    title="Remove item"
                >
                    <HiOutlineTrash size={20} />
                </button>
            </div>
        </div>
    );
}

export default CartItemCard;