import { set } from "mongoose";
import React, { useEffect, useState } from "react";

const CheckOrderModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("waitng...");
  const [name, setName] = useState("waiting...");

  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener("openCheckOrderModal", open as EventListener);
    return () => window.removeEventListener("openCheckOrderModal", open as EventListener);
  }, []);

    
  useEffect(() => {
    const onResult = (e: Event) => {
      try {
        const ev = e as CustomEvent;
        if (ev?.detail?.orderId) {
          setMessage(`Status for ${ev.detail.orderId}: ${ev.detail.status ?? "(no status)"}`);
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("orderStatusResult", onResult as EventListener);
    return () => window.removeEventListener("orderStatusResult", onResult as EventListener);
  }, []);

  const close = () => {
    setIsOpen(false);
    setOrderId("");
    setMessage(null);
    setLoading(false);
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!orderId.trim()) {
      setMessage("Please enter an order id");
      setName("");
      setPhoneNumber("");
      return;
    }
      setLoading(true);
      setMessage(null);
    try {
    //   const ev = new CustomEvent("checkOrderStatus", { detail: { orderId: orderId.trim() } });
        //   window.dispatchEvent(ev);
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/order/getOrder/${orderId.trim()}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        if(!res.ok) {
            setMessage(`Error: ${res.statusText}`);
            setName("");
            setPhoneNumber("");
            setLoading(false);
            return;
        }
        const data= await res.json();
        setMessage(`Status: ${data.data?.status ?? "(no status)"}`);
        setPhoneNumber(data.data?.userInfo?.phoneNumber ?? "");
        setName(data.data?.userInfo?.name ?? "");
    } catch {
      /* ignore */
    }
    finally {
        setLoading(false);
        
    }
    setTimeout(() => {
      setLoading(false);
      // setMessage(`Check requested for "${orderId.trim()}"`);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md p-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Check order status</h4>
        <form onSubmit={submit} className="mt-3 space-y-3">
          <label className="block text-sm text-gray-600 dark:text-gray-300">Order ID</label>
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-800 text-white border-gray-200 dark:border-gray-700 text-sm"
            placeholder="Enter your order id"
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className="px-3 py-1 rounded-md bg-gray-100 text-sm text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1 rounded-md bg-teal-600 text-white text-sm disabled:opacity-60"
            >
              {loading ? "Checking..." : "Check"}
            </button>
          </div>

          {message && (
            <>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">{message}</div>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">Name: {name}</div>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">Phone Number: 0{phoneNumber}</div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default CheckOrderModal;
