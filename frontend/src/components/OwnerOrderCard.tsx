import axios from 'axios';
import React, { useState } from 'react';
import { MdPhone } from "react-icons/md";
import { useDispatch } from 'react-redux';
import { updateOrderStatus } from '../redux/userSlice';
import type { IDeliveryBoy, IOwnerOrder } from '../pages/schema';
import { SERVER_URI } from '../App';

interface OwnerOrderCardProps {
    data: IOwnerOrder;
}

const OwnerOrderCard: React.FC<OwnerOrderCardProps> = ({ data }) => {
    const [availableBoys, setAvailableBoys] = useState<IDeliveryBoy[]>([]);
    const dispatch = useDispatch();

    const handleUpdateStatus = async (orderId: string, shopId: string, status: string) => {
        if (!status) return;

        try {
            const result = await axios.post(
                `${SERVER_URI}/api/order/update-status/${orderId}/${shopId}`,
                { status },
                { withCredentials: true }
            );

            // Update Redux state
            dispatch(updateOrderStatus({ orderId, shopId, status }));

            // The backend returns availableBoys if status is "out of delivery"
            if (result.data.availableBoys) {
                setAvailableBoys(result.data.availableBoys);
            }
            console.log("Status updated:", result.data);
        } catch (error) {
            console.error("Update Status Error:", error);
        }
    };

    return (
        <div className='bg-white rounded-lg shadow p-4 space-y-4 border border-gray-100'>
            {/* Customer Info */}
            <div className='border-b pb-2'>
                <h2 className='text-lg font-bold text-gray-800'>{data.user.fullName}</h2>
                <p className='text-xs text-gray-500'>{data.user.email}</p>
                <p className='flex items-center gap-2 text-sm text-gray-600 mt-1'>
                    <MdPhone className="text-[#ff4d2d]" />
                    <span>{data.user.mobile}</span>
                </p>
                <div className='mt-1'>
                    {data.paymentMethod === "online" ? (
                        <p className='text-xs font-medium text-gray-500'>
                            Payment: <span className={data.payment ? "text-green-600" : "text-red-500"}>
                                {data.payment ? "Paid (Online)" : "Pending (Online)"}
                            </span>
                        </p>
                    ) : (
                        <p className='text-xs font-medium text-gray-500'>
                            Method: <span className='uppercase'>{data.paymentMethod}</span>
                        </p>
                    )}
                </div>
            </div>

            {/* Delivery Address */}
            <div className='flex flex-col gap-1 text-gray-600 text-sm bg-gray-50 p-2 rounded'>
                <p className='font-medium text-gray-700'>Delivery To:</p>
                <p className='leading-tight'>{data.deliveryAddress?.text}</p>
                <p className='text-[10px] text-gray-400'>
                    Coord: {data.deliveryAddress.latitude}, {data.deliveryAddress.longitude}
                </p>
            </div>

            {/* Items List */}
            <div className='flex space-x-4 overflow-x-auto pb-2 custom-scrollbar'>
                {data.shopOrders?.shopOrderItems?.map((item, index) => (
                    <div key={index} className='flex-shrink-0 w-32 border rounded-lg p-2 bg-white'>
                        <img
                            src={item.item.image}
                            alt={item.name}
                            className='w-full h-20 object-cover rounded bg-gray-100'
                        />
                        <p className='text-xs font-semibold mt-1 truncate'>{item.name}</p>
                        <p className='text-[10px] text-gray-500'>{item.quantity} x ₹{item.price}</p>
                    </div>
                ))}
            </div>

            {/* Action Section */}
            <div className='flex justify-between items-center pt-3 border-t border-gray-100'>
                <div className='text-sm'>
                    Status: <span className='font-bold capitalize text-[#ff4d2d]'>{data.shopOrders.status}</span>
                </div>

                <select
                    className='rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2 ring-orange-200 border-[#ff4d2d] text-[#ff4d2d] bg-white cursor-pointer'
                    value={data.shopOrders.status}
                    onChange={(e) => handleUpdateStatus(data._id, data.shopOrders.shop._id, e.target.value)}
                >
                    <option value="pending">Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="out of delivery">Out Of Delivery</option>
                </select>
            </div>

            {/* Delivery Boy Assignment Logic */}
            {data.shopOrders.status === "out of delivery" && (
                <div className="mt-2 p-3 border border-orange-200 rounded-lg text-sm bg-orange-50">
                    <p className='font-semibold mb-1 text-orange-800'>
                        {data.shopOrders.assignedDeliveryBoy ? "Assigned Agent:" : "Broadcast Status:"}
                    </p>

                    {availableBoys.length > 0 ? (
                        <div className='space-y-1'>
                            <p className='text-[11px] text-orange-600 mb-2 italic'>Nearby agents notified...</p>
                            {availableBoys.map((b, index) => (
                                <div key={index} className='text-gray-800 text-xs bg-white p-1 rounded border border-orange-100'>
                                    {b.fullName} • {b.mobile}
                                </div>
                            ))}
                        </div>
                    ) : data.shopOrders.assignedDeliveryBoy ? (
                        <div className='font-medium text-gray-800'>
                            {data.shopOrders.assignedDeliveryBoy.fullName} — {data.shopOrders.assignedDeliveryBoy.mobile}
                        </div>
                    ) : (
                        <div className='text-gray-500 italic animate-pulse'>Searching for nearby delivery boys...</div>
                    )}
                </div>
            )}

            <div className='text-right font-bold text-gray-900 text-base'>
                Subtotal: ₹{data.shopOrders.subtotal}
            </div>
        </div>
    );
};

export default OwnerOrderCard;