import express from 'express';
import User from '../models/Users.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

// @desc    Register a new web dashboard user
// @route   POST /api/web/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { Username, Email, Password } = req.body;

  // Validation
  if (!Username || !Email || !Password) {
    res.status(400);
    throw new Error('Please fill all required fields');
  }

  // Check if user already exists
  const userExists = await User.findOne({ Email });
  if (userExists) {
    res.status(400);
    throw new Error('User with this email already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(Password, salt);

  // Create user
  const user = await User.create({
    Username,
    Email,
    Password: hashedPassword,
  });

  if (user) {
    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    // Set cookie options based on environment
    const isProduction = process.env.NODE_ENV !== 'development';
    
    // Set JWT as cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 * 30 // 30 days
    });

    res.status(201).json({
      _id: user._id,
      username: user.Username,
      email: user.Email,
      token: token
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Login user & get token
// @route   POST /api/web/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  console.log("Login request received");
  const { Email, Password } = req.body;
  
  // Validate request
  if (!Email || !Password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // Find user by email
  const user = await User.findOne({ Email });

  // Check if user exists and password matches
  if (user && (await bcrypt.compare(Password, user.Password))) {
    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    // Set cookie options based on environment
    const isProduction = process.env.NODE_ENV !== 'development';
    
    // Set JWT as cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: isProduction, // Must be true in production for SameSite=None
      sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-domain in production, 'lax' for development
      maxAge: 24 * 60 * 60 * 1000 * 30, // 30 days
      path: '/' // Set the path to root
    });

    res.status(200).json({
      _id: user._id,
      username: user.Username,
      email: user.Email,
      token: token
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/web/users/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  const isProduction = process.env.NODE_ENV !== 'development';
  
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    expires: new Date(0)
  });

  res.status(200).json({ message: 'Logged out successfully' });
});

// @desc    Get user profile
// @route   GET /api/web/users/profile
// @access  Private
const getUserProfile = (async (req, res) => {
  const user = await User.findById(req.user._id).select('-Password');

  if (user) {
    res.status(200).json({
      _id: user._id,
      username: user.Username,
      email: user.Email
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/web/users/profile
// @access  Private
const updateUserProfile = (async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.Username = req.body.Username || user.Username;
    user.Email = req.body.Email || user.Email;

    if (req.body.Password) {
      const salt = await bcrypt.genSalt(10);
      user.Password = await bcrypt.hash(req.body.Password, salt);
    }

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      username: updatedUser.Username,
      email: updatedUser.Email
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);


export default router;
