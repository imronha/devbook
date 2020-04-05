const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header("x-auth-token");

  // Check if no token is present
  if (!token) {
    return res.status(401).json({ msg: "No token. Access denied" });
  }

  // Verify token
  try {
    const decoded = jwt.verify(
      token,
      config.get("jwtToken"),
      (error, decoded) => {
        if (error) {
          res.status(401).json({ msg: "Invalid Token" });
        } else {
          req.user = decoded.user;
          next();
        }
      }
    );
  } catch (err) {
    console.error("Something Wrong with auth middleware");
    res.status(500).json({ msg: "Server Error" });
  }
};
