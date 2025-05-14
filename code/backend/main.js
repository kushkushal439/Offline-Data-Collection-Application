import express from 'express';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import { connectDB } from './mongo.js';
import cors from 'cors';
import formRoutes from './routes/formRoutes.js';
import responseRoutes from './routes/responseRoutes.js';
import webDashboardUserRoutes from './routes/webDashboardUserRoutes.js';
import userRoutes from './routes/userRoutes.js';
import fileRoutes from './routes/fileRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Fixed CORS configuration
const allowedOrigins = [
  'https://data-collection-web-dashboard.vercel.app',
  'https://www.data-collection-web-dashboard.vercel.app',
  'http://localhost:3000',
  'http://localhost:8081',
  '*'
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log('CORS Origin:', origin);

    // Allow requests with no origin (like mobile apps or curl/postman)
    if (!origin) {
      return callback(null, true);
    }

    // Check if the origin is in our allowlist
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Configure cookie-parser with secure defaults
app.use(cookieParser());

// Add cookie security middleware
app.use((req, res, next) => {
  // Capture the original cookie setting method
  const originalSetCookie = res.cookie;

  // Override the cookie setting method
  res.cookie = function(name, value, options = {}) {
    // Set secure cookie options for production
    const isProduction = process.env.NODE_ENV === 'production';

    const cookieOptions = {
      ...options,
      // In production, always use these settings for cross-domain cookies
      ...(isProduction && {
        sameSite: 'none',
        secure: true,
        httpOnly: true
      })
    };

    // Call the original method with our enhanced options
    return originalSetCookie.call(this, name, value, cookieOptions);
  };

  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

app.use((req, res, next) => {
  console.log('Request received:');
  console.log('- URL:', req.url);
  console.log('- Origin:', req.headers.origin);
  console.log('- Cookies:', req.cookies);
  console.log('- Headers:', req.headers);
  next();
});


app.use('/api/forms', formRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/web_dashboard_users', webDashboardUserRoutes);
app.use('/api/files', fileRoutes);

// Basic test route
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

