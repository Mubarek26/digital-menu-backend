function generateOrderId(prefix = "ORD") {
  // Generate a 6-digit random number
  const randomPart = Math.floor(100000 + Math.random() * 900000); // 6 digits
  return `${prefix}${randomPart}`;
}

// Example usage:
const orderId = generateOrderId(); // e.g., ORD123456
module.exports= generateOrderId;