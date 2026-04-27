import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setMyShopData } from '../redux/ownerSlice'
import type { RootState } from '../redux/store'
import { SERVER_URI } from '../App'

function useGetMyshop() {
    const dispatch = useDispatch()
    const { userData } = useSelector((state: RootState) => state.user)
    useEffect(() => {
        // Only run for 'owner' role
        if (userData?.role !== 'owner') return;
        
        const fetchShop = async () => {
            try {
                const result = await axios.get(`${SERVER_URI}/api/shop/get-my`, { withCredentials: true })
                dispatch(setMyShopData(result.data))

            } catch (error) {
                console.log(error)
            }
        }
        fetchShop()

    }, [userData])
}

export default useGetMyshop
