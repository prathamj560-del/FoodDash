import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setItemsInMyCity } from '../redux/userSlice'
import type { RootState } from '../redux/store'
import { SERVER_URI } from '../App'

function useGetItemsByCity() {
    const dispatch = useDispatch()
    const { currentCity, userData } = useSelector((state: RootState) => state.user)
    useEffect(() => {
        // Only run for 'user' role
        if (userData?.role !== 'user') return;
        
        const fetchItems = async () => {
            try {
                const result = await axios.get(`${SERVER_URI}/api/item/get-by-city/${currentCity}`, { withCredentials: true })
                dispatch(setItemsInMyCity(result.data))
                console.log(result.data)
            } catch (error) {
                console.log(error)
            }
        }
        fetchItems()

    }, [currentCity])
}

export default useGetItemsByCity
