import React, { useEffect, useState } from 'react';
import { IoIosArrowRoundBack } from "react-icons/io";
import { IoSearchOutline, IoLocationSharp } from "react-icons/io5";
import { TbCurrentLocation } from "react-icons/tb";
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { useDispatch, useSelector } from 'react-redux';
import "leaflet/dist/leaflet.css";
import { MdDeliveryDining } from "react-icons/md";
import { FaCreditCard } from "react-icons/fa";
import { FaMobileScreenButton } from "react-icons/fa6";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import { SERVER_URI } from '../../App';
import { setAddress, setLocation } from '../../redux/mapSlice';
import { addMyOrder, clearCart, type CartItem } from '../../redux/userSlice';
import type { RootState } from '../../redux/store';

// --- Global Types for Razorpay ---
interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

declare global {
    interface Window {
        Razorpay: new (options: {
            key: string;
            amount: number;
            currency: string;
            name: string;
            description: string;
            order_id: string;
            handler: (response: RazorpayResponse) => void;
            theme: { color: string };
        }) => { open: () => void };
    }
}

interface RecenterMapProps {
    location: { lat: number; lon: number };
}

interface PaymentCardProps {
    active: boolean;
    onClick: () => void;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    iconBg: string;
}

function RecenterMap({ location }: RecenterMapProps) {
    const map = useMap();
    if (location.lat && location.lon) {
        map.setView([location.lat, location.lon], 16, { animate: true });
    }
    return null;
}

