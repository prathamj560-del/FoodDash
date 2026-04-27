import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setUserData, setLoading } from '../redux/userSlice'
import { SERVER_URI } from '../App'

function useGetCurrentUser() {
    const dispatch = useDispatch()
    useEffect(() => {
        const fetchUser = async () => {
            try {
                dispatch(setLoading(true))
                const result = await axios.get(`${SERVER_URI}/api/user/current`, { withCredentials: true })
                dispatch(setUserData(result.data))
            } catch (error) {
                console.log(error)
                // Set loading to false even on error
                dispatch(setLoading(false))
            }
        }
        fetchUser()

    }, [dispatch])
}

export default useGetCurrentUser
