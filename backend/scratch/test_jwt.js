require('dotenv').config();
const jwt = require('jsonwebtoken');

console.log("JWT_SECRET from .env:", process.env.JWT_SECRET);

const token = jwt.sign({ id: 1, rol_id: 1 }, process.env.JWT_SECRET, { expiresIn: '24h' });
console.log("Signed Token:", token);

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log("Decoded successfully:", decoded);
} catch (err) {
  console.error("Verification failed:", err.message);
}
