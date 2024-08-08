const express = require("express");
const app = express();
app.use(express.json());
require("dotenv").config();
require("./Connections/connection");
const cors = require("cors");
const UserAPI = require("./routes/user");
const TaskAPI = require("./routes/task");

app.use(cors());

app.use("/api/v1", UserAPI);
app.use("/api/v2", TaskAPI);

// app.use("/", (req, res) => {
//   res.send("Hello from backend");
// });

const PORT = 8000;
app.listen(PORT, () => console.log("Server is running at PORT " + PORT));
