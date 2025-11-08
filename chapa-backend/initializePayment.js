import axios from "axios";
const TEST_PAYMENT_SECRET = process.env.TEST_PAYMENT_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL;
async function initializePayment() {
  try {
    const response = await axios.post(
      "https://api.chapa.co/v1/transaction/initialize",
      {
         amount,
        currency: "ETB",
        phone_number,
        tx_ref,
        callback_url: `${CALLBACK_URL}`, // webhook/callback
        // return_url: "http://localhost:3000/success", // frontend success page
        customization: {
          title: "My Shop Payment",
          description: "Payment for order",
        },
        meta: {
          hide_receipt: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${TEST_PAYMENT_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(response.data);

    // Redirect user to checkout page
    console.log("Checkout URL:", response.data.data.checkout_url);
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}

initializePayment();
