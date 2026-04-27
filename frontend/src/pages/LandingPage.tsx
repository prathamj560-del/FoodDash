import { FaMotorcycle, FaClock, FaLeaf, FaStar, FaPlayCircle, FaHeart, FaShieldAlt, FaMobileAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

function LandingPage() {
  const features = [
    {
      icon: <FaMotorcycle className="text-3xl text-[#ff4d2d]" />,
      title: "Fast Delivery",
      description: "Get your food delivered in under 30 minutes to your doorstep"
    },
    {
      icon: <FaLeaf className="text-3xl text-green-600" />,
      title: "Fresh & Healthy",
      description: "Quality ingredients and hygienic preparation guaranteed"
    },
    {
      icon: <FaStar className="text-3xl text-yellow-500" />,
      title: "Top Rated",
      description: "Choose from thousands of 5-star rated restaurants and dishes"
    },
    {
      icon: <FaClock className="text-3xl text-blue-600" />,
      title: "24/7 Service",
      description: "Order anytime, anywhere - we're always here to serve you"
    }
  ];

  const howItWorks = [
    {
      step: "01",
      title: "Choose Your Meal",
      description: "Browse through thousands of delicious dishes from your favorite restaurants"
    },
    {
      step: "02",
      title: "Place Your Order",
      description: "Select items, customize your order, and proceed to checkout"
    },
    {
      step: "03",
      title: "Fast Delivery",
      description: "Track your order in real-time and get it delivered hot and fresh"
    }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Food Enthusiast",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
      quote: "FoodDash has completely transformed my food ordering experience. The variety is amazing and deliveries are always on time!"
    },
    {
      name: "Rahul Verma",
      role: "Busy Professional",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
      quote: "As a working professional, FoodDash saves me so much time. The app is intuitive and the food quality is excellent!"
    },
    {
      name: "Anita Desai",
      role: "Home Maker",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      quote: "I love how FoodDash offers healthy options for my family. The delivery is always fast and the packaging is eco-friendly!"
    }
  ];

  const popularCuisines = [
    {
      name: "Italian",
      image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&h=200&fit=crop",
      count: "250+ Dishes"
    },
    {
      name: "Indian",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop",
      count: "320+ Dishes"
    },
    {
      name: "Chinese",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop",
      count: "180+ Dishes"
    },
    {
      name: "Mexican",
      image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300&h=200&fit=crop",
      count: "150+ Dishes"
    }
  ];

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-[#fff9f6] to-[#ffe6d8] overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative py-20 px-4 md:px-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#ff4d2d]/10 to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block bg-[#ff4d2d]/10 text-[#ff4d2d] px-6 py-2 rounded-full text-sm font-semibold animate-pulse">
                🍔 Fresh Food Delivered to Your Doorstep
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight">
                Discover <span className="text-[#ff4d2d]">Delicious</span> Food Near You
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Order from thousands of restaurants with fast delivery, great deals, and amazing variety. Your favorite food is just a click away!
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/signup" 
                  className="group bg-[#ff4d2d] text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-lg shadow-orange-300 hover:bg-[#e64528] transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <FaPlayCircle className="text-xl" />
                  Get Started
                </Link>
                <Link 
                  to="/signin" 
                  className="bg-white text-gray-700 px-8 py-4 rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  Sign In
                </Link>
              </div>
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <img 
                      key={i}
                      src={`https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face&random=${i}`} 
                      alt="User" 
                      className="w-10 h-10 rounded-full border-2 border-white"
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <FaStar key={i} className="text-yellow-500 text-sm" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">5,000+ Happy Customers</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10">
                <img 
                  src="https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&h=600&fit=crop" 
                  alt="Delicious Food" 
                  className="rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-[#ff4d2d]/20 rounded-full -z-10 blur-2xl"></div>
              <div className="absolute -top-6 -right-6 w-64 h-64 bg-green-500/20 rounded-full -z-10 blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-10 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose FoodDash?</h2>
            <p className="text-gray-600 text-lg">Experience the best food delivery service with amazing features</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2 border border-gray-100"
              >
                <div className="mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 md:px-10 bg-[#fff9f6]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600 text-lg">Ordering food has never been easier</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((step, index) => (
              <div 
                key={index}
                className="relative group"
              >
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-[#ff4d2d] text-white rounded-2xl flex items-center justify-center text-2xl font-black opacity-10 group-hover:opacity-20 transition-opacity"></div>
                <div className="absolute -top-4 -left-4 w-16 h-16 text-[#ff4d2d] font-black text-2xl flex items-center justify-center z-10">
                  {step.step}
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2 border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Cuisines */}
      <section className="py-20 px-4 md:px-10 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Popular Cuisines</h2>
            <p className="text-gray-600 text-lg">Explore thousands of dishes from around the world</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularCuisines.map((cuisine, index) => (
              <div 
                key={index}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer"
              >
                <img 
                  src={cuisine.image} 
                  alt={cuisine.name} 
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{cuisine.name}</h3>
                  <p className="text-white/90 text-sm">{cuisine.count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 md:px-10 bg-[#fff9f6]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-gray-600 text-lg">Join thousands of happy customers</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2 border border-gray-100"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <FaStar key={i} className="text-yellow-500 text-sm" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name} 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-10 bg-gradient-to-br from-[#ff4d2d] to-[#ff7b5f] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Order?</h2>
          <p className="text-xl mb-8 opacity-95">Join thousands of satisfied customers and experience the best food delivery service</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/signup" 
              className="bg-white text-[#ff4d2d] px-8 py-4 rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              Create Account
            </Link>
            <Link 
              to="/signin" 
              className="bg-transparent text-white border-2 border-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-white/10 transition-all transform hover:scale-105"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">FoodDash</h3>
              <p className="text-gray-400">Bringing delicious food to your doorstep with the fastest delivery service.</p>
              <div className="flex gap-4 mt-4">
                <Link to="#" className="text-gray-400 hover:text-white transition-colors">
                  <FaHeart />
                </Link>
                <Link to="#" className="text-gray-400 hover:text-white transition-colors">
                  <FaShieldAlt />
                </Link>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="#" className="hover:text-white transition-colors">Food Delivery</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Restaurant Partners</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Delivery Partners</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Corporate Orders</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="#" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Download App</h4>
              <p className="text-gray-400 mb-4">Get the best food delivery experience on your mobile.</p>
              <div className="space-y-2">
                <Link to="#" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                  <FaMobileAlt />
                  <span>App Store</span>
                </Link>
                <Link to="#" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                  <FaMobileAlt />
                  <span>Google Play</span>
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© 2024 FoodDash. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link to="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;