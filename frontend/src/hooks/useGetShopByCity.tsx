import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setShopsInMyCity } from '../redux/userSlice'
import { SERVER_URI } from '../App'
import type { RootState } from '../redux/store'

function useGetShopByCity() {
    const dispatch = useDispatch()
    const { currentCity, userData } = useSelector((state: RootState) => state.user)
    useEffect(() => {
        // Only run for 'user' role
        if (userData?.role !== 'user') return;
        
        const fetchShops = async () => {
            try {
                const result = await axios.get(`${SERVER_URI}/api/shop/get-by-city/${currentCity}`, { withCredentials: true })
                dispatch(setShopsInMyCity(result.data))
                console.log(result.data)
            } catch (error) {
                console.log(error)
            }
        }
        fetchShops()

    }, [currentCity])
}

export default useGetShopByCity
