const { body, validationResult } = require("express-validator");

const validateUserInput = [
    body("email").isEmail().withMessage("Invalid email format"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("role").isIn(["student", "lecturer", "admin"]).withMessage("Invalid role")
];

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

module.exports = { validateUserInput, validate };
