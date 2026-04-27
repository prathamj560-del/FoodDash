import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/user.model';
import Shop from './models/shop.model';
import Item from './models/item.model';
import Order from './models/order.model';
import dbConnect from './utils/db';

dotenv.config();

const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...\n');
        
        // Connect to database
        await dbConnect();

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await User.deleteMany({});
        await Shop.deleteMany({});
        await Item.deleteMany({});
        await Order.deleteMany({});
        console.log('✅ Existing data cleared\n');

        // Hash password for all users
        const hashedPassword = await hashPassword('password123');

        // Create Users
        console.log('👥 Creating users...');
        const users = await User.create([
            {
                fullName: 'Rahul Sharma',
                email: 'rahul@example.com',
                password: hashedPassword,
                mobile: '9876543210',
                role: 'user',
                isOtpVerified: true,
                location: { type: 'Point', coordinates: [72.8777, 19.0760] } // Mumbai
            },
            {
                fullName: 'Priya Patel',
                email: 'priya@example.com',
                password: hashedPassword,
                mobile: '9876543211',
                role: 'user',
                isOtpVerified: true,
                location: { type: 'Point', coordinates: [77.2090, 28.6139] } // Delhi
            },
            {
                fullName: 'Amit Kumar',
                email: 'amit@example.com',
                password: hashedPassword,
                mobile: '9876543212',
                role: 'user',
                isOtpVerified: true,
                location: { type: 'Point', coordinates: [77.5946, 12.9716] } // Bangalore
            },
            {
                fullName: 'Sneha Reddy',
                email: 'sneha@example.com',
                password: hashedPassword,
                mobile: '9876543213',
                role: 'user',
                isOtpVerified: true,
                location: { type: 'Point', coordinates: [78.4867, 17.3850] } // Hyderabad
            },
            {
                fullName: 'Vikram Singh',
                email: 'vikram@example.com',
                password: hashedPassword,
                mobile: '9876543214',
                role: 'user',
                isOtpVerified: true,
                location: { type: 'Point', coordinates: [88.3639, 22.5726] } // Kolkata
            }
        ]);
        console.log(`✅ Created ${users.length} users\n`);

        // Create Shop Owners
        console.log('🏪 Creating shop owners...');
        const owners = await User.create([
            {
                fullName: 'Rajesh Mehta',
                email: 'rajesh.owner@example.com',
                password: hashedPassword,
                mobile: '9876543220',
                role: 'owner',
                isOtpVerified: true,
                location: { type: 'Point', coordinates: [72.8777, 19.0760] } // Mumbai
            },
            {
                fullName: 'Sunita Gupta',
                email: 'sunita.owner@example.com',
                password: hashedPassword,
                mobile: '9876543221',
                role: 'owner',
                isOtpVerified: true,
                location: { type: 'Point', coordinates: [77.2090, 28.6139] } // Delhi
            },
            {
                fullName: 'Arjun Nair',
                email: 'arjun.owner@example.com',
                password: hashedPassword,
                mobile: '9876543222',
                role: 'owner',
                isOtpVerified: true,
                location: { type: 'Point', coordinates: [77.5946, 12.9716] } // Bangalore
            },
            {
                fullName: 'Kavita Desai',
                email: 'kavita.owner@example.com',
                password: hashedPassword,
                mobile: '9876543223',
                role: 'owner',
                isOtpVerified: true,
                location: { type: 'Point', coordinates: [78.4867, 17.3850] } // Hyderabad
            },
            {
                fullName: 'Manish Joshi',
                email: 'manish.owner@example.com',
                password: hashedPassword,
                mobile: '9876543224',
                role: 'owner',
                isOtpVerified: true,
                location: { type: 'Point', coordinates: [72.8777, 19.0760] } // Mumbai
            }
        ]);
        console.log(`✅ Created ${owners.length} shop owners\n`);

        // Create Delivery Boys
        console.log('🛵 Creating delivery boys...');
        const deliveryBoys = await User.create([
            {
                fullName: 'Ravi Kumar',
                email: 'ravi.delivery@example.com',
                password: hashedPassword,
                mobile: '9876543230',
                role: 'deliveryBoy',
                isOtpVerified: true,
                isOnline: true,
                location: { type: 'Point', coordinates: [72.8777, 19.0760] } // Mumbai
            },
            {
                fullName: 'Suresh Yadav',
                email: 'suresh.delivery@example.com',
                password: hashedPassword,
                mobile: '9876543231',
                role: 'deliveryBoy',
                isOtpVerified: true,
                isOnline: true,
                location: { type: 'Point', coordinates: [77.2090, 28.6139] } // Delhi
            },
            {
                fullName: 'Deepak Verma',
                email: 'deepak.delivery@example.com',
                password: hashedPassword,
                mobile: '9876543232',
                role: 'deliveryBoy',
                isOtpVerified: true,
                isOnline: true,
                location: { type: 'Point', coordinates: [77.5946, 12.9716] } // Bangalore
            }
        ]);
        console.log(`✅ Created ${deliveryBoys.length} delivery boys\n`);

        // Create Shops
        console.log('🏬 Creating shops...');
        const shops = await Shop.create([
            {
                name: 'Pizza Paradise',
                image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500',
                owner: owners[0]._id,
                city: 'Mumbai',
                state: 'Maharashtra',
                address: '123 Marine Drive, Mumbai, Maharashtra 400020'
            },
            {
                name: 'Burger Kingdom',
                image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
                owner: owners[1]._id,
                city: 'Delhi',
                state: 'Delhi',
                address: '456 Connaught Place, New Delhi, Delhi 110001'
            },
            {
                name: 'Dosa Delight',
                image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500',
                owner: owners[2]._id,
                city: 'Bangalore',
                state: 'Karnataka',
                address: '789 MG Road, Bangalore, Karnataka 560001'
            },
            {
                name: 'Chinese Express',
                image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500',
                owner: owners[3]._id,
                city: 'Hyderabad',
                state: 'Telangana',
                address: '321 Banjara Hills, Hyderabad, Telangana 500034'
            },
            {
                name: 'Spice Garden',
                image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500',
                owner: owners[4]._id,
                city: 'Mumbai',
                state: 'Maharashtra',
                address: '654 Andheri West, Mumbai, Maharashtra 400058'
            },
            {
                name: 'Snack Shack',
                image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500',
                owner: owners[0]._id,
                city: 'Mumbai',
                state: 'Maharashtra',
                address: '987 Bandra East, Mumbai, Maharashtra 400051'
            },
            {
                name: 'Sweet Treats',
                image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500',
                owner: owners[1]._id,
                city: 'Delhi',
                state: 'Delhi',
                address: '147 Karol Bagh, New Delhi, Delhi 110005'
            }
        ]);
        console.log(`✅ Created ${shops.length} shops\n`);

        // Create Items
        console.log('🍕 Creating food items...');
        const items = await Item.create([
            // Pizza Paradise Items
            {
                name: 'Margherita Pizza',
                image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500',
                shop: shops[0]._id,
                category: 'Pizza',
                price: 299,
                foodType: 'veg',
                rating: { average: 4.5, count: 120 },
                clicks: 450,
                views: 890
            },
            {
                name: 'Pepperoni Pizza',
                image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500',
                shop: shops[0]._id,
                category: 'Pizza',
                price: 399,
                foodType: 'non veg',
                rating: { average: 4.7, count: 95 },
                clicks: 380,
                views: 720
            },
            {
                name: 'Veggie Supreme Pizza',
                image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96800?w=500',
                shop: shops[0]._id,
                category: 'Pizza',
                price: 349,
                foodType: 'veg',
                rating: { average: 4.3, count: 78 },
                clicks: 290,
                views: 560
            },

            // Burger Kingdom Items
            {
                name: 'Classic Veg Burger',
                image: 'https://images.unsplash.com/photo-1525059696034-4967a729002a?w=500',
                shop: shops[1]._id,
                category: 'Burgers',
                price: 129,
                foodType: 'veg',
                rating: { average: 4.2, count: 156 },
                clicks: 520,
                views: 980
            },
            {
                name: 'Chicken Burger',
                image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500',
                shop: shops[1]._id,
                category: 'Burgers',
                price: 179,
                foodType: 'non veg',
                rating: { average: 4.6, count: 203 },
                clicks: 670,
                views: 1240
            },
            {
                name: 'Cheese Burst Burger',
                image: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=500',
                shop: shops[1]._id,
                category: 'Burgers',
                price: 199,
                foodType: 'veg',
                rating: { average: 4.4, count: 134 },
                clicks: 410,
                views: 780
            },

            // Dosa Delight Items
            {
                name: 'Masala Dosa',
                image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=500',
                shop: shops[2]._id,
                category: 'South Indian',
                price: 89,
                foodType: 'veg',
                rating: { average: 4.8, count: 287 },
                clicks: 890,
                views: 1650
            },
            {
                name: 'Paneer Dosa',
                image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500',
                shop: shops[2]._id,
                category: 'South Indian',
                price: 119,
                foodType: 'veg',
                rating: { average: 4.5, count: 167 },
                clicks: 540,
                views: 1020
            },
            {
                name: 'Idli Sambar',
                image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500',
                shop: shops[2]._id,
                category: 'South Indian',
                price: 69,
                foodType: 'veg',
                rating: { average: 4.6, count: 234 },
                clicks: 720,
                views: 1340
            },
            {
                name: 'Vada Sambhar',
                image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500',
                shop: shops[2]._id,
                category: 'South Indian',
                price: 79,
                foodType: 'veg',
                rating: { average: 4.4, count: 198 },
                clicks: 610,
                views: 1150
            },

            // Chinese Express Items
            {
                name: 'Veg Hakka Noodles',
                image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=500',
                shop: shops[3]._id,
                category: 'Chinese',
                price: 149,
                foodType: 'veg',
                rating: { average: 4.3, count: 145 },
                clicks: 480,
                views: 910
            },
            {
                name: 'Chicken Fried Rice',
                image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500',
                shop: shops[3]._id,
                category: 'Chinese',
                price: 189,
                foodType: 'non veg',
                rating: { average: 4.5, count: 178 },
                clicks: 590,
                views: 1120
            },
            {
                name: 'Manchurian Dry',
                image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500',
                shop: shops[3]._id,
                category: 'Chinese',
                price: 169,
                foodType: 'veg',
                rating: { average: 4.4, count: 132 },
                clicks: 450,
                views: 850
            },
            {
                name: 'Chilli Chicken',
                image: 'https://images.unsplash.com/photo-1606491956437-5f9eb73a76be?w=500',
                shop: shops[3]._id,
                category: 'Chinese',
                price: 219,
                foodType: 'non veg',
                rating: { average: 4.7, count: 201 },
                clicks: 680,
                views: 1290
            },

            // Spice Garden Items
            {
                name: 'Paneer Butter Masala',
                image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500',
                shop: shops[4]._id,
                category: 'North Indian',
                price: 249,
                foodType: 'veg',
                rating: { average: 4.6, count: 189 },
                clicks: 620,
                views: 1180
            },
            {
                name: 'Butter Chicken',
                image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500',
                shop: shops[4]._id,
                category: 'North Indian',
                price: 299,
                foodType: 'non veg',
                rating: { average: 4.8, count: 267 },
                clicks: 850,
                views: 1590
            },
            {
                name: 'Dal Makhani',
                image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500',
                shop: shops[4]._id,
                category: 'North Indian',
                price: 199,
                foodType: 'veg',
                rating: { average: 4.5, count: 156 },
                clicks: 510,
                views: 970
            },
            {
                name: 'Biryani',
                image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500',
                shop: shops[4]._id,
                category: 'Main Course',
                price: 279,
                foodType: 'non veg',
                rating: { average: 4.7, count: 312 },
                clicks: 920,
                views: 1720
            },
            {
                name: 'Veg Biryani',
                image: 'https://images.unsplash.com/photo-1642821373181-696a54913e93?w=500',
                shop: shops[4]._id,
                category: 'Main Course',
                price: 229,
                foodType: 'veg',
                rating: { average: 4.4, count: 187 },
                clicks: 610,
                views: 1160
            },

            // Snack Shack Items
            {
                name: 'Samosa',
                image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500',
                shop: shops[5]._id,
                category: 'Snacks',
                price: 29,
                foodType: 'veg',
                rating: { average: 4.3, count: 234 },
                clicks: 780,
                views: 1450
            },
            {
                name: 'Pakora',
                image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500',
                shop: shops[5]._id,
                category: 'Snacks',
                price: 49,
                foodType: 'veg',
                rating: { average: 4.2, count: 198 },
                clicks: 650,
                views: 1230
            },
            {
                name: 'Pav Bhaji',
                image: 'https://images.unsplash.com/photo-1606491956437-5f9eb73a76be?w=500',
                shop: shops[5]._id,
                category: 'Fast Food',
                price: 99,
                foodType: 'veg',
                rating: { average: 4.5, count: 221 },
                clicks: 710,
                views: 1340
            },
            {
                name: 'Vada Pav',
                image: 'https://images.unsplash.com/photo-1601050690117-d26c9e0b5faf?w=500',
                shop: shops[5]._id,
                category: 'Fast Food',
                price: 39,
                foodType: 'veg',
                rating: { average: 4.4, count: 276 },
                clicks: 860,
                views: 1610
            },
            {
                name: 'Cheese Sandwich',
                image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500',
                shop: shops[5]._id,
                category: 'Sandwiches',
                price: 79,
                foodType: 'veg',
                rating: { average: 4.1, count: 143 },
                clicks: 470,
                views: 890
            },

            // Sweet Treats Items
            {
                name: 'Gulab Jamun',
                image: 'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?w=500',
                shop: shops[6]._id,
                category: 'Desserts',
                price: 69,
                foodType: 'veg',
                rating: { average: 4.6, count: 189 },
                clicks: 620,
                views: 1170
            },
            {
                name: 'Rasgulla',
                image: 'https://images.unsplash.com/photo-1606491956391-1a7b8d1a0d46?w=500',
                shop: shops[6]._id,
                category: 'Desserts',
                price: 79,
                foodType: 'veg',
                rating: { average: 4.5, count: 167 },
                clicks: 550,
                views: 1040
            },
            {
                name: 'Ice Cream Sundae',
                image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500',
                shop: shops[6]._id,
                category: 'Desserts',
                price: 129,
                foodType: 'veg',
                rating: { average: 4.4, count: 203 },
                clicks: 670,
                views: 1270
            },
            {
                name: 'Chocolate Brownie',
                image: 'https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=500',
                shop: shops[6]._id,
                category: 'Desserts',
                price: 99,
                foodType: 'veg',
                rating: { average: 4.7, count: 245 },
                clicks: 810,
                views: 1520
            }
        ]);
        console.log(`✅ Created ${items.length} food items\n`);

        // Update shops with their items
        console.log('🔗 Linking items to shops...');
        for (const shop of shops) {
            const shopItems = items.filter(item => item.shop?.toString() === shop._id.toString());
            shop.items = shopItems.map(item => item._id);
            await shop.save();
        }
        console.log('✅ Items linked to shops\n');

        console.log('✨ Database seeding completed successfully!\n');
        console.log('📊 Summary:');
        console.log(`   - Users: ${users.length}`);
        console.log(`   - Shop Owners: ${owners.length}`);
        console.log(`   - Delivery Boys: ${deliveryBoys.length}`);
        console.log(`   - Shops: ${shops.length}`);
        console.log(`   - Food Items: ${items.length}`);
        console.log('\n🔐 All users have password: password123\n');
        console.log('📧 Sample login credentials:');
        console.log('   User: rahul@example.com / password123');
        console.log('   Owner: rajesh.owner@example.com / password123');
        console.log('   Delivery: ravi.delivery@example.com / password123\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

// Run the seed function
seedDatabase();
