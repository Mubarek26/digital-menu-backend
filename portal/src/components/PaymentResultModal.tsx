import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const apiUrl = import.meta.env.VITE_API_BASE_URL;

interface PaymentDetails {
  tx_Ref: string;
  amount: string;
  currency: string;
  date: string;
  status: "success" | "error";
  message: string;
}

const PaymentResultModal: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [details, setDetails] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  // const rawSearch = (typeof window !== "undefined" ? window.location.search : "")?.replace(/&amp;/g, "&");
  // const tx_Ref = searchParams.get("tx_ref");
  // const orderId = searchParams.get("order_id");
const rawSearch = (typeof window !== "undefined" ? window.location.search : "")?.replace(/&amp;/g, "&") || "";
const cleanSearch = rawSearch.startsWith("?") ? rawSearch.slice(1) : rawSearch;
  const parsed = new URLSearchParams(cleanSearch);
  
  const tx_Ref =
    parsed.get("tx_ref") ||
    parsed.get("txRef") ||
    searchParams.get("tx_ref") ||
    searchParams.get("txRef") ||
    null;
  
    const orderId =
    parsed.get("order_id") ||
    parsed.get("orderId") ||
    parsed.get("order") ||
    searchParams.get("order_id") ||
    searchParams.get("orderId") ||
    searchParams.get("order") ||
    null;
  
  console.log("orderId", orderId);
  useEffect(() => {
    if (!tx_Ref) {
      setLoading(false);
      setDetails({
        tx_Ref: "N/A",
        amount: "N/A",
        currency: "N/A",
        date: new Date().toLocaleString(),
        status: "error",
        message: "No transaction reference provided.",
      });
      return;
    }

    const fetchPaymentDetails = async () => {
      try {
        const res = await fetch(`${apiUrl}/payment/verifyPayment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tx_ref: tx_Ref, orderId }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(String(errBody?.message || "Verification failed"));
        }

        const json = await res.json();
        const chapaData = (json && (json.data.data || json)) || {};
        const status =
          (chapaData.status || json.status || "error") === "success"
            ? "success"
            : "error";

        setDetails({
          tx_Ref: chapaData.tx_ref || chapaData.txRef || tx_Ref,
          amount: String(chapaData.amount ?? "N/A"),
          currency: chapaData.currency || "N/A",
          date: new Date().toLocaleString(),
          status,
          message: String(
            status === "success"
              ? "Thank you for your payment!"
              : chapaData.message || "Your payment could not be processed."
          ),
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        setDetails({
          tx_Ref: tx_Ref || "N/A",
          amount: "N/A",
          currency: "N/A",
          date: new Date().toLocaleString(),
          status: "error",
          message: msg || "Could not verify your payment.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [tx_Ref]);

  if (loading) return <p className="text-center mt-10">Verifying payment...</p>;
  if (!details) return null;

  const isSuccess = details.status === "success";

  const modalContent = (
    <AnimatePresence>
      <motion.div
        key="overlay"
        className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[9999]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          key="modal"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white dark:bg-gray-900 border border-white/20 rounded-2xl shadow-2xl w-full max-w-md p-8 text-black dark:text-white backdrop-blur-xl"
        >
          <div className="flex flex-col items-center text-center">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-lg ${
                isSuccess
                  ? "bg-gradient-to-br from-green-400 to-green-600"
                  : "bg-gradient-to-br from-red-400 to-red-600"
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="w-12 h-12 text-white" />
              ) : (
                <XCircle className="w-12 h-12 text-white" />
              )}
            </div>

            <h2 className="text-2xl font-bold mb-2">
              {isSuccess ? "Payment Successful " : "Payment Failed ❌"}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
              {details.message}
            </p>

            <div className="w-full text-left bg-gray-50 dark:bg-gray-800/70 rounded-xl p-5 mb-6 shadow-inner">
              <p className="mb-2">
                <span className="font-semibold">Transaction Ref:</span>{" "}
                {details.tx_Ref}
              </p>
              <p className="mb-2">
                <span className="font-semibold">Amount:</span> {details.amount}{" "}
                {details.currency}
              </p>
              <p>
                <span className="font-semibold">Date:</span> {details.date}
              </p>
            </div>

            <motion.a
              href="/"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium shadow-md hover:bg-blue-700 transition"
            >
              Back to Home
            </motion.a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
};

export default PaymentResultModal;
