import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Item, Shop, User } from "../pages/schema";

export interface CartItem extends Item {
    quantity: number;
}

interface ShopOrder {
    shop: {
        _id: string;
        [key: string]: unknown;
    };
    status: string;
    [key: string]: unknown;
}

interface Order {
    _id: string;
    shopOrders: ShopOrder[] | ShopOrder;
    [key: string]: unknown;
}

interface SocketType {
    emit: (event: string, ...args: unknown[]) => void;
    on: (event: string, callback: (...args: unknown[]) => void) => void;
    off: (event: string, callback?: (...args: unknown[]) => void) => void;
    id?: string;
    connected?: boolean;
    disconnect?: () => void;
}

interface UserSliceState {
    userData: User | null;
    loading: boolean;
    currentCity: string | null;
    currentState: string | null;
    currentAddress: string | null;
    shopInMyCity: Shop[] | null;
    itemsInMyCity: Item[] | null;
    cartItems: CartItem[];
    totalAmount: number;
    myOrders: Order[];
    searchItems: Item[] | null;
    socket: SocketType | null;
}

// Load cart from localStorage on initialization
const loadCartFromStorage = (): { cartItems: CartItem[]; totalAmount: number } => {
    try {
        const savedCart = localStorage.getItem('cartItems');
        const savedTotal = localStorage.getItem('totalAmount');
        if (savedCart) {
            return {
                cartItems: JSON.parse(savedCart),
                totalAmount: savedTotal ? parseFloat(savedTotal) : 0
            };
        }
    } catch (error) {
        console.error('Error loading cart from localStorage:', error);
    }
    return { cartItems: [], totalAmount: 0 };
};

const { cartItems: initialCartItems, totalAmount: initialTotalAmount } = loadCartFromStorage();

const initialState: UserSliceState = {
    userData: null,
    loading: true,
    currentCity: null,
    currentState: null,
    currentAddress: null,
    shopInMyCity: null,
    itemsInMyCity: null,
    cartItems: initialCartItems,
    totalAmount: initialTotalAmount,
    myOrders: [],
    searchItems: null,
    socket: null
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUserData: (state, action: PayloadAction<User | null>) => {
            state.userData = action.payload
            state.loading = false
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload
        },
        setCurrentCity: (state, action: PayloadAction<string | null>) => {
            state.currentCity = action.payload
        },
        setCurrentState: (state, action: PayloadAction<string | null>) => {
            state.currentState = action.payload
        },
        setCurrentAddress: (state, action: PayloadAction<string | null>) => {
            state.currentAddress = action.payload
        },
        setShopsInMyCity: (state, action: PayloadAction<Shop[] | null>) => {
            state.shopInMyCity = action.payload
        },
        setItemsInMyCity: (state, action: PayloadAction<Item[] | null>) => {
            state.itemsInMyCity = action.payload
        },
        setSocket: (state, action: PayloadAction<SocketType | null>) => {
            state.socket = action.payload
        },
        addToCart: (state, action: PayloadAction<CartItem>) => {
            const cartItem = action.payload
            const existingItem = state.cartItems.find(i => i._id == cartItem._id)
            if (existingItem) {
                existingItem.quantity += cartItem.quantity
            } else {
                state.cartItems.push(cartItem)
            }

            state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
            
            // Save to localStorage
            localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
            localStorage.setItem('totalAmount', state.totalAmount.toString());
        },

        setTotalAmount: (state, action: PayloadAction<number>) => {
            state.totalAmount = action.payload
            localStorage.setItem('totalAmount', state.totalAmount.toString());
        },

        updateQuantity: (state, action: PayloadAction<{ _id: string | number; quantity: number }>) => {
            const { _id, quantity } = action.payload
            const item = state.cartItems.find(i => i._id == _id)
            if (item) {
                item.quantity = quantity
            }
            state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
            
            // Save to localStorage
            localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
            localStorage.setItem('totalAmount', state.totalAmount.toString());
        },

        removeCartItem: (state, action: PayloadAction<string | number>) => {
            state.cartItems = state.cartItems.filter(i => i._id !== action.payload)
            state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
            
            // Save to localStorage
            localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
            localStorage.setItem('totalAmount', state.totalAmount.toString());
        },

        clearCart: (state) => {
            state.cartItems = [];
            state.totalAmount = 0;
            
            // Clear from localStorage
            localStorage.removeItem('cartItems');
            localStorage.removeItem('totalAmount');
        },

        setMyOrders: (state, action: PayloadAction<Order[]>) => {
            state.myOrders = action.payload
        },
        addMyOrder: (state, action: PayloadAction<Order>) => {
            state.myOrders = [action.payload, ...state.myOrders]
        },

        updateOrderStatus: (state, action: PayloadAction<{ orderId: string; shopId: string; status: string }>) => {
            const { orderId, shopId, status } = action.payload
            const order = state.myOrders.find(o => String(o._id) === String(orderId))
            if (order) {
                // Handle both array and single object cases
                if (Array.isArray(order.shopOrders)) {
                    const shopOrder = order.shopOrders.find((so: ShopOrder) => String(so.shop._id) === String(shopId))
                    if (shopOrder) {
                        shopOrder.status = status
                    }
                } else {
                    // Single shopOrder object (owner orders)
                    if (String(order.shopOrders.shop._id) === String(shopId)) {
                        order.shopOrders.status = status
                    }
                }
            }
        },

        updateRealtimeOrderStatus: (state, action: PayloadAction<{ orderId: string; shopId: string; status: string }>) => {
            const { orderId, shopId, status } = action.payload
            console.log('Redux: Updating order status', { orderId, shopId, status });
            const order = state.myOrders.find(o => String(o._id) === String(orderId))
            if (order) {
                console.log('Redux: Order found', order);
                // Handle both array and single object cases
                if (Array.isArray(order.shopOrders)) {
                    const shopOrder = order.shopOrders.find((so: ShopOrder) => String(so.shop._id) === String(shopId))
                    if (shopOrder) {
                        console.log('Redux: Shop order found, updating status from', shopOrder.status, 'to', status);
                        shopOrder.status = status
                    } else {
                        console.log('Redux: Shop order not found for shopId', shopId);
                    }
                } else {
                    // Single shopOrder object (owner orders)
                    if (String(order.shopOrders.shop._id) === String(shopId)) {
                        console.log('Redux: Single shop order found, updating status from', order.shopOrders.status, 'to', status);
                        order.shopOrders.status = status
                    } else {
                        console.log('Redux: Single shop order does not match shopId', shopId);
                    }
                }
            } else {
                console.log('Redux: Order not found for orderId', orderId);
            }
        },

        setSearchItems: (state, action: PayloadAction<Item[] | null>) => {
            state.searchItems = action.payload
        }
    }
})

export const { setUserData, setLoading, setCurrentAddress, setCurrentCity, setCurrentState, setShopsInMyCity, setItemsInMyCity, addToCart, updateQuantity, removeCartItem, clearCart, setMyOrders, addMyOrder, updateOrderStatus, setSearchItems, setTotalAmount, setSocket, updateRealtimeOrderStatus } = userSlice.actions
export default userSlice.reducer
