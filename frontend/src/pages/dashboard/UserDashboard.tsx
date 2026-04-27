import { useEffect, useRef, useState, useMemo } from 'react'
import Nav from '../../components/Nav'
import { categories } from '../../utils/categories'
import CategoryCard from '../../components/CategoryCard'
import RecommendationSection from '../../components/RecommendationSection'
import { FaCircleChevronLeft, FaCircleChevronRight } from "react-icons/fa6";
import { FaLeaf, FaShoppingBag, FaStore } from "react-icons/fa";
import { useSelector } from 'react-redux';
import FoodCard from '../../components/FoodCart';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../redux/store';
import type { Item, Shop } from '../schema';

type SortOption = 'popular' | 'priceLow' | 'priceHigh' | 'rating';
type FilterOption = 'all' | 'veg' | 'nonveg';

function UserDashboard() {
  const { currentCity, shopInMyCity, itemsInMyCity, searchItems, userData } = useSelector((state: RootState) => state.user)
  const cateScrollRef = useRef<HTMLDivElement>(null)
  const shopScrollRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [showLeftCateButton, setShowLeftCateButton] = useState(false)
  const [showRightCateButton, setShowRightCateButton] = useState(false)
  const [showLeftShopButton, setShowLeftShopButton] = useState(false)
  const [showRightShopButton, setShowRightShopButton] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [sortBy, setSortBy] = useState<SortOption>('popular')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')

  const handleFilterByCategory = (category: string) => {
    setSelectedCategory(category)
  }

  // Calculate filtered and sorted items using useMemo
  const filteredAndSortedItems = useMemo(() => {
    let items = itemsInMyCity || []

    // Filter by category
    if (selectedCategory !== 'All') {
      items = items.filter(item => item.category === selectedCategory)
    }

    // Filter by food type
    if (filterBy === 'veg') {
      items = items.filter(item => item.foodType === 'veg')
    } else if (filterBy === 'nonveg') {
      items = items.filter(item => item.foodType === 'non veg')
    }

    // Sort items
    const sortedItems = [...items]
    switch (sortBy) {
      case 'popular':
        sortedItems.sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
        break
      case 'priceLow':
        sortedItems.sort((a, b) => a.price - b.price)
        break
      case 'priceHigh':
        sortedItems.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        sortedItems.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0))
        break
    }

    return sortedItems
  }, [itemsInMyCity, selectedCategory, filterBy, sortBy])

  const updateButton = (ref: React.RefObject<HTMLDivElement | null>, setLeftButton: (value: boolean) => void, setRightButton: (value: boolean) => void) => {
    const element = ref.current
    if (element) {
      setLeftButton(element.scrollLeft > 0)
      setRightButton(element.scrollLeft + element.clientWidth < element.scrollWidth)
    }
  }

  const scrollHandler = (ref: React.RefObject<HTMLDivElement | null>, direction: string) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction == "left" ? -200 : 200,
        behavior: "smooth"
      })
    }
  }

  useEffect(() => {
    if (cateScrollRef.current && shopScrollRef.current) {
      updateButton(cateScrollRef, setShowLeftCateButton, setShowRightCateButton)
      updateButton(shopScrollRef, setShowLeftShopButton, setShowRightShopButton)
      cateScrollRef.current.addEventListener('scroll', () => {
        updateButton(cateScrollRef, setShowLeftCateButton, setShowRightCateButton)
      })
      shopScrollRef.current.addEventListener('scroll', () => {
        updateButton(shopScrollRef, setShowLeftShopButton, setShowRightShopButton)
      })
    }

    return () => {
      cateScrollRef?.current?.removeEventListener("scroll", () => {
        updateButton(cateScrollRef, setShowLeftCateButton, setShowRightCateButton)
      })
      shopScrollRef?.current?.removeEventListener("scroll", () => {
        updateButton(shopScrollRef, setShowLeftShopButton, setShowRightShopButton)
      })
    }
  }, [categories])

  // Calculate stats
  const totalItems = itemsInMyCity?.length || 0
  const totalShops = shopInMyCity?.length || 0
  const vegItems = itemsInMyCity?.filter(item => item.foodType === 'veg').length || 0

  return (
    <div className='w-screen min-h-screen flex flex-col gap-5 items-center bg-[#fff9f6] overflow-y-auto'>
      <Nav />

      {/* Stats Cards */}
      <div className='w-full max-w-6xl grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 mt-4'>
        <div className='bg-gradient-to-br from-orange-50 to-white p-6 rounded-2xl shadow-md border border-orange-100 hover:shadow-lg transition-shadow'>
          <div className='flex items-center gap-3'>
            <FaShoppingBag className='text-[#ff4d2d] text-3xl' />
            <div>
              <p className='text-gray-500 text-sm'>Available Items</p>
              <p className='text-2xl font-bold text-gray-800'>{totalItems}</p>
            </div>
          </div>
        </div>

        <div className='bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl shadow-md border border-green-100 hover:shadow-lg transition-shadow'>
          <div className='flex items-center gap-3'>
            <FaStore className='text-green-600 text-3xl' />
            <div>
              <p className='text-gray-500 text-sm'>Restaurants in {currentCity}</p>
              <p className='text-2xl font-bold text-gray-800'>{totalShops}</p>
            </div>
          </div>
        </div>

        <div className='bg-gradient-to-br from-emerald-50 to-white p-6 rounded-2xl shadow-md border border-emerald-100 hover:shadow-lg transition-shadow'>
          <div className='flex items-center gap-3'>
            <FaLeaf className='text-emerald-600 text-3xl' />
            <div>
              <p className='text-gray-500 text-sm'>Veg Options</p>
              <p className='text-2xl font-bold text-gray-800'>{vegItems}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      {userData && (
        <div className='w-full max-w-6xl px-4'>
          <h2 className='text-gray-700 text-lg sm:text-xl'>
            Welcome back, <span className='font-semibold text-[#ff4d2d]'>{userData.fullName}</span>! 🍔
          </h2>
        </div>
      )}

      {searchItems && searchItems.length > 0 && (
        <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-5 bg-white shadow-md rounded-2xl mt-4'>
          <h1 className='text-gray-900 text-2xl sm:text-3xl font-semibold border-b border-gray-200 pb-2'>
            Search Results
          </h1>
          <div className='w-full h-auto flex flex-wrap gap-6 justify-center'>
            {searchItems.map((item: Item) => (
              <FoodCard data={item} key={item._id} />
            ))}
          </div>
        </div>
      )}

      <div className="w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]">
        <h1 className='text-gray-800 text-2xl sm:text-3xl'>Inspiration for your first order</h1>
        <div className='w-full relative'>
          {showLeftCateButton && <button className='absolute left-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#e64528] z-10' onClick={() => scrollHandler(cateScrollRef, "left")}><FaCircleChevronLeft />
          </button>}

          <div className='w-full flex overflow-x-auto gap-4 pb-2 ' ref={cateScrollRef}>
            {categories.map((cate, index) => (
              <CategoryCard name={cate.category} image={cate.image} key={index} onClick={() => handleFilterByCategory(cate.category)} />
            ))}
          </div>
          {showRightCateButton && <button className='absolute right-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#e64528] z-10' onClick={() => scrollHandler(cateScrollRef, "right")}>
            <FaCircleChevronRight />
          </button>}
        </div>
      </div>

      <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]'>
        <h1 className='text-gray-800 text-2xl sm:text-3xl'>Best Shops in {currentCity}</h1>
        <div className='w-full relative'>
          {showLeftShopButton && <button className='absolute left-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#e64528] z-10' onClick={() => scrollHandler(shopScrollRef, "left")}><FaCircleChevronLeft />
          </button>}

          <div className='w-full flex overflow-x-auto gap-4 pb-2 ' ref={shopScrollRef}>
            {shopInMyCity?.map((shop: Shop, index: number) => (
              <CategoryCard name={shop.name} image={shop.image} key={index} onClick={() => navigate(`/shop/${shop._id}`)} />
            ))}
          </div>
          {showRightShopButton && <button className='absolute right-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#e64528] z-10' onClick={() => scrollHandler(shopScrollRef, "right")}>
            <FaCircleChevronRight />
          </button>}
        </div>
      </div>

      {/* Filters and Sort Section */}
      {selectedCategory !== 'All' && (
        <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]'>
          <div className='w-full bg-white p-4 rounded-2xl shadow-md border border-gray-100'>
            <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
              <h2 className='text-xl font-semibold text-gray-800'>
                {selectedCategory} Items ({filteredAndSortedItems.length})
              </h2>
              
              <div className='flex flex-wrap gap-3'>
                {/* Food Type Filter */}
                <div className='flex gap-2'>
                  <button
                    onClick={() => setFilterBy('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      filterBy === 'all'
                        ? 'bg-[#ff4d2d] text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterBy('veg')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                      filterBy === 'veg'
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  > Veg
                  </button>
                  <button
                    onClick={() => setFilterBy('nonveg')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                      filterBy === 'nonveg'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Non-Veg
                  </button>
                </div>

                {/* Sort Options */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className='px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]'
                >
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="priceLow">Price: Low to High</option>
                  <option value="priceHigh">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filtered Items Grid */}
          <div className='w-full h-auto flex flex-wrap gap-[20px] justify-center'>
            {filteredAndSortedItems.map((item: Item) => (
              <FoodCard key={item._id} data={item} />
            ))}
          </div>

          {filteredAndSortedItems.length === 0 && (
            <div className='w-full text-center py-12'>
              <p className='text-gray-400 text-lg'>No items found matching your filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Personalized Recommendations Section */}
      <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]'>
        <RecommendationSection city={currentCity || ''} />
      </div>
    </div>
  )
}

export default UserDashboard
