
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react';
import { FaUtensils, FaPen, FaBox, FaRupeeSign, FaClock } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import type { RootState } from '../../redux/store';
import Nav from '../../components/Nav';
import OwnerItemCard from '../../components/OwnerItemCard';
import { SERVER_URI } from '../../App';
import type { IOwnerOrder } from '../schema';

interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  pendingOrders: number;
  totalItems: number;
}

function OwnerDashboard() {
  const { myShopData } = useSelector((state:RootState) => state.owner)
  const { userData, socket } = useSelector((state: RootState) => state.user)
  const navigate = useNavigate()
  const [recentOrders, setRecentOrders] = useState<IOwnerOrder[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    todayRevenue: 0,
    todayOrders: 0,
    pendingOrders: 0,
    totalItems: 0
  })

  useEffect(() => {
    if (!socket || !userData || userData.role !== 'owner') return;

    const handleNewOrder = (data: unknown) => {
      console.log('New order received in dashboard:', data);
      const orderData = data as { 
        _id?: string;
        user?: { fullName?: string };
        shopOrders?: { owner?: { _id?: string }; subtotal?: number; deliveryFee?: number }; 
      };
      
      // Check if the order is for this owner
      if (orderData.shopOrders) {
        const shopOrder = orderData.shopOrders as { owner?: { _id?: string }; subtotal?: number; deliveryFee?: number };
        if (shopOrder.owner?._id === userData._id) {
          // Show toast notification
          const totalAmount = (shopOrder.subtotal || 0) + (shopOrder.deliveryFee || 50);
          toast.success(
            `🎉 New Order from ${orderData.user?.fullName || 'Customer'}! Total: ₹${totalAmount}`,
            { duration: 5000 }
          );
          // Refresh orders
          fetchRecentOrders();
        }
      }
    }

    socket.on('newOrder', handleNewOrder)

    return () => {
      socket.off('newOrder', handleNewOrder)
    }
  }, [socket, userData])

  const fetchRecentOrders = async () => {
    try {
      const response = await axios.get<IOwnerOrder[]>(`${SERVER_URI}/api/order/my-orders`, { 
        withCredentials: true 
      });
      setRecentOrders(response.data.slice(0, 5)); // Get latest 5 orders
      
      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let todayRevenue = 0;
      let todayOrders = 0;
      let pendingOrders = 0;
      
      response.data.forEach((order) => {
        const orderDate = new Date(order._id);
        
        if (orderDate >= today) {
          todayOrders++;
          todayRevenue += order.shopOrders.subtotal;
        }
        
        if (order.shopOrders.status === 'pending' || order.shopOrders.status === 'preparing') {
          pendingOrders++;
        }
      });
      
      setStats({
        todayRevenue,
        todayOrders,
        pendingOrders,
        totalItems: myShopData?.items?.length || 0
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    if (myShopData && userData?.role === 'owner') {
      fetchRecentOrders();
    }
  }, [myShopData, userData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'out of delivery':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className='w-full min-h-screen bg-[#fff9f6] flex flex-col items-center'>
      <Nav />
      {!myShopData &&
        <div className='flex justify-center items-center p-4 sm:p-6'>
          <div className='w-full max-w-md bg-white shadow-lg rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300'>
            <div className='flex flex-col items-center text-center'>
              <FaUtensils className='text-[#ff4d2d] w-16 h-16 sm:w-20 sm:h-20 mb-4' />
              <h2 className='text-xl sm:text-2xl font-bold text-gray-800 mb-2'>Add Your Restaurant</h2>
              <p className='text-gray-600 mb-4 text-sm sm:text-base'>Join our food delivery platform and reach thousands of hungry customers every day.
              </p>
              <button className='bg-[#ff4d2d] text-white px-5 sm:px-6 py-2 rounded-full font-medium shadow-md hover:bg-orange-600 transition-colors duration-200' onClick={() => navigate("/create-edit-shop")}>
                Get Started
              </button>
            </div>
          </div>
        </div>
      }

      {myShopData &&
        <div className='w-full flex flex-col items-center gap-6 px-4 sm:px-6 pb-8'>
          <h1 className='text-2xl sm:text-3xl text-gray-900 flex items-center gap-3 mt-8 text-center'>
            <FaUtensils className='text-[#ff4d2d] w-14 h-14' />
            Welcome to {myShopData.name}
          </h1>

          {/* Analytics Dashboard */}
          <div className='w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
            {/* Today's Revenue */}
            <div className='bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl shadow-md border border-green-100 hover:shadow-lg transition-shadow'>
              <div className='flex items-center gap-3'>
                <div className='bg-green-100 p-3 rounded-full'>
                  <FaRupeeSign className='text-green-600 text-2xl' />
                </div>
                <div>
                  <p className='text-gray-500 text-sm'>Today's Revenue</p>
                  <p className='text-2xl font-bold text-gray-800'>₹{stats.todayRevenue}</p>
                </div>
              </div>
            </div>

            {/* Today's Orders */}
            <div className='bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl shadow-md border border-blue-100 hover:shadow-lg transition-shadow'>
              <div className='flex items-center gap-3'>
                <div className='bg-blue-100 p-3 rounded-full'>
                  <FaBox className='text-blue-600 text-2xl' />
                </div>
                <div>
                  <p className='text-gray-500 text-sm'>Today's Orders</p>
                  <p className='text-2xl font-bold text-gray-800'>{stats.todayOrders}</p>
                </div>
              </div>
            </div>

            {/* Pending Orders */}
            <div className='bg-gradient-to-br from-orange-50 to-white p-6 rounded-2xl shadow-md border border-orange-100 hover:shadow-lg transition-shadow'>
              <div className='flex items-center gap-3'>
                <div className='bg-orange-100 p-3 rounded-full'>
                  <FaClock className='text-orange-600 text-2xl' />
                </div>
                <div>
                  <p className='text-gray-500 text-sm'>Pending Orders</p>
                  <p className='text-2xl font-bold text-gray-800'>{stats.pendingOrders}</p>
                </div>
              </div>
            </div>

            {/* Total Menu Items */}
            <div className='bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl shadow-md border border-purple-100 hover:shadow-lg transition-shadow'>
              <div className='flex items-center gap-3'>
                <div className='bg-purple-100 p-3 rounded-full'>
                  <FaUtensils className='text-purple-600 text-2xl' />
                </div>
                <div>
                  <p className='text-gray-500 text-sm'>Menu Items</p>
                  <p className='text-2xl font-bold text-gray-800'>{stats.totalItems}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Shop Details Card */}
          <div className='bg-white shadow-lg rounded-xl overflow-hidden border border-orange-100 hover:shadow-2xl transition-all duration-300 w-full max-w-3xl relative'>
            <div className='absolute top-4 right-4 bg-[#ff4d2d] text-white p-2 rounded-full shadow-md hover:bg-orange-600 transition-colors cursor-pointer z-10' onClick={() => navigate("/create-edit-shop")}>
              <FaPen size={20} />
            </div>
            <img src={myShopData.image} alt={myShopData.name} className='w-full h-48 sm:h-64 object-cover' />
            <div className='p-4 sm:p-6'>
              <h1 className='text-xl sm:text-2xl font-bold text-gray-800 mb-2'>{myShopData.name}</h1>
              <p className='text-gray-500 '>{myShopData.city}, {myShopData.state}</p>
              <p className='text-gray-500 mb-4'>{myShopData.address}</p>
            </div>
          </div>

          {/* Recent Orders Section */}
          {recentOrders.length > 0 && (
            <div className='w-full max-w-6xl bg-white rounded-2xl shadow-md p-6 border border-gray-100'>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-xl font-bold text-gray-800'>Recent Orders</h2>
                <button 
                  onClick={() => navigate('/my-orders')}
                  className='text-[#ff4d2d] hover:text-orange-600 font-medium text-sm'
                >
                  View All →
                </button>
              </div>
              <div className='space-y-3'>
                {recentOrders.map((order) => (
                  <div key={order._id} className='border rounded-lg p-4 hover:shadow-md transition-shadow'>
                    <div className='flex justify-between items-start mb-2'>
                      <div>
                        <p className='font-semibold text-gray-800'>{order.user.fullName}</p>
                        <p className='text-sm text-gray-500'>{order.user.mobile}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.shopOrders.status)}`}>
                        {order.shopOrders.status.charAt(0).toUpperCase() + order.shopOrders.status.slice(1)}
                      </span>
                    </div>
                    <div className='flex justify-between items-center text-sm'>
                      <span className='text-gray-600'>
                        {order.shopOrders.shopOrderItems.length} item(s)
                      </span>
                      <span className='font-bold text-green-600'>₹{order.shopOrders.subtotal}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Menu Items Section */}
          {myShopData.items.length === 0 ? (
            <div className='flex justify-center items-center p-4 sm:p-6'>
              <div className='w-full max-w-md bg-white shadow-lg rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300'>
                <div className='flex flex-col items-center text-center'>
                  <FaUtensils className='text-[#ff4d2d] w-16 h-16 sm:w-20 sm:h-20 mb-4' />
                  <h2 className='text-xl sm:text-2xl font-bold text-gray-800 mb-2'>Add Your Food Item</h2>
                  <p className='text-gray-600 mb-4 text-sm sm:text-base'>Share your delicious creations with our customers by adding them to the menu.
                  </p>
                  <button className='bg-[#ff4d2d] text-white px-5 sm:px-6 py-2 rounded-full font-medium shadow-md hover:bg-orange-600 transition-colors duration-200' onClick={() => navigate("/add-item")}>
                    Add Food
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className='w-full max-w-6xl'>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-2xl font-bold text-gray-800'>Your Menu</h2>
                <button 
                  onClick={() => navigate("/add-item")}
                  className='bg-[#ff4d2d] text-white px-4 py-2 rounded-full font-medium shadow-md hover:bg-orange-600 transition-colors duration-200'
                >
                  + Add Item
                </button>
              </div>
              <div className='flex flex-col items-center gap-4'>
                {(myShopData.items as import('../../pages/schema').Item[]).map((item, index) => (
                  <OwnerItemCard data={item} key={index} />
                ))}
              </div>
            </div>
          )}
        </div>
      }
    </div>
  )
}

export default OwnerDashboard
