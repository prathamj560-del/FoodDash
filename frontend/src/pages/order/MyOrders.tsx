import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { RootState } from '../../redux/store';
import { updateRealtimeOrderStatus } from '../../redux/userSlice';
import UserOrderCard from '../../components/UserOrderCard';
import OwnerOrderCard from '../../components/OwnerOrderCard';
import useGetMyOrders from '../../hooks/useGetMyOrders';
import type { IOrderData, IOwnerOrder } from '../schema';

// Socket Payload Types
interface UpdateStatusPayload {
    orderId: string;
    shopId: string;
    status: string;
    userId: string;
}

function MyOrders() {
    const { userData, myOrders, socket } = useSelector((state: RootState) => state.user)
    const navigate = useNavigate()
    const dispatch = useDispatch()
    
    // Lazy load orders - only fetch when this page is visited
    useGetMyOrders()
    
    useEffect(() => {
        if (!socket || !userData) return;

        const handleNewOrder = (data: unknown) => {
            console.log('New order received:', data);
            const orderData = data as {
                _id?: string;
                user?: { fullName?: string };
                shopOrders?: { owner?: { _id?: string }; subtotal?: number };
            };

            // For owners: Check if the order is for this owner
            if (userData.role === 'owner' && orderData.shopOrders) {
                const shopOrder = orderData.shopOrders as { owner?: { _id?: string }; subtotal?: number };
                if (shopOrder.owner?._id === userData._id) {
                    console.log('New order for this owner, reloading orders...');

                    // Show toast notification
                    toast.success(
                        `🎉 New Order from ${orderData.user?.fullName || 'Customer'}! Amount: ₹${shopOrder.subtotal || 0}`,
                        { duration: 5000 }
                    );

                    // Refetch orders to get fresh data
                    setTimeout(() => window.location.reload(), 2000);
                }
            }
        }

        const handleUpdateStatus = (...args: unknown[]) => {
            const payload = args[0] as UpdateStatusPayload;
            console.log('Update status received:', payload);
            if (payload.userId === userData._id) {
                dispatch(updateRealtimeOrderStatus({
                    orderId: payload.orderId,
                    shopId: payload.shopId,
                    status: payload.status
                }))
            }
        }

        socket.on('newOrder', handleNewOrder)
        socket.on('update-status', handleUpdateStatus)

        return () => {
            socket.off('newOrder', handleNewOrder)
            socket.off('update-status', handleUpdateStatus)
        }
    }, [socket, userData, dispatch])





    // If no user data is loaded yet, you might want a loading state or redirect
    if (!userData) return null;

    return (
        <div className='w-full min-h-screen bg-[#fff9f6] flex justify-center px-4'>
            <div className='w-full max-w-[800px] p-4'>

                {/* Header Section */}
                <div className='flex items-center gap-[20px] mb-6'>
                    <div
                        className='z-[10] cursor-pointer hover:bg-orange-100 rounded-full p-1 transition-colors'
                        onClick={() => navigate("/")}
                    >
                        <IoIosArrowRoundBack size={35} className='text-[#ff4d2d]' />
                    </div>
                    <h1 className='text-2xl font-bold text-start text-gray-800'>My Orders</h1>
                </div>

                {/* Orders List */}
                <div className='space-y-6'>
                    {myOrders && myOrders.length > 0 ? (
                        myOrders.map((order, index) => {
                            if (userData.role === "user") {
                                return <UserOrderCard data={order as unknown as IOrderData} key={order._id || index} />;
                            }
                            if (userData.role === "owner") {
                                return <OwnerOrderCard data={order as unknown as IOwnerOrder} key={order._id || index} />;
                            }
                            return null;
                        })
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            <p>No orders found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyOrders;
