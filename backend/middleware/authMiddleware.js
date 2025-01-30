const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const authHeader = req.header("Authorization");
  console.log("Received Authorization header:", authHeader);  // Log the token
  
  const token = authHeader?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};


module.exports = authenticate;
