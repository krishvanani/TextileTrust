const express = require("express");
const path = require("path");
const gstRoutes = require("./routes/gstRoutes");

const app = express();

app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.use("/api/v1", gstRoutes);

const PORT = 5001;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});