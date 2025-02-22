const express = require("express");
const sequelize = require("./config/database");
const contactRoutes = require("./routes/identifyRoutes");

const app = express();
app.use(express.json());
app.use("/api", contactRoutes);

sequelize.sync().then(() => console.log("Database Synced"));

module.exports = app;
