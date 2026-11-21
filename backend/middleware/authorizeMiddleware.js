const User = require("../models/User");

const authorize = (roles = []) => {
    return async (req, res, next) => {
        try {
            const user = await User.findById(req.user.userId);
            
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const allowedRoles = new Set(roles);
            if (allowedRoles.has("admin")) {
                allowedRoles.add("department_admin");
                allowedRoles.add("super_admin");
            }
            if (user.role === "super_admin") {
                allowedRoles.add("super_admin");
            }

            if (!allowedRoles.has(user.role)) {
                return res.status(404).json({ message: "Not found" });
            }

            next();
        } catch (err) {
            res.status(500).json({ message: "Server error", error: err.message });
        }
    };
};

module.exports = authorize;
