import React, { useState, useMemo, useEffect } from "react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import CategoryFilter from "./components/CategoryFilter";
import SearchBar from "./components/SearchBar";
import MenuItem from "./components/MenuItem";
import Cart from "./components/Cart";
// import OrderForm from './components/OrderForm';
import OrderSummary from "./components/OrderSummary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { CartProvider } from "./contexts/CartContext";
import { OrderProvider } from "./contexts/OrderContext";
import { useLanguage } from "./contexts/LanguageContext";
import { ClipLoader } from "react-spinners";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import PaymentResultModal from "./components/PaymentResultModal";
import CheckOrderModal from "./components/CheckOrderModal";
const apiUrl = import.meta.env.VITE_API_BASE_URL;
export type MenuItemType = {
  _id: string;
  category: string;
  name: Record<string, string>;
  description: Record<string, string>;
  ingredients: Record<string, string[]>;
  price: number;
  isAvailable: boolean;
  item: any;
  imageUrl: string;
  image: string; // Added property
  // add other properties as needed
};

const AppContent: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [menuDataState, setMenuDataState] = useState<MenuItemType[]>([]); // use imported menuData as initial value
  const { t } = useLanguage();
  const [categories, setCategories] = useState<string[]>([]);

useEffect(() => {
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${apiUrl}/categories`, {
        method: "GET",
      });
      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();

      // Assuming API returns: { data: { categories: [{ name: "Pizza" }, { name: "Burgers" }] } }
      const categoryNames = data.data?.categories?.map((cat: { name: string }) => cat.name) || [];

      setCategories(categoryNames);
    } catch (error) {
      console.error("Error fetching menu data:", error);
    }
  };

  fetchCategories();
}, []);

  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        console.log("Fetching menu data from API...");
        const response = await fetch(`${apiUrl}/menu`, {
          method: "GET",
        });
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        setMenuDataState(data.data?.menuItems || []);
        console.log("the data is fetched", data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error in MenuItem component:", error);
      }
      finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    return menuDataState.filter((item) => {
      const matchesCategory =
        !selectedCategory || item.category === selectedCategory;
      const matchesSearch =
        !searchTerm ||
        (item.name && item.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.description && item.description?.toLowerCase().includes(searchTerm.toLowerCase()));
     return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm, menuDataState]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header onCartToggle={() => setIsCartOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:col-span-1 space-y-6">
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />

          <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        </div>

        {isLoading && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <ClipLoader color="#ffffff" size={50} />
          </div>
        )}
  <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Menu Items */}
          <div className="lg:col-span-3">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  {t("noResults")}
                </p>

              </div>
            ) : (
              <div className="grid  grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {filteredItems.map((item) => (
                  <MenuItem key={item._id} item={item}  />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar - Order Management */}
          <div className="lg:col-span-1 space-y-6">
            {/* <OrderForm /> */}
            <OrderSummary />
          </div>
        </div>
      </main>
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <Footer />
    
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <CartProvider>
          <OrderProvider>
            <AppContent />
            <CheckOrderModal />
          </OrderProvider>
        </CartProvider>
      </LanguageProvider>
      <Router>
        <Routes>
          <Route path="/payment/success" element={<PaymentResultModal />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
