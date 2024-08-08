const express = require("express");
const app = express();
const cors = require("cors");
app.use(express.json());
const path = require("path");
app.use(cors());
require("dotenv").config();
require("./Connections/connection");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { connectDatabase } = require("./Connections/connection");
const Task = require("./models/task");
const User = require("./models/user");
const { authenticateToken } = require("./routes/auth");

//api for signin
app.post("/signin", async (req, res) => {
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
app.post("/login", async (req, res) => {
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
      res.status(200).json({
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

//route for create task
app.post("/createtask", authenticateToken, async (req, res) => {
  try {
    const { title, desc } = req.body;
    const { id } = req.headers;
    const newTask = new Task({ title, desc });
    const saveTask = await newTask.save();
    const taskId = saveTask._id;
    await User.findByIdAndUpdate(id, { $push: { tasks: taskId._id } });
    res.status(200).json({ success: true, message: "Task created" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: "Internal server error" });
  }
});

app.get("/get-all-tasks", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers;
    const userData = await User.findById(id).populate({
      path: "tasks",
      options: { sort: { createdAt: -1 } },
    });
    res.status(200).json({ data: userData });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Internal server error" });
  }
});

//delete task
app.delete("/delete-task/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userid = req.headers.id;
    await Task.findByIdAndDelete(id);
    await User.findByIdAndUpdate(userid, { $pull: { tasks: id } });
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Internal server error" });
  }
});

//update task
app.put("/update-task/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Received ID:", id); // Log received ID
    const { title, desc } = req.body;
    await Task.findByIdAndUpdate(id, { title: title, desc: desc });
    res.status(200).json({ message: "Task updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Internal server error" });
  }
});

//update important task
app.put("/update-imp-task/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const TaskData = await Task.findById(id);
    const ImpTask = TaskData.important;
    await Task.findByIdAndUpdate(id, { important: !ImpTask });
    res.status(200).json({ message: "Task updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Internal server error" });
  }
});

//update comp task
app.put("/update-complete-task/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const TaskData = await Task.findById(id);
    const completeTask = TaskData.complete;
    await Task.findByIdAndUpdate(id, { complete: !completeTask });
    res.status(200).json({ message: "Task updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Internal server error" });
  }
});

//get important task
app.get("/get-imp-tasks", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers; //kaunsa user hai
    const Data = await User.findById(id).populate({
      path: "tasks",
      match: { important: true },
      options: { sort: { createdAt: -1 } },
    });
    const ImpTaskData = Data.tasks;
    res.status(200).json({ data: ImpTaskData });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Internal server error" });
  }
});

//get comp task
app.get("/get-comp-tasks", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers; //kaunsa user hai
    const Data = await User.findById(id).populate({
      path: "tasks",
      match: { complete: true },
      options: { sort: { createdAt: -1 } },
    });
    const CompTaskData = Data.tasks;
    res.status(200).json({ data: CompTaskData });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Internal server error" });
  }
});
//get incomplete task
app.get("/get-incomp-tasks", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers; //kaunsa user hai
    const Data = await User.findById(id).populate({
      path: "tasks",
      match: { complete: false },
      options: { sort: { createdAt: -1 } },
    });
    const InCompTaskData = Data.tasks;
    res.status(200).json({ data: InCompTaskData });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Internal server error" });
  }
});

app.use(express.static("client/build"));
app.get("*", (req, res) => {
  res.sendFile(
    path.resolve(__dirname + "/client/build/index.html"),
    function (err) {
      if (err) {
        console.log(err);
      }
    }
  );
});
connectDatabase();
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log("Server is running at PORT " + PORT));
