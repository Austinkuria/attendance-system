const User = require("../models/User");

const authorize = (roles) => {
    return async (req, res, next) => {
        try {
            const user = await User.findById(req.user);

            if (!user || !roles.includes(user.role)) {
                return res.status(403).json({ message: "Forbidden: You don't have permission to access this resource" });
            }

            next();
        } catch (err) {
            res.status(500).json({ message: "Server error", error: err.message });
        }
    };
};

module.exports = authorize;
