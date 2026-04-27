
interface CategoryCardProps {
    name: string;
    image: string;
    onClick?: () => void;
}

function CategoryCard({ name, image, onClick }: CategoryCardProps) {
    return (
        <div
            className='flex flex-col items-center gap-3 cursor-pointer group'
            onClick={onClick}
        >
            {/* Image Container */}
            <div className='relative w-[90px] h-[90px] md:w-[140px] md:h-[140px] rounded-full overflow-hidden transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-orange-200 group-hover:-translate-y-1'>

                {/* Background Glow on Hover */}
                <div className='absolute inset-0 bg-[#ff4d2d] opacity-0 group-hover:opacity-10 transition-opacity duration-300' />

                <img
                    src={image}
                    alt={name}
                    className='w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500'
                />
            </div>

            {/* Label */}
            <div className='text-center'>
                <p className='text-xs md:text-sm font-bold text-gray-700 group-hover:text-[#ff4d2d] transition-colors uppercase tracking-wide'>
                    {name}
                </p>
                {/* Small indicator line that appears on hover */}
                <div className='h-[2px] w-0 bg-[#ff4d2d] mx-auto transition-all duration-300 group-hover:w-full mt-0.5' />
            </div>
        </div>
    );
}

export default CategoryCard;