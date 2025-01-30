const User = require("../models/User");

const authorize = (roles) => {
    return async (req, res, next) => {
        try {
            console.log("User ID from token:", req.user.userId);  // Debugging

            const user = await User.findById(req.user.userId);
            
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (!roles.includes(user.role)) {
                return res.status(403).json({ message: "Forbidden: You don't have permission to access this resource" });
            }

            console.log("Authorized:", user.role);  // Debugging
            next();
        } catch (err) {
            res.status(500).json({ message: "Server error", error: err.message });
        }
    };
};

module.exports = authorize;
