const { check } = require("express-validator");

const passwordValidation = check("password")
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters long")
  .matches(/[A-Z]/)
  .withMessage("Password must contain at least one uppercase letter")
  .matches(/[a-z]/)
  .withMessage("Password must contain at least one lowercase letter")
  .matches(/[0-9]/)
  .withMessage("Password must contain at least one number")
  .matches(/[@$!%*?&]/)
  .withMessage("Password must contain at least one special character (@$!%*?&)");

exports.validateSignup = [
  check("firstName")
    .isLength({ min: 3 })
    .withMessage("First name must be at least 3 characters long")
    .matches(/^[A-Za-z]+$/)
    .withMessage("First name must not contain numbers"),
  check("lastName")
    .isLength({ min: 3 })
    .withMessage("Last name must be at least 3 characters long")
    .matches(/^[A-Za-z]+$/)
    .withMessage("Last name must not contain numbers"),
  check("email").isEmail().withMessage("Enter a valid email address(e.g., example@domain.com"),
  passwordValidation, // Apply consistent password rules
];

exports.validateLogin = [
  check("email").isEmail().withMessage("Enter a valid email address(e.g., example@domain.com)"),
  passwordValidation,
];
