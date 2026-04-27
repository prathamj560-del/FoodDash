import { useSelector } from 'react-redux'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { ClipLoader } from 'react-spinners'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import toast from 'react-hot-toast'
import { SERVER_URI } from '../../App'
import DeliveryBoyTracking from '../../components/DeliveryBoyTracking'
import Nav from '../../components/Nav'
import type { RootState } from '../../redux/store'

interface DeliveryLocation {
  lat: number;
  lon: number;
}

interface Assignment {
  assignmentId: string;
  shopName: string;
  deliveryAddress: {
    text: string;
  };
  items: unknown[];
  subtotal: number;
}

interface CurrentOrder {
  _id: string;
  shopOrder: {
    _id: string;
    shop: {
      name: string;
    };
    shopOrderItems: unknown[];
    subtotal: number;
  };
  deliveryAddress: {
    text: string;
    latitude: number;
    longitude: number;
  };
  user: {
    fullName: string;
  };
}

interface TodayDelivery {
  hour: number;
  count: number;
}

function DeliveryBoy() {
  const { userData, socket } = useSelector((state: RootState) => state.user)
  const [currentOrder, setCurrentOrder] = useState<CurrentOrder | undefined>()
  const [showOtpBox, setShowOtpBox] = useState(false)
  const [availableAssignments, setAvailableAssignments] = useState<Assignment[]>([])
  const [otp, setOtp] = useState("")
  const [todayDeliveries, setTodayDeliveries] = useState<TodayDelivery[]>([])
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState<DeliveryLocation | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!socket || userData?.role !== "deliveryBoy") return
    let watchId: number | undefined
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition((position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        setDeliveryBoyLocation({ lat: latitude, lon: longitude })
        socket.emit('updateLocation', {
          latitude,
          longitude,
          userId: userData._id
        })
      },
        (error) => {
          console.log(error)
        },
        {
          enableHighAccuracy: true
        }
      )
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId)
    }

  }, [socket, userData])


  const ratePerDelivery = 50
  const totalEarning = todayDeliveries.reduce((sum, d) => sum + d.count * ratePerDelivery, 0)



  const getAssignments = async () => {
    try {
      const result = await axios.get<Assignment[]>(`${SERVER_URI}/api/order/get-assignments`, { withCredentials: true })

      setAvailableAssignments(result.data)
    } catch (error) {
      console.log(error)
    }
  }

  const getCurrentOrder = async () => {
    try {
      const result = await axios.get<CurrentOrder>(`${SERVER_URI}/api/order/get-current-order`, { withCredentials: true })
      setCurrentOrder(result.data)
    } catch (error) {
      console.log(error)
    }
  }


  const acceptOrder = async (assignmentId: string) => {
    try {
      const result = await axios.get(`${SERVER_URI}/api/order/accept-order/${assignmentId}`, { withCredentials: true })
      console.log(result.data)
      await getCurrentOrder()
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (!socket) return
    
    socket.on('newAssignment', (...args: unknown[]) => {
      const data = args[0] as Assignment
      setAvailableAssignments(prev => ([...prev, data]))
      
      // Show toast notification for new delivery assignment
      toast.success(
        `🚴 New Delivery Available from ${data.shopName}! Earn ₹50`,
        { duration: 5000 }
      )
    })

    socket.on('assignmentTaken', (...args: unknown[]) => {
      const data = args[0] as { assignmentId: string }
      // Remove the assignment from the list since it was accepted by another delivery boy
      setAvailableAssignments(prev => prev.filter(a => a.assignmentId !== data.assignmentId))
      
      toast('An order was just taken by another delivery boy', { 
        duration: 3000,
        icon: 'ℹ️'
      })
    })
    
    return () => {
      socket.off('newAssignment')
      socket.off('assignmentTaken')
    }
  }, [socket])

  const sendOtp = async () => {
    if (!currentOrder) return
    setLoading(true)
    try {
      const result = await axios.post(`${SERVER_URI}/api/order/send-delivery-otp`, {
        orderId: currentOrder._id, shopOrderId: currentOrder.shopOrder._id
      }, { withCredentials: true })
      setLoading(false)
      setShowOtpBox(true)
      console.log(result.data)
    } catch (error) {
      console.log(error)
      setLoading(false)
    }
  }
  const verifyOtp = async () => {
    if (!currentOrder) return
    setMessage("")
    try {
      const result = await axios.post(`${SERVER_URI}/api/order/verify-delivery-otp`, {
        orderId: currentOrder._id, shopOrderId: currentOrder.shopOrder._id, otp
      }, { withCredentials: true })
      console.log(result.data)
      setMessage(result.data.message)
      location.reload()
    } catch (error) {
      console.log(error)
    }
  }


  const handleTodayDeliveries = async () => {

    try {
      const result = await axios.get<TodayDelivery[]>(`${SERVER_URI}/api/order/get-today-deliveries`, { withCredentials: true })
      console.log(result.data)
      setTodayDeliveries(result.data)
    } catch (error) {
      console.log(error)
    }
  }


  useEffect(() => {
    getAssignments()
    getCurrentOrder()
    handleTodayDeliveries()
  }, [userData])

  if (!userData) return null

  return (
    <div className='w-screen min-h-screen flex flex-col gap-5 items-center bg-[#fff9f6] overflow-y-auto'>
      <Nav />
      <div className='w-full max-w-[800px] flex flex-col gap-5 items-center'>
        <div className='bg-white rounded-2xl shadow-md p-5 flex flex-col justify-start items-center w-[90%] border border-orange-100 text-center gap-2'>
          <h1 className='text-xl font-bold text-[#ff4d2d]'>Welcome, {userData.fullName}</h1>
          <p className='text-[#ff4d2d] '><span className='font-semibold'>Latitude:</span> {deliveryBoyLocation?.lat}, <span className='font-semibold'>Longitude:</span> {deliveryBoyLocation?.lon}</p>
        </div>

        <div className='bg-white rounded-2xl shadow-md p-5 w-[90%] mb-6 border border-orange-100'>
          <h1 className='text-lg font-bold mb-3 text-[#ff4d2d] '>Today Deliveries</h1>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={todayDeliveries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(value) => [value, "orders"]} labelFormatter={label => `${label}:00`} />
              <Bar dataKey="count" fill='#ff4d2d' />
            </BarChart>
          </ResponsiveContainer>

          <div className='max-w-sm mx-auto mt-6 p-6 bg-white rounded-2xl shadow-lg text-center'>
            <h1 className='text-xl font-semibold text-gray-800 mb-2'>Today's Earning</h1>
            <span className='text-3xl font-bold text-green-600'>₹{totalEarning}</span>
          </div>
        </div>


        {!currentOrder && <div className='bg-white rounded-2xl p-5 shadow-md w-[90%] border border-orange-100'>
          <h1 className='text-lg font-bold mb-4 flex items-center gap-2'>🛵 Available Orders</h1>

          <div className='space-y-4'>
            {availableAssignments?.length > 0
              ?
              (
                availableAssignments.map((a, index) => (
                  <div className='border-2 border-gray-200 rounded-xl p-4 hover:border-orange-300 hover:shadow-lg transition-all' key={index}>
                    <div className='flex justify-between items-start mb-3'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-2'>
                          <span className='bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold'>
                            🔥 HOT ORDER
                          </span>
                        </div>
                        <p className='text-base font-bold text-gray-800'>{a?.shopName}</p>
                        <p className='text-sm text-gray-600 mt-1'>
                          📍 {a?.deliveryAddress.text}
                        </p>
                      </div>
                    </div>
                    
                    <div className='grid grid-cols-2 gap-3 mb-3 bg-gray-50 p-3 rounded-lg'>
                      <div>
                        <p className='text-xs text-gray-500'>Items</p>
                        <p className='text-sm font-semibold text-gray-800'>{a.items.length} items</p>
                      </div>
                      <div>
                        <p className='text-xs text-gray-500'>Order Value</p>
                        <p className='text-sm font-semibold text-gray-800'>₹{a.subtotal}</p>
                      </div>
                    </div>

                    <div className='bg-green-50 border border-green-200 rounded-lg p-3 mb-3'>
                      <p className='text-sm font-bold text-green-700 flex items-center gap-2'>
                        💰 Your Earning: <span className='text-lg'>₹50</span>
                      </p>
                    </div>

                    <button 
                      className='w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 rounded-xl text-sm font-bold hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all shadow-md' 
                      onClick={() => acceptOrder(a.assignmentId)}
                    >
                      Accept Order →
                    </button>
                  </div>
                ))
              ) : (
                <div className='text-center py-8'>
                  <p className='text-gray-400 text-lg mb-2'>📭 No Available Orders</p>
                  <p className='text-gray-400 text-sm'>New orders will appear here automatically</p>
                </div>
              )}
          </div>
        </div>}

        {currentOrder && <div className='bg-white rounded-2xl p-5 shadow-md w-[90%] border border-orange-100'>
          <h2 className='text-lg font-bold mb-3'>📦Current Order</h2>
          <div className='border rounded-lg p-4 mb-3'>
            <p className='font-semibold text-sm'>{currentOrder?.shopOrder.shop.name}</p>
            <p className='text-sm text-gray-500'>{currentOrder.deliveryAddress.text}</p>
            <p className='text-xs text-gray-400'>{currentOrder.shopOrder.shopOrderItems.length} items | ₹{currentOrder.shopOrder.subtotal}</p>
            <div className='mt-2 bg-green-50 border border-green-200 rounded-lg p-2'>
              <p className='text-sm font-semibold text-green-700'>💰 Your Delivery Fee: ₹50</p>
            </div>
          </div>

          <DeliveryBoyTracking data={{
            deliveryBoyLocation: deliveryBoyLocation || {
              lat: userData.location.coordinates[1],
              lon: userData.location.coordinates[0]
            },
            customerLocation: {
              lat: currentOrder.deliveryAddress.latitude,
              lon: currentOrder.deliveryAddress.longitude
            }
          }} />
          {!showOtpBox ? <button className='mt-4 w-full bg-green-500 text-white font-semibold py-2 px-4 rounded-xl shadow-md hover:bg-green-600 active:scale-95 transition-all duration-200' onClick={sendOtp} disabled={loading}>
            {loading ? <ClipLoader size={20} color='white' /> : "Mark As Delivered"}
          </button> : <div className='mt-4 p-4 border rounded-xl bg-gray-50'>
            <p className='text-sm font-semibold mb-2'>Enter Otp send to <span className='text-orange-500'>{currentOrder.user.fullName}</span></p>
            <input type="text" className='w-full border px-3 py-2 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400' placeholder='Enter OTP' onChange={(e) => setOtp(e.target.value)} value={otp} />
            {message && <p className='text-center text-green-400 text-2xl mb-4'>{message}</p>}

            <button className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-all" onClick={verifyOtp}>Submit OTP</button>
          </div>}

        </div>}


      </div>
    </div>
  )
}

export default DeliveryBoy
