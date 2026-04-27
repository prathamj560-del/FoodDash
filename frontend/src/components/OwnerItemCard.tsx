import axios, { AxiosError } from 'axios';
import { FaPen, FaTrashAlt } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';

import { SERVER_URI } from '../App';
import { setMyShopData } from '../redux/ownerSlice';
import type { Item } from '../pages/schema';

interface OwnerItemCardProps {
    data: Item;
}

function OwnerItemCard({ data }: OwnerItemCardProps) {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleDelete = async () => {
        // Simple confirmation
        if (!window.confirm(`Are you sure you want to delete "${data.name}"?`)) return;

        const tid = toast.loading("Deleting item...");
        try {
            // Recommendation: Use axios.delete for deletion routes if your API supports it
            const { data: updatedShopData } = await axios.get(
                `${SERVER_URI}/api/item/delete/${data._id}`,
                { withCredentials: true }
            );

            dispatch(setMyShopData(updatedShopData));
            toast.success("Item deleted successfully", { id: tid });
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            toast.error(err.response?.data?.message || "Failed to delete item", { id: tid });
        }
    };

    return (
        <div className='group flex bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden w-full max-w-2xl'>
            {/* Image Section */}
            <div className='w-32 sm:w-40 h-auto flex-shrink-0 relative overflow-hidden bg-gray-50'>
                <img
                    src={data.image}
                    alt={data.name}
                    className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
                />
                <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-white ${data.foodType === 'veg' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {data.foodType}
                </div>
            </div>

            {/* Content Section */}
            <div className='flex flex-col justify-between p-4 flex-1'>
                <div className='space-y-1'>
                    <div className='flex justify-between items-start'>
                        <h2 className='text-lg font-bold text-gray-800 leading-tight'>{data.name}</h2>
                        <div className='text-[#ff4d2d] font-black text-lg'>₹{data.price}</div>
                    </div>

                    <div className='flex flex-wrap gap-2 mt-1'>
                        <span className='px-2 py-1 bg-gray-100 text-gray-600 text-[11px] font-semibold rounded-md uppercase'>
                            {data.category}
                        </span>
                        <span className='px-2 py-1 bg-orange-50 text-[#ff4d2d] text-[11px] font-semibold rounded-md'>
                            ★ {data.rating?.average || 0} ({data.rating?.count || 0})
                        </span>
                    </div>
                </div>

                {/* Actions Section */}
                <div className='flex items-center justify-end gap-3 mt-4 pt-3 border-t border-gray-50'>
                    <button
                        className='flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl text-gray-600 hover:bg-gray-100 transition-colors'
                        onClick={() => navigate(`/edit-item/${data._id}`)}
                    >
                        <FaPen size={14} className='text-[#ff4d2d]' />
                        <span>Edit</span>
                    </button>

                    <button
                        className='flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl text-red-500 hover:bg-red-50 transition-colors'
                        onClick={handleDelete}
                    >
                        <FaTrashAlt size={14} />
                        <span>Delete</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default OwnerItemCard;
