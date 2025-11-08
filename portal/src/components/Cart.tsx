import React, { useState, useEffect } from "react";
import { X, Plus, Minus, Trash2 } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useLanguage } from "../contexts/LanguageContext";
import DeliveryLocationMap from "./DeliveryLocationMap";
import OrderProgress from "./OrderProgress";
const apiUrl = import.meta.env.VITE_API_BASE_URL;
import { ClipLoader } from "react-spinners";
import { del } from "framer-motion/client";
// ...existing imports...

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

const Cart: React.FC<CartProps> = ({ isOpen, onClose }) => {
  const { items, updateQuantity, removeFromCart, total, clearCart } = useCart();
  const { language, t } = useLanguage();

  const [serviceType, setServiceType] = useState("Dine-In");
  const [tableNumber, setTableNumber] = useState<number | "">("");
  const [phone, setPhone] = useState("");

  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [step, setStep] = useState<"cart" | "payment" | "success">("cart");
  const [isLoading, setIsLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  // const mapRef = useRef(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [specialNotice, setSpecialNotice] = useState("");
  const [dineInEnabled, setDineInEnabled] = useState(true);
  const [takeawayEnabled, setTakeawayEnabled] = useState(true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);

  // ...existing code...

  // Validate order details before confirming
  const validateOrderDetails = () => {
    if (!serviceType) return false;
    if (serviceType === "Dine-In" && !tableNumber) return false;
    if (!phone) return false;
    // Require a delivery location only when serviceType is Delivery.
    // Use parentheses so the check applies only for Delivery (not globally).
    if (serviceType === "Delivery" && !(userLocation || location)) return false;
    return true;
  };


  useEffect(() => {
    // fetch the settings from backend once
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${apiUrl}/settings`);
        if (response.ok) {
          const data = await response.json();
          const settings = data.data?.settings;
          // fix key name: schema uses `dine_in`
          const dineInFlag = settings?.services?.dine_in ?? true;
          const takeawayFlag = settings?.services?.takeaway ?? true;
          const deliveryFlag = settings?.services?.delivery ?? true;
          setDineInEnabled(dineInFlag);
          setTakeawayEnabled(takeawayFlag);
          setDeliveryEnabled(deliveryFlag);
          // set special notice for display to customers
          if (settings?.special_notice) {
            setSpecialNotice(settings.special_notice);
          } else {
            setSpecialNotice('');
          }
          console.log("Fetched settings:", settings);

          // If the currently selected serviceType is not available, pick the first available
          const allowed: string[] = [];
          if (dineInFlag) allowed.push("Dine-In");
          if (takeawayFlag) allowed.push("Takeaway");
          if (deliveryFlag) allowed.push("Delivery");
          if (allowed.length > 0 && !allowed.includes(serviceType)) {
            setServiceType(allowed[0]);
          }
        }
      } catch (err) {
        console.error('Failed fetching settings', err);
      }
    };

    fetchSettings();
  }, []);
  const handleConfirmOrder = async () => {
    if (!validateOrderDetails()) return;
    // Here you can handle the order confirmation logic, e.g., sending to backend
    const orderDetails = {
      items,
      orderType: serviceType,
      tableNumber,
      phoneNumber: phone,
      location,
      notes: specialInstructions,
    };
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderDetails),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      const order = data.data?.order;
      const orderId = order?.orderId;
      setOrderId(orderId);
      setTotalPrice(order?.totalPrice);
      // console.log("Order confirmed:", data);
      setIsLoading(false);
      // move to success step and show confirmation
      setStep("success");
      setShowConfirmation(true);
      // setShowConfirmation(true);
    } catch (error) {
      console.error("Error confirming order:", error);
    }
  };

  const handlePayment = async () => {
    if (!orderId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/payment/initializePayment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: phone,
          currency: "ETB",
          orderId,
          amount: totalPrice,
        }),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      // Handle successful payment here
      console.log("Payment successful:", data);

      if (data?.data?.data?.checkout_url && data.status === "success") {
        // checkout_url is an external payment page; use window.location to navigate
        try {
          window.location.assign(data.data.data.checkout_url);
        } catch {
          window.open(data.data.data.checkout_url, "_blank");
        }
      }
    } catch (error) {
      console.error("Error processing payment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (serviceType === "Delivery" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, [serviceType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div
        style={{
          // For mobile: slide up from bottom
          // For desktop/tablet: slide in from right
          willChange: "transform",
        }}
        className="absolute transition-transform duration-300 right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-xl"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t("yourCart")}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          {specialNotice ? (
            <div className="px-6 py-3 bg-yellow-50 dark:bg-yellow-900 border-t border-b border-yellow-100 dark:border-yellow-800 text-sm">
              <div className="flex items-start justify-between">
                <div className="text-yellow-800 dark:text-yellow-100">{specialNotice}</div>
                <button
                  onClick={() => setSpecialNotice("")}
                  className="ml-4 text-yellow-800 dark:text-yellow-200 font-semibold"
                >
                  {/* × */}
                </button>
              </div>
            </div>
          ) : null}
          <div
            className="flex-1 overflow-y-auto p-6"
            style={{ maxHeight: "calc(100vh - 120px)" }}
          >
            <OrderProgress step={step} />
            {items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {t("cartEmpty")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.menuItem.imageUrl}
                        alt={(item.menuItem.name as any)[language]}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {item.menuItem.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {item.menuItem.price} {t("currency")} ×{" "}
                          {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            updateQuantity(item._id, item.quantity - 1)
                          }
                          className="p-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item._id, item.quantity + 1)
                          }
                          className="p-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="p-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t("Total Price")}:
                    </span>
                    <span className="text-xl font-bold text-teal-600 dark:text-teal-400">
                      {total} {t("currency")}
                    </span>
                  </div>
                  {/* Order details below subtotal */}
                  {/* <ServiceTypeAndDetails /> */}
                </div>
              </div>
            )}
          </div>

          {items.length > 0 && (
            <>
              {!showOrderDetails ? (
                <button
                  className="w-full mt-2 py-3 bg-gradient-to-r from-orange-500 to-teal-500 text-white font-bold rounded-xl shadow-lg hover:from-orange-600 hover:to-teal-600 transition-all text-lg"
                  onClick={() => {
                    setShowOrderDetails(true);
                    setStep("payment");
                  }}
                >
                  Place Order
                </button>
              ) : (
                <div className="mt-6 relative bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 overflow-y-auto max-h-[80vh]">
                  <button
                    className="absolute text-gray-600 dark:text-gray-300 p-1 rounded-xl 
  hover:bg-white/20 dark:hover:bg-white/10 
  backdrop-blur-sm
  transition-all duration-200 ease-in-out
  top-6 right-5 text-3xl font-bold z-10 bg-transparent border-none"
                    onClick={() => setShowOrderDetails(false)}
                    title="Close"
                    style={{ lineHeight: 1 }}
                  >
                    &times;
                  </button>
                  {/* <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button> */}
                  <div className="flex gap-3 mb-2 justify-start">
                    {(["Dine-In", "Takeaway", "Delivery"] as string[]).map(
                      (type) => {
                        const enabled =
                          type === "Dine-In"
                            ? dineInEnabled
                            : type === "Takeaway"
                            ? takeawayEnabled
                            : deliveryEnabled;
                        const isActive = serviceType === type;
                        return (
                          <button
                            key={type}
                            onClick={() => enabled && setServiceType(type)}
                            disabled={!enabled}
                            title={!enabled ? `${type} is currently unavailable` : type}
                            className={`px-3 py-1 rounded-full font-semibold border transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 text-base flex items-center gap-2 ${
                              isActive
                                ? "bg-gradient-to-r from-orange-500 to-teal-500 text-white border-orange-500 scale-105"
                                : enabled
                                ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                : "bg-gray-100/40 dark:bg-gray-800/40 text-gray-400 dark:text-gray-500 border-gray-200 cursor-not-allowed"
                            }`}
                          >
                            <span className="text-sm">{type}</span>
                            {!enabled && (
                              <svg
                                className="w-4 h-4 text-gray-500"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M12 9v4"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M12 17h.01"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>

                  {/* Show brief info when any services are unavailable */}
                  {(!dineInEnabled || !takeawayEnabled || !deliveryEnabled) && (
                    <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300">
                      <strong className="block text-gray-800 dark:text-gray-100 mb-1">Service availability</strong>
                      <ul className="list-disc list-inside space-y-1">
                        {!dineInEnabled && (
                          <li>Dine-In is currently unavailable.</li>
                        )}
                        {!takeawayEnabled && (
                          <li>Takeaway is currently unavailable.</li>
                        )}
                        {!deliveryEnabled && (
                          <li>Delivery is currently unavailable.</li>
                        )}
                      </ul>
                      <p className="mt-2 text-xs text-gray-400">If you need assistance, please contact the restaurant.</p>
                    </div>
                  )}
                  <div className="mb-4">
                    <label className="block mb-2 font-medium text-gray-700 dark:text-gray-200">
                      Table Number
                    </label>
                    <select
                      className={`w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white ${
                        serviceType !== "Dine-In"
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      value={tableNumber}
                      onChange={(e) => setTableNumber(Number(e.target.value))}
                      disabled={serviceType !== "Dine-In"}
                    >
                      <option value="">
                        {serviceType === "Dine-In"
                          ? "Select table"
                          : "Table selection disabled"}
                      </option>
                      {Array.from({ length: 20 }, (_, i) => i + 1).map(
                        (num) => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        )
                      )}
                    </select>
                    {serviceType !== "Dine-In" && (
                      <p className="text-xs text-gray-400 mt-1">
                        Table selection is only available for Dine-In orders.
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block mb-2 font-medium text-gray-700 dark:text-gray-200">
                      Phone Number
                    </label>
                    <input
                      required
                      type="tel"
                      className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="+251 9XX XXX XXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  {serviceType === "Delivery" && (
                    <div className="mb-4">
                      <label className="block mb-2 font-medium text-gray-700 dark:text-gray-200">
                        Delivery Location
                      </label>
                      <DeliveryLocationMap
                        userLocation={userLocation}
                        location={location}
                        setLocation={setLocation}
                      />
                    </div>
                  )}
                  {/* Note / Special Instructions */}
                  <div className="mb-4">
                    <label className="block mb-2 font-medium text-gray-700 dark:text-gray-200">
                      Special Instructions( optional )
                    </label>
                    <textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 border-gray-200 dark:border-gray-600"
                      placeholder="Add any notes or instructions for your order or you can leave it empty"
                      rows={3}
                    />
                  </div>
                  <button
                    className="w-full mt-2 py-3 bg-gradient-to-r from-orange-500 to-teal-500 text-white font-bold rounded-xl shadow-lg hover:from-orange-600 hover:to-teal-600 transition-all text-lg"
                    disabled={
                      !serviceType ||
                      (serviceType === "Dine-In" && !tableNumber) ||
                      !phone ||
                      (serviceType === "Delivery" &&
                        !(userLocation || location))
                    }
                    onClick={() => handleConfirmOrder()}
                  >
                    Confirm Order
                  </button>
                  {isLoading && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                      <ClipLoader color="#ffffff" size={50} />
                    </div>
                  )}
                  {showConfirmation && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-8 max-w-sm w-full text-center">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                          Order Placed!
                        </h2>
                        <p className="mb-6 text-gray-700 dark:text-gray-300">
                          Your order has been successfully submitted. Please
                          complete the payment. Thank you! Your Order Id is :{" "}
                          {orderId ? orderId : ""}
                        </p>
                        <button
                          className="px-6 mr-2 py-2 bg-orange-500 text-white rounded-lg font-semibold shadow hover:bg-orange-600 transition-all"
                          onClick={() => {
                            setShowConfirmation(false);
                            setShowOrderDetails(false);
                            clearCart(); // Clear the cart after order confirmation
                            onClose();
                          }}
                        >
                          Close
                        </button>
                        <button
                          className="px-6 py-2 hover:bg-orange-600  bg-teal-600 text-white rounded-lg font-semibold shadow hover:bg-teal-700 transition-all"
                          style={{
                            background: "#4CAF50",
                            cursor: "pointer",
                          }}
                          onClick={() => handlePayment()}
                        >
                          {isLoading ? (
                            <>
                              <span className="loader animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                              Processing...
                            </>
                          ) : (
                            "Pay"
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;
