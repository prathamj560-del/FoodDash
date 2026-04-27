// src/types/index.ts

export type UserRole = "user" | "owner" | "deliveryBoy";

export interface User {
    _id: string;
    fullName: string;
    email: string;
    mobile: string;
    role: UserRole;
    socketId?: string;
    isOnline: boolean;
    location: {
        type: "Point";
        coordinates: [number, number]; // [longitude, latitude]
    };
}

export interface Item {
    _id: string;
    name: string;
    image: string;
    shop: string | Shop;
    category: "Snacks" | "Main Course" | "Desserts" | "Pizza" | "Burgers" | "Sandwiches" | "South Indian" | "North Indian" | "Chinese" | "Fast Food" | "Others";
    price: number;
    foodType: "veg" | "non veg";
    rating: {
        average: number;
        count: number;
    };
    clicks?: number;
    views?: number;
}

export interface Shop {
    _id: string;
    name: string;
    image: string;
    owner: string | User;
    city: string;
    state: string;
    address: string;
    items: string[] | Item[];
}

export interface DeliveryAssignment {
    _id: string;
    order: string;
    shop: string;
    shopOrderId: string;
    brodcastedTo: string[];
    assignedTo: string | null;
    status: "brodcasted" | "assigned" | "completed";
    acceptedAt?: Date;
}

export interface CartItem extends Item {
    quantity: number;
}

export interface IItemDetails {
    _id: string;
    image: string;
}

export interface IShopOrderItem {
    item: IItemDetails;
    name: string;
    price: number;
    quantity: number;
}

export interface IShopOrder {
    shop: {
        _id: string;
        name: string;
    };
    status: "pending" | "preparing" | "out of delivery" | "delivered";
    subtotal: number;
    shopOrderItems: IShopOrderItem[];
    assignedDeliveryBoy?: {
        _id: string;
        fullName: string;
        mobile: string;
        location: {
            type: "Point";
            coordinates: [number, number]; // [longitude, latitude]
        };
    } | null;
}

export interface IOrderData {
    _id: string;
    createdAt: string;
    paymentMethod: 'cod' | 'online';
    payment: boolean;
    totalAmount: number;
    shopOrders: IShopOrder[];
    deliveryAddress?: {
        text: string;
        latitude: number;
        longitude: number;
    };
}

export interface UserOrderCardProps {
    data: IOrderData;
}

export interface IDeliveryBoy {
    id?: string;
    _id?: string;
    fullName: string;
    mobile: string;
    latitude?: number;
    longitude?: number;
}

export interface IOwnerOrder {
    _id: string;
    user: {
        fullName: string;
        email: string;
        mobile: string;
    };
    paymentMethod: 'cod' | 'online';
    payment: boolean;
    deliveryAddress: {
        text: string;
        latitude: number;
        longitude: number;
    };
    shopOrders: {
        status: "pending" | "preparing" | "out of delivery" | "delivered";
        subtotal: number;
        shop: { _id: string; name: string };
        shopOrderItems: Array<{
            item: { image: string };
            name: string;
            quantity: number;
            price: number;
        }>;
        assignedDeliveryBoy?: IDeliveryBoy | null;
    };
}
