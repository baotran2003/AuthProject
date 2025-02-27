const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const session = require("express-session");

dotenv.config({ path: "./config.env" });

// Connect MongoDB Database
mongoose
    .connect(process.env.DATABASE_LOCAL)
    .then(() => {
        console.log("Connect To MongoDB Successful!");
    })
    .catch((err) => {
        console.error("Connect To MongoDB Fail !:", err);
    });

// middleware for session
app.use(
    session({
        secret: "Just a simple login/sign up application.",
        resave: true,
        saveUninitialized: true,
    })
);

// middleware flash messages
app.use(flash());

// setting middleware globally
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_mgs");
    res.locals.error_msg = req.flash("error_mgs");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.listen(process.env.PORT, () => {
    console.log("Server started on port 3000.");
});
