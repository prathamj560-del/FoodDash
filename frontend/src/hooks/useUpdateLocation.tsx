import axios from 'axios'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { SERVER_URI } from '../App'
import type { RootState } from '../redux/store'

function useUpdateLocation() {
    const { userData } = useSelector((state: RootState) => state.user)

    useEffect(() => {
        // Only run for 'deliveryBoy' role
        if (userData?.role !== 'deliveryBoy') return;
        
        const updateLocation = async (lat: number, lon: number) => {
            const result = await axios.post(`${SERVER_URI}/api/user/update-location`, { lat, lon }, { withCredentials: true })
            console.log(result.data)
        }

        navigator.geolocation.watchPosition((pos) => {
            updateLocation(pos.coords.latitude, pos.coords.longitude)
        })
    }, [userData])
}

export default useUpdateLocation
