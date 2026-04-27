import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import SignUp from './pages/auth/SignUp';
import SignIn from './pages/auth/SignIn';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from './redux/store';
import useGetCurrentUser from './hooks/useGetCurrentUser';
import ForgotPassword from './pages/auth/ForgotPassword';
import Home from './pages/dashboard/Home';
import useGetCity from './hooks/useGetCity';
import useGetItemsByCity from './hooks/useGetItemsByCity';
import useGetMyshop from './hooks/useGetMyShop';
import useGetShopByCity from './hooks/useGetShopByCity';
import useUpdateLocation from './hooks/useUpdateLocation';
import CreateEditShop from './pages/shop/CreateEditShop';
import CartPage from './pages/checkout/CartPage';
import AddItem from './pages/item/AddItem';
import EditItem from './pages/item/EditItem';
import CheckOut from './pages/checkout/CheckOut';
import Shop from './pages/shop/Shop';
import OrderPlaced from './pages/order/OrderPlaced';
import MyOrders from './pages/order/MyOrders';
import TrackOrderPage from './pages/order/TrackOrderPage';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { setSocket } from './redux/userSlice';
import LandingPage from './pages/LandingPage';

export const SERVER_URI = import.meta.env.VITE_SERVER_URI;
function App() {
  const { userData, loading } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  
  // Always fetch current user
  useGetCurrentUser()
  
  // Role-based hook loading - hooks internally check role and conditionally execute
  useGetCity(); // Only runs for 'user' role
  useGetItemsByCity(); // Only runs for 'user' role
  useGetShopByCity(); // Only runs for 'user' role
  useGetMyshop(); // Only runs for 'owner' role
  useUpdateLocation(); // Only runs for 'deliveryBoy' role
  
  // Fetch orders only when needed (lazy loaded in MyOrders page)

  useEffect(() => {
    const socketInstance = io(SERVER_URI, { withCredentials: true })
    dispatch(setSocket(socketInstance));
    
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      // Send identity immediately if userData is available
      if (userData?._id) {
        console.log('Sending identity for user:', userData._id);
        socketInstance.emit('identity', { userId: userData._id });
      }
    });

    return () => {
      socketInstance.disconnect();
    }
  }, [dispatch, userData?._id])
  
  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fff9f6]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#ff4d2d] mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path='/signup' element={!userData ? <SignUp /> : <Navigate to={"/home"} />} />
        <Route path='/signin' element={!userData ? <SignIn /> : <Navigate to={"/home"} />} />
        <Route path='/forgot-password' element={!userData ? <ForgotPassword /> : <Navigate to={"/home"} />} />
        <Route path='/home' element={userData ? <Home /> : <Navigate to={"/signin"} />} />
        <Route path='/' element={<LandingPage/>}/>
        <Route path='/create-edit-shop' element={userData ? <CreateEditShop /> : <Navigate to={"/signin"} />} />
        <Route path='/add-item' element={userData ? <AddItem /> : <Navigate to={"/signin"} />} />
        <Route path='/edit-item/:itemId' element={userData ? <EditItem /> : <Navigate to={"/signin"} />} />
        <Route path='/cart' element={userData ? <CartPage /> : <Navigate to={"/signin"} />} />
        <Route path='/checkout' element={userData ? <CheckOut /> : <Navigate to={"/signin"} />} />
        <Route path='/order-placed' element={userData ? <OrderPlaced /> : <Navigate to={"/signin"} />} />
        <Route path='/my-orders' element={userData ? <MyOrders /> : <Navigate to={"/signin"} />} />
        <Route path='/track-order/:orderId' element={userData ? <TrackOrderPage /> : <Navigate to={"/signin"} />} />
        <Route path='/shop/:shopId' element={userData ? <Shop /> : <Navigate to={"/signin"} />} />
      </Routes>
      <Toaster position="bottom-right"
        reverseOrder={false} />

    </>
  )
}

export default App
