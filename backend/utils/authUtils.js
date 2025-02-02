const getTokenFromHeaders = (req) => {
    const authHeader = req.header("Authorization");
    return authHeader?.split(" ")[1]; // Extract the token from "Bearer <token>"
  };
  
  module.exports = { getTokenFromHeaders };