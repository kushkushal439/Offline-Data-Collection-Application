import jwt from 'jsonwebtoken';
import User from '../models/Users.js';

const authenticateMobile = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication token required' 
            });
        }
        // Get token from header
        const token = authHeader.split(' ')[1];
        try {
            // Decode the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Support both _id and id formats in JWT payload
            const userId = decoded._id || decoded.id;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token format: no user ID found'
                });
            }
            
            const user = await User.findById(userId).select('-Password');
            
            if (!user) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'User not found' 
                });
            }
            
            req.user = user;
            next();
        } catch (error) {
            console.error("Token verification error:", error);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid authentication token' 
            });
        }

    } catch (error) {
        console.error("Auth middleware error:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during authentication' 
        });
    }
};

export default authenticateMobile;