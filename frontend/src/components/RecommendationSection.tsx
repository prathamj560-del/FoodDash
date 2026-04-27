import { useEffect, useState } from 'react';
import axios from 'axios';
import { SERVER_URI } from '../App';
import FoodCard from './FoodCart';
import type { Item } from '../pages/schema';

interface RecommendationsData {
    basedOnOrders: Item[];
    trending: Item[];
    popular: Item[];
    basedOnClicks: Item[];
}

interface RecommendationSectionProps {
    city: string;
}

function RecommendationSection({ city }: RecommendationSectionProps) {
    const [recommendations, setRecommendations] = useState<RecommendationsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (!city) return;
            
            try {
                setLoading(true);
                const { data } = await axios.get(
                    `${SERVER_URI}/api/item/recommendations?city=${city}`,
                    { withCredentials: true }
                );
                setRecommendations(data);
            } catch (error) {
                console.error('Error fetching recommendations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [city]);

    if (loading) {
        return (
            <div className='w-full flex justify-center py-10'>
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#ff4d2d]"></div>
            </div>
        );
    }

    if (!recommendations) return null;

    const sections = [
        { title: 'Based on Your Orders', items: recommendations.basedOnOrders, emoji: '🍽️' },
        { title: 'Trending Now', items: recommendations.trending, emoji: '🔥' },
        { title: `Popular in ${city}`, items: recommendations.popular, emoji: '⭐' },
        { title: 'You Viewed Recently', items: recommendations.basedOnClicks, emoji: '👀' }
    ];

    return (
        <div className='w-full flex flex-col gap-8'>
            {sections.map((section, index) => (
                section.items.length > 0 && (
                    <div key={index} className='w-full flex flex-col gap-5'>
                        <h2 className='text-gray-800 text-2xl sm:text-3xl font-semibold flex items-center gap-2'>
                            <span>{section.emoji}</span>
                            {section.title}
                        </h2>
                        <div className='w-full h-auto flex flex-wrap gap-[20px] justify-center'>
                            {section.items.map((item: Item) => (
                                <FoodCard key={item._id} data={item} />
                            ))}
                        </div>
                    </div>
                )
            ))}
        </div>
    );
}

export default RecommendationSection;
