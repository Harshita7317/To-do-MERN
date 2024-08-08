const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.header("authorization");
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access Denied" });

  jwt.verify(token, "test123", (err, user) => {
    if (err) {
      return res.status(400).json(err);
    }
    req.user = user;
    next();
  });
};
module.exports = { authenticateToken };
