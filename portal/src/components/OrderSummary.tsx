import React, { useState } from "react";
import { FaShoppingCart } from "react-icons/fa";
import Cart from "./Cart";
const tableNumbers = Array.from({ length: 20 }, (_, i) => i + 1);

const OrderSummary: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [serviceType, setServiceType] = useState("Dine-In");
  const [tableNumber, setTableNumber] = useState<number | "">("");
  const [phone, setPhone] = useState("");
  const [cartItems, setCartItems] = useState<any[]>([{id: 1, name: 'Sample Item'}]); // Demo item for button visibility

  return (
    <>
      {/* Button to open sidebar */}
      <button
        className="fixed bottom-8 right-8 bg-orange-500 text-white px-4 py-2 rounded-full shadow-lg z-40"
        onClick={() => setIsOpen(true)}
      >
        Open Cart
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg z-50 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          
          <h2 className="text-xl font-bold">Your Order</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>

        <div className="p-4">
          {/* Service Type Buttons */}
          <div className="flex gap-2 mb-4">
            {/* <Cart isOpen={isOpen} onClose={() => setIsOpen(false)} /> */}
            {["Dine-In", "Takeaway", "Delivery"].map((type) => (
              <button
                key={type}
                className={`px-3 py-1 rounded-full font-semibold border ${
                  serviceType === type
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-gray-100 text-gray-700 border-gray-300"
                }`}
                onClick={() => setServiceType(type)}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Dine-In Table Dropdown */}
          {serviceType === "Dine-In" && (
            <div className="mb-4"  >
              <label  className="block mb-1 font-medium">Table Number</label>
              <select
                required
                className="w-full border rounded px-2 py-1"
                value={tableNumber}
                onChange={(e) => setTableNumber(Number(e.target.value))}
              >
                <option   value="">Select table</option>
                {tableNumbers.map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Phone Number Input */}
          <div className="mb-4">
            <label className="block mb-1 font-medium">Phone Number</label>
            <input
              type="tel"
              className="w-full border rounded px-2 py-1"
              placeholder="+251 9XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Cart Items or Empty State */}
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <FaShoppingCart size={40} />
              <span className="mt-2 text-base">Your cart is empty</span>
            </div>
          ) : (
            <div>
              {/* Render cart items here */}
              {/* ...existing cart item rendering code... */}
              <button
                className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-teal-500 text-white font-bold rounded-xl shadow-lg hover:from-orange-600 hover:to-teal-600 transition-all text-lg"
                onClick={() => {/* handle order submission here */}}
              >
                Place Order
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OrderSummary;