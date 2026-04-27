import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setMyOrders } from '../redux/userSlice'
import type { RootState } from '../redux/store'
import { SERVER_URI } from '../App'

function useGetMyOrders() {
    const dispatch = useDispatch()
    const { userData } = useSelector((state: RootState) => state.user)
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const result = await axios.get(`${SERVER_URI}/api/order/my-orders`, { withCredentials: true })
                dispatch(setMyOrders(result.data))



            } catch (error) {
                console.log(error)
            }
        }
        fetchOrders()



    }, [userData])
}

export default useGetMyOrders
