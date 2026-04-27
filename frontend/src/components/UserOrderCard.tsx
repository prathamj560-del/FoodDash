import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { IOrderData } from '../pages/schema';
import { SERVER_URI } from '../App';

const UserOrderCard: React.FC<{ data: IOrderData }> = ({ data }) => {
    const navigate = useNavigate();

    // Mapping item ID to its numerical rating
    const [selectedRating, setSelectedRating] = useState<Record<string, number>>({});

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleString('en-GB', {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const handleRating = async (itemId: string, rating: number) => {
        try {
            await axios.post(
                `${SERVER_URI}/api/item/rating`,
                { itemId, rating },
                { withCredentials: true }
            );
            setSelectedRating(prev => ({
                ...prev,
                [itemId]: rating
            }));
        } catch (error) {
            console.error("Rating Error:", error);
        }
    };

    return (
        <div className='bg-white rounded-lg shadow p-4 space-y-4'>
            {/* Header Section */}
            <div className='flex justify-between border-b pb-2'>
                <div>
                    <p className='font-semibold'>
                        order #{data._id.slice(-6)}
                    </p>
                    <p className='text-sm text-gray-500'>
                        Date: {formatDate(data.createdAt)}
                    </p>
                </div>
                <div className='text-right'>
                    {data.paymentMethod === "cod" ? (
                        <p className='text-sm text-gray-500'>{data.paymentMethod.toUpperCase()}</p>
                    ) : (
                        <p className='text-sm text-gray-500 font-semibold'>
                            Payment: {data.payment ? "Paid" : "Pending"}
                        </p>
                    )}
                    <p className='font-medium text-blue-600'>
                        {data.shopOrders?.[0]?.status}
                    </p>
                </div>
            </div>

            {/* Shop Orders Section */}
            {data.shopOrders.map((shopOrder, index) => (
                <div className='border rounded-lg p-3 bg-[#fffaf7] space-y-3' key={index}>
                    <p className='font-semibold text-gray-700'>{shopOrder.shop.name}</p>

                    <div className='flex space-x-4 overflow-x-auto pb-2 custom-scrollbar'>
                        {shopOrder.shopOrderItems.map((item, idx) => (
                            <div key={idx} className='flex-shrink-0 w-40 border rounded-lg p-2 bg-white'>
                                <img
                                    src={item.item?.image}
                                    alt={item.name}
                                    className='w-full h-24 object-cover rounded'
                                />
                                <p className='text-sm font-semibold mt-1 truncate'>{item.name}</p>
                                <p className='text-xs text-gray-500'>Qty: {item.quantity} x ₹{item.price}</p>

                                {/* Star Rating Logic */}
                                {shopOrder.status === "delivered" && (
                                    <div className='flex space-x-1 mt-2'>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                className={`text-lg transition-colors ${(selectedRating[item.item._id] || 0) >= star
                                                    ? 'text-yellow-400'
                                                    : 'text-gray-300'
                                                    }`}
                                                onClick={() => handleRating(item.item._id, star)}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className='flex justify-between items-center border-t pt-2'>
                        <p className='font-semibold'>Subtotal: ₹{shopOrder.subtotal}</p>
                        <span className='text-sm font-medium text-blue-600 capitalize'>
                            {shopOrder.status}
                        </span>
                    </div>
                </div>
            ))}

            {/* Footer Section */}
            <div className='flex justify-between items-center border-t pt-2'>
                <p className='text-lg font-bold'>Total: ₹{data.totalAmount}</p>
                <button
                    className='bg-[#ff4d2d] hover:bg-[#e64526] text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors'
                    onClick={() => navigate(`/track-order/${data._id}`)}
                >
                    Track Order
                </button>
            </div>
        </div>
    );
};

export default UserOrderCard;