const CheckOut: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Redux State
    const { location, address } = useSelector((state: RootState) => state.map);
    const { cartItems, totalAmount, userData } = useSelector((state: RootState) => state.user);

    // Local State
    const [addressInput, setAddressInput] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
    const [loading, setLoading] = useState<boolean>(false);

    const apiKey = import.meta.env.VITE_GEOAPIKEY;
    const deliveryFee = totalAmount > 500 ? 0 : 40;
    const finalAmount = totalAmount + deliveryFee;

    // --- Helpers ---
    const getAddressByLatLng = async (lat: number, lng: number) => {
        try {
            const result = await axios.get(
                `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&format=json&apiKey=${apiKey}`
            );
            dispatch(setAddress(result?.data?.results[0].address_line2));
        } catch (error) {
            console.error("Reverse Geocode Error:", error);
        }
    };

    const getLatLngByAddress = async () => {
        if (!addressInput) return;
        try {
            const result = await axios.get(
                `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(addressInput)}&apiKey=${apiKey}`
            );
            if (result.data.features.length > 0) {
                const { lat, lon } = result.data.features[0].properties;
                dispatch(setLocation({ lat, lon }));
            }
        } catch (error) {
            console.error("Geocode Error:", error);
        }
    };

    const getCurrentLocation = () => {
        if (!userData) return;
        const latitude = userData.location.coordinates[1];
        const longitude = userData.location.coordinates[0];
        dispatch(setLocation({ lat: latitude, lon: longitude }));
        getAddressByLatLng(latitude, longitude);
    };

    const onDragEnd = (e: L.DragEndEvent) => {
        const marker = e.target as L.Marker;
        const { lat, lng } = marker.getLatLng();
        dispatch(setLocation({ lat, lon: lng }));
        getAddressByLatLng(lat, lng);
    };

    // --- Payment & Order ---
    const openRazorpayWindow = (orderId: string, razorOrder: { id: string; amount: number }) => {
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: razorOrder.amount,
            currency: 'INR',
            name: "FoodDash",
            description: "Deliciousness delivered",
            order_id: razorOrder.id,
            handler: async function (response: RazorpayResponse) {
                try {
                    const result = await axios.post(`${SERVER_URI}/api/order/verify-payment`, {
                        razorpay_payment_id: response.razorpay_payment_id,
                        orderId
                    }, { withCredentials: true });
                    dispatch(addMyOrder(result.data));
                    dispatch(clearCart());
                    navigate("/order-placed");
                } catch (error) {
                    console.error("Payment Verification Error:", error);
                }
            },
            theme: { color: "#ff4d2d" }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    const handlePlaceOrder = async () => {
        setLoading(true);
        try {
            const result = await axios.post(`${SERVER_URI}/api/order/place-order`, {
                paymentMethod,
                deliveryAddress: {
                    text: addressInput,
                    latitude: location.lat,
                    longitude: location.lon
                },
                totalAmount: finalAmount,
                cartItems
            }, { withCredentials: true });

            if (paymentMethod === "cod") {
                dispatch(addMyOrder(result.data));
                dispatch(clearCart());
                navigate("/order-placed");
            } else {
                openRazorpayWindow(result.data.orderId, result.data.razorOrder);
            }
        } catch (error) {
            console.error("Order Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setAddressInput(address || "");
    }, [address]);

    // Early return if location not available
    if (location.lat === null || location.lon === null) {
        return (
            <div className='min-h-screen bg-[#fffcfb] p-4 md:p-8 flex items-center justify-center'>
                <div className='text-center'>
                    <p className='text-gray-600 mb-4'>Loading location...</p>
                    <button
                        onClick={getCurrentLocation}
                        className='bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors'
                    >
                        Get Current Location
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-[#fffcfb] p-4 md:p-8'>
            {/* Header */}
            <div className='max-w-6xl mx-auto flex items-center gap-4 mb-8'>
                <button
                    onClick={() => navigate("/cart")}
                    className='p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-[#ff4d2d]'
                >
                    <IoIosArrowRoundBack size={32} />
                </button>
                <h1 className='text-3xl font-black text-gray-800'>Checkout</h1>
            </div>

            <div className='max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8'>

                {/* Left Side: Delivery & Payment */}
                <div className='lg:col-span-2 space-y-6'>

                    {/* Location Section */}
                    <div className='bg-white p-6 rounded-3xl border border-gray-100 shadow-sm'>
                        <h2 className='text-xl font-bold mb-4 flex items-center gap-2'>
                            <IoLocationSharp className='text-[#ff4d2d]' /> Delivery Details
                        </h2>

                        <div className='flex gap-2 mb-4'>
                            <input
                                type="text"
                                className='flex-1 border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#ff4d2d]/20 outline-none transition-all'
                                placeholder='Confirm your delivery address...'
                                value={addressInput}
                                onChange={(e) => setAddressInput(e.target.value)}
                            />
                            <button onClick={getLatLngByAddress} className='bg-gray-800 text-white p-3 rounded-xl hover:bg-black transition-colors'>
                                <IoSearchOutline size={20} />
                            </button>
                            <button onClick={getCurrentLocation} className='bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100'>
                                <TbCurrentLocation size={20} />
                            </button>
                        </div>

                        <div className='h-72 rounded-2xl overflow-hidden border-4 border-gray-50'>
                            <MapContainer
                                className="w-full h-full"
                                center={[location.lat, location.lon]}
                                zoom={16}
                            >
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <RecenterMap location={{ lat: location.lat, lon: location.lon }} />
                                <Marker
                                    position={[location.lat, location.lon]}
                                    draggable
                                    eventHandlers={{ dragend: onDragEnd }}
                                />
                            </MapContainer>
                        </div>
                    </div>

                    {/* Payment Section */}
                    <div className='bg-white p-6 rounded-3xl border border-gray-100 shadow-sm'>
                        <h2 className='text-xl font-bold mb-4'>Payment Method</h2>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <PaymentCard
                                active={paymentMethod === "cod"}
                                onClick={() => setPaymentMethod("cod")}
                                title="Cash on Delivery"
                                subtitle="Pay at your doorstep"
                                icon={<MdDeliveryDining size={24} className='text-emerald-600' />}
                                iconBg="bg-emerald-50"
                            />
                            <PaymentCard
                                active={paymentMethod === "online"}
                                onClick={() => setPaymentMethod("online")}
                                title="Pay Online"
                                subtitle="Cards, UPI, Netbanking"
                                icon={
                                    <div className='flex gap-1'>
                                        <FaMobileScreenButton size={18} className='text-purple-600' />
                                        <FaCreditCard size={18} className='text-blue-600' />
                                    </div>
                                }
                                iconBg="bg-blue-50"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Side: Order Summary */}
                <div className='lg:col-span-1'>
                    <div className='bg-white p-6 rounded-3xl border border-gray-100 shadow-xl sticky top-8'>
                        <h2 className='text-xl font-bold mb-6'>Order Summary</h2>

                        <div className='space-y-4 mb-6 max-h-60 overflow-y-auto pr-2'>
                            {cartItems.map((item: CartItem, idx: number) => (
                                <div key={idx} className='flex justify-between items-center text-sm'>
                                    <div className='flex flex-col'>
                                        <span className='font-bold text-gray-800'>{item.name}</span>
                                        <span className='text-gray-400 text-xs'>Qty: {item.quantity}</span>
                                    </div>
                                    <span className='font-semibold'>₹{item.price * item.quantity}</span>
                                </div>
                            ))}
                        </div>

                        <div className='border-t border-dashed border-gray-200 pt-4 space-y-3'>
                            <div className='flex justify-between text-gray-500'>
                                <span>Subtotal</span>
                                <span>₹{totalAmount}</span>
                            </div>
                            <div className='flex justify-between text-gray-500'>
                                <span>Delivery Fee</span>
                                <span className={deliveryFee === 0 ? 'text-emerald-600 font-bold' : ''}>
                                    {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                                </span>
                            </div>
                            <div className='flex justify-between text-xl font-black text-gray-800 pt-2'>
                                <span>Total</span>
                                <span className='text-[#ff4d2d]'>₹{finalAmount}</span>
                            </div>
                        </div>

                        <button
                            disabled={loading || !addressInput}
                            onClick={handlePlaceOrder}
                            className='w-full mt-8 bg-[#ff4d2d] hover:bg-orange-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 transition-all active:scale-95 disabled:opacity-50'
                        >
                            {loading ? "Processing..." : paymentMethod === "cod" ? "Place Order" : "Pay & Place Order"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-component for Payment Methods
const PaymentCard: React.FC<PaymentCardProps> = ({ active, onClick, title, subtitle, icon, iconBg }) => (
    <div
        onClick={onClick}
        className={`cursor-pointer flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${active ? "border-[#ff4d2d] bg-orange-50 shadow-md" : "border-gray-100 hover:border-gray-200 bg-white"
            }`}
    >
        <div className={`h-12 w-12 flex items-center justify-center rounded-xl ${iconBg}`}>
            {icon}
        </div>
        <div>
            <p className='font-bold text-gray-800 text-sm'>{title}</p>
            <p className='text-xs text-gray-500'>{subtitle}</p>
        </div>
    </div>
);

export default CheckOut;
