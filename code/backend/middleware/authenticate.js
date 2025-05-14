import jwt from 'jsonwebtoken';
import User from '../models/Users.js';
import asyncHandler from '../utils/asyncHandler.js';

const authenticateUser = asyncHandler(async (req, res , next) => {
    let token;
    if (req.cookies) console.log(req.cookies);
    else console.log('No cookies found');
    if (!req.cookies || !req.cookies.jwt){
        res.status(401);
        throw new Error('Not authorized, no token');
    }
    token = req.cookies.jwt;
    try {
        const id_from_token = jwt.verify(token, process.env.JWT_SECRET).id;
        req.user = await User.findById(id_from_token).select('-Password');  // Exclude password in the response 
        next();
    }catch(error){
        res.status(401);
        throw new Error('Not authorized, token failed');
    }
});
    
export default authenticateUser;
