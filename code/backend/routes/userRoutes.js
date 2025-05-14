import express from 'express';
import mongoose from 'mongoose'; 
import User from '../models/Users.js';
import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt";
import axios from 'axios';
import xml2js from 'xml2js';

const router = express.Router();

const createToken = (_id) => {
    return jwt.sign({ _id }, process.env.JWT_SECRET, {
        expiresIn: "365d"
    });
}

router.get('/', async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json({
            success: true,
             data: users
        });
    } catch (error) {
        console.log("Error in fetching users:", error.message);
        res.status(500).json({ success: false, message: "Error in fetching users" });
    }
});

router.get('/:id', async (req, res) => {
    const {id} = req.params;
    console.log("ID:", id);
    try {
        const user = await User.findById(id);
        res.status(200).json({
            success: true,
             data: user
        });
    } catch (error) {
        console.log("Error in fetching users:", error.message);
        res.status(500).json({ success: false, message: "Error in fetching users" });
    }
});

router.post('/signup', async (req, res) => {
    const user = req.body; // user input data
    console.log(user);
    if (!user.Username || !user.Password || !user.Email) {
        return res.status(400).send({ success: false, message: "Please fill all fields" });
    }
    // should hash the password, with salt
    const salt = await bcrypt.genSalt(10);
    user.Password = await bcrypt.hash(user.Password, salt);

    const newUser = new User(user);

    const exist = await User.findOne({ Email: user.Email });
    if (exist) {
        return res.status(400).json({ success: false, message: "User already exists" });
    }

    try {
        await newUser.save();
        // need to create jwt token
        const token = createToken(newUser._id);
        res.status(201).send({ success: true, message: "User created successfully", "email": newUser.Email, "token": token });
    } catch (error) {
        console.log("Error in creating user:", error.message);
        res.status(500).send({ success: false, message: "Error in creating user" });
    }
});

router.delete('/:id', async (req, res) => {
    const {id} = req.params;
    let user = await User.findById(id);
    if (!user) {
        console.log("hi");
        return res.status(404).json({ success: false, message: "User not found" });
    }
    try {
        await User.findByIdAndDelete(id);
        console.log(id);
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error in deleting user" });
    }
});

router.put('/:id', async (req, res) => {
    const {id} = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: "Invalid user id" });
    }
    const user = req.body;
    if (!user.Password || user.Password.trim() === '') {
        delete user.Password;
    } else {
        const salt = await bcrypt.genSalt(10);
        user.Password = await bcrypt.hash(user.Password, salt);
    }
    console.log(user);
    // if user.password is empty, remove it from the object
    try {
        const updatedUser = await User.findByIdAndUpdate(id, user, { new: true });
        res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: updatedUser
        })
    } catch (error) {
        res.status(500).json({ success: false, message: "Error in updating user" });
    }
});

router.post('/login', async (req, res) => {
    const { Email, Password } = req.body;
    console.log("Email:", Email);
    if (!Email || !Password) {
        return res.status(400).json({ success: false, message: "Please fill all fields" });
    }
    try {
        const user = await User.findOne({ Email: Email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const match = await bcrypt.compare(Password, user.Password);

        if (!match) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }
        const token = createToken(user._id);
        res.status(200).json({ success: true, message: "Login successful" , "email": user.Email, "_id": user._id, "token": token });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error in login: " + error.message });
    }
});

export default router;