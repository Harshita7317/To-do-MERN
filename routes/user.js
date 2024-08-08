const router = require("express").Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//api for signin
router.post("/signin", async (req, res) => {
  try {
    const { username } = req.body;
    const { email } = req.body;
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Email." });
    }
    const existingUser = await User.findOne({ username });
    const existingEmail = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Username already exist" });
    } else if (username.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Username should have atleast 4 characters",
      });
    }
    if (existingEmail) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }

    const hashPass = await bcrypt.hash(req.body.password, 10);

    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashPass,
    });
    await newUser.save();
    return res
      .status(200)
      .json({ success: true, message: "Signup successful, please login" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: "Internal server error" });
  }
});

//login api
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const existingUser = await User.findOne({ username });
  if (!existingUser) {
    return res
      .status(400)
      .json({ success: false, message: "Incorrect credentials" });
  }
  bcrypt.compare(password, existingUser.password, (err, data) => {
    if (data) {
      const authClaim = [{ name: username }, { jti: jwt.sign({}, "test123") }];
      const token = jwt.sign({ authClaim }, "test123", { expiresIn: "2d" });
      res
        .status(200)
        .json({
          success: true,
          message: "Logged in success",
          id: existingUser._id,
          token: token,
        });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect credentials" });
    }
  });
});
module.exports = router;
