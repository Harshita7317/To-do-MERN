const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
require("dotenv").config();
require("./Connections/connection");
const cors = require("cors");
const UserAPI = require("./routes/user");
const TaskAPI = require("./routes/task");

app.use(cors());

app.use("/api/v1", UserAPI);
app.use("/api/v2", TaskAPI);

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

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log("Server is running at PORT " + PORT));
