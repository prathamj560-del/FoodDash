import { useEffect, useState } from 'react';
import { FaLocationDot, FaPlus, FaTruckFast } from "react-icons/fa6";
import { IoIosSearch } from "react-icons/io";
import { FiShoppingCart } from "react-icons/fi";
import { useDispatch, useSelector } from 'react-redux';
import { RxCross2 } from "react-icons/rx";
import { TbReceipt2 } from "react-icons/tb";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

import { SERVER_URI } from '../App';
import { setSearchItems, setUserData } from '../redux/userSlice';
import type { RootState } from '../redux/store';


function Nav() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Redux State
    const { userData, currentCity, cartItems } = useSelector((state: RootState) => state.user);
    const { myShopData } = useSelector((state: RootState) => state.owner);

    // Local State
    const [showInfo, setShowInfo] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [query, setQuery] = useState("");

    const handleLogOut = async () => {
        const tid = toast.loading("Signing out...");
        try {
            await axios.get(`${SERVER_URI}/api/auth/signout`, { withCredentials: true });
            dispatch(setUserData(null));
            toast.success("Signed out successfully", { id: tid });
            navigate("/signin");
        } catch (error) {
            console.log(error)
            toast.error("Logout failed", { id: tid });
        }
    };

    const handleSearchItems = async () => {
        try {
            const { data } = await axios.get(
                `${SERVER_URI}/api/item/search-items?query=${query}&city=${currentCity}`,
                { withCredentials: true }
            );
            dispatch(setSearchItems(data));
            
            // Track search query
            if (query && currentCity) {
                axios.post(`${SERVER_URI}/api/item/track-search`, {
                    query,
                    city: currentCity
                }, { withCredentials: true }).catch(err => console.error('Track search error:', err));
            }
        } catch (error) {
            console.error("Search error:", error);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query) handleSearchItems();
            else dispatch(setSearchItems(null));
        }, 400); 

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    if (!userData) return null;

    return (
        <nav className='w-full h-[80px] flex items-center justify-between px-4 md:px-10 fixed top-0 z-[9999] bg-[#fff9f6]/95 backdrop-blur-md border-b border-orange-100'>

            <div
                className='group flex items-center gap-2 cursor-pointer transition-all duration-300 active:scale-95'
                onClick={() => navigate("/")}
            >
                {/* Animated Icon Container */}
                <div className='bg-[#ff4d2d] p-1.5 rounded-xl shadow-lg shadow-orange-200 group-hover:rotate-12 transition-transform duration-300'>
                    <FaTruckFast size={20} className="text-white" />
                </div>

                {/* Brand Name with Gradient */}
                <h1 className='text-3xl font-black tracking-tighter bg-gradient-to-r from-[#ff4d2d] to-[#ff7b5f] bg-clip-text text-transparent'>
                    FoodDash
                </h1>
            </div>

            {/* Desktop Search Bar (Users Only) */}
            {userData.role === "user" && (
                <div className='hidden md:flex items-center flex-1 max-w-xl h-[50px] bg-white shadow-sm border border-gray-200 rounded-2xl mx-10 overflow-hidden focus-within:border-[#ff4d2d] transition-all'>
                    <div className='flex items-center px-4 border-r border-gray-100 min-w-[140px]'>
                        <FaLocationDot className='text-[#ff4d2d] mr-2' />
                        <span className='text-sm font-medium text-gray-600 truncate max-w-[80px]'>{currentCity || "Select Location"}</span>
                    </div>
                    <div className='flex items-center flex-1 px-4 gap-2'>
                        <IoIosSearch size={22} className='text-gray-400' />
                        <input
                            type="text"
                            placeholder='Search for food, shops...'
                            className='w-full outline-none text-sm text-gray-700'
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className='flex items-center gap-3 sm:gap-6'>

                {/* Mobile Search Trigger */}
                {userData.role === "user" && (
                    <button
                        className='md:hidden p-2 text-gray-600'
                        onClick={() => setShowSearch(!showSearch)}
                    >
                        {showSearch ? <RxCross2 size={24} /> : <IoIosSearch size={24} />}
                    </button>
                )}

                {/* Role Specific Actions */}
                {userData.role === "owner" ? (
                    <div className='flex items-center gap-3'>
                        {myShopData && (
                            <button
                                onClick={() => navigate("/add-item")}
                                className='flex items-center gap-2 bg-[#ff4d2d] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-orange-200 hover:scale-105 transition-transform'
                            >
                                <FaPlus /> <span className='hidden sm:inline'>Add Item</span>
                            </button>
                        )}
                        <button
                            onClick={() => navigate("/my-orders")}
                            className='p-2 bg-gray-100 rounded-xl text-gray-700 hover:bg-gray-200'
                            title="My Orders"
                        >
                            <TbReceipt2 size={24} />
                        </button>
                    </div>
                ) : userData.role === "user" ? (
                    <div className='flex items-center gap-5'>
                        <button
                            className='relative p-2 text-gray-700 hover:text-[#ff4d2d] transition-colors'
                            onClick={() => navigate("/cart")}
                        >
                            <FiShoppingCart size={24} />
                            {cartItems.length > 0 && (
                                <span className='absolute -top-1 -right-1 bg-[#ff4d2d] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#fff9f6]'>
                                    {cartItems.length}
                                </span>
                            )}
                        </button>
                        <button
                            className='hidden lg:block text-sm font-bold text-gray-600 hover:text-[#ff4d2d]'
                            onClick={() => navigate("/my-orders")}
                        >
                            Orders
                        </button>
                    </div>
                ) : null}

                {/* Profile Menu */}
                <div className='relative'>
                    <button
                        className='flex items-center gap-2 p-1 rounded-full border border-transparent hover:border-orange-200 transition-all'
                        onClick={() => setShowInfo(!showInfo)}
                    >
                        <div className='w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-[#ff4d2d] font-bold border-2 border-white shadow-sm'>
                            {userData.fullName.charAt(0).toUpperCase()}
                        </div>
                    </button>

                    {showInfo && (
                        <>
                            <div className='fixed inset-0 z-[-1]' onClick={() => setShowInfo(false)}></div>
                            <div className='absolute right-0 mt-3 w-56 bg-white shadow-2xl rounded-2xl p-4 border border-gray-100 animate-in fade-in zoom-in-95 duration-200'>
                                <div className='mb-3 pb-3 border-b border-gray-50'>
                                    <p className='text-xs text-gray-400 font-semibold uppercase tracking-wider'>Account</p>
                                    <p className='text-sm font-bold text-gray-800 truncate'>{userData.fullName}</p>
                                    <p className='text-[10px] text-orange-500 font-bold bg-orange-50 inline-block px-2 py-0.5 rounded-full mt-1 uppercase'>
                                        {userData.role}
                                    </p>
                                </div>
                                <div className='flex flex-col gap-1'>
                                    {userData.role === "user" && (
                                        <button
                                            className='flex items-center gap-2 text-sm text-gray-600 p-2 hover:bg-gray-50 rounded-lg text-left'
                                            onClick={() => { navigate("/my-orders"); setShowInfo(false); }}
                                        >
                                            <TbReceipt2 className='text-gray-400' /> My Orders
                                        </button>
                                    )}
                                    <button
                                        className='flex items-center gap-2 text-sm text-red-500 font-semibold p-2 hover:bg-red-50 rounded-lg text-left'
                                        onClick={handleLogOut}
                                    >
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Mobile Search Overlay */}
            {showSearch && userData.role === "user" && (
                <div className='absolute top-[80px] left-0 w-full bg-white p-4 shadow-xl md:hidden animate-in slide-in-from-top duration-300'>
                    <div className='flex items-center bg-gray-100 rounded-xl px-4 py-2 gap-3'>
                        <IoIosSearch className='text-gray-400' />
                        <input
                            type="text"
                            autoFocus
                            placeholder='Search delicious food...'
                            className='flex-1 bg-transparent outline-none text-sm py-1'
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                </div>
            )}
        </nav>
    );
}

export default Nav;
