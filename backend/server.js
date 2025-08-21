const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db'); // Removed .js extension

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
const authRoutes = require('./routes/authroutes');
console.log("Loaded Auth Routes:", authRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));