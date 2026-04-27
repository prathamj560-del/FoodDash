
import { useSelector } from 'react-redux'
import type { RootState } from '../../redux/store'
import UserDashboard from './UserDashboard';
import OwnerDashboard from './OwnerDashboard';
import DeliveryDashboard from './DeliveryDashboard';

function Home() {
    const { userData } = useSelector((state: RootState) => state.user);

    return (
        <div className='w-[100vw] min-h-[100vh] pt-[100px] flex flex-col items-center bg-[#fff9f6]'>
            {userData?.role == "user" && <UserDashboard />}
            {userData?.role == "owner" && <OwnerDashboard />}
            {userData?.role == "deliveryBoy" && <DeliveryDashboard />}
        </div>
    )
}

export default Home