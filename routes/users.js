const express = require("express");
const router = express.Router();
const User = require("../models/usermodel");
const passport = require("passport");
const crypto = require("crypto");
const async = require("async");
const nodemailer = require("nodemailer");

// Checks if user is authenticated
function isAuthenticatedUser(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error_msg", "Please Login First to access this page.");
    res.redirect("/login");
}

// Get routes
router.get("/login", (req, res) => {
    res.render("login");
});

router.get("/signup", (req, res) => {
    res.render("signup");
});

router.get("/dashboard", isAuthenticatedUser, (req, res) => {
    res.render("dashboard");
});

router.get("/logout", (req, res) => {
    req.logOut((err) => {
        if (err) {
            console.log(err);
            return res.redirect("/");
        }
        req.flash("success_msg", "You have been logged out.");
        res.redirect("/login");
    });
});

router.get("/forgot", (req, res) => {
    res.render("forgot");
});

router.get("/reset/:token", (req, res) => {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } })
        .then((user) => {
            if (!user) {
                req.flash("error_msg", "Password reset token in invalid or has been expired.");
                res.redirect("/forgot");
            }
            res.render("newpassword", { token: req.params.token });
        })
        .catch((err) => {
            req.flash("error_msg", "Error: " + err);
            req.redirect("/forgot");
        });
});

// POST routes
router.post(
    "/login",
    passport.authenticate("local", {
        successRedirect: "/dashboard",
        failureRedirect: "/login",
        failureFlash: "Invalid email or password. Try Again !!!",
    })
);

router.post("/signup", (req, res) => {
    let { name, email, password } = req.body;

    let userData = {
        name: name,
        email: email,
    };

    User.register(userData, password, (err, user) => {
        if (err) {
            req.flash("error_msg", "Error: " + err);
            res.redirect("/signup");
        }
        passport.authenticate("local")(req, res, () => {
            req.flash("success_msg", "Account created successfully.");
            res.redirect("/login");
        });
    });
});

router.post("/forgot", (req, res, next) => {
    async.waterfall(
        [
            (done) => {
                crypto.randomBytes(30, (err, buf) => {
                    let token = buf.toString("hex");
                    done(err, token);
                });
            },
            (token, done) => {
                User.findOne({ email: req.body.email })
                    .then((user) => {
                        if (!user) {
                            req.flash("error_msg", "User does not exist with this email.");
                            return res.redirect("/forgot");
                        }
                        user.resetPasswordToken = token;
                        user.resetPasswordExpires = Date.now() + 1800000; // 30 phút
                        user.save()
                            .then(() => done(null, token, user))
                            .catch((err) => done(err));
                    })
                    .catch((err) => {
                        req.flash("error_msg", "Error: " + err);
                        res.redirect("/forgot");
                    });
            },
            (token, user) => {
                let smtpTransport = nodemailer.createTransport({
                    service: "Gmail",
                    host: "smtp.gmail.com",
                    port: 587,
                    secure: false,
                    auth: {
                        user: process.env.GMAIL_EMAIL,
                        pass: process.env.GMAIL_PASSWORD,
                    },
                });

                console.log("SMTP Config:", {
                    user: process.env.GMAIL_EMAIL,
                    pass: process.env.GMAIL_PASSWORD,
                });

                let mailOptions = {
                    to: user.email,
                    from: process.env.GMAIL_EMAIL,
                    subject: "Recovery Email from Auth Project",
                    text:
                        "Please click the following link to recover your password: \n\n" +
                        "http://" +
                        req.headers.host +
                        "/reset/" +
                        token +
                        "\n\n" +
                        "If you did not request this, please ignore this email.",
                };

                smtpTransport.sendMail(mailOptions, (err) => {
                    if (err) {
                        console.error("Send mail error:", err.message, "Full error:", err);
                        req.flash("error_msg", "Failed to send email: " + err.message);
                        return res.redirect("/forgot");
                    }
                    console.log("Email sent successfully to:", user.email);
                    req.flash("success_msg", "Email sent with further instructions. Please check that.");
                    res.redirect("/forgot");
                });
            },
        ],
        (err) => {
            if (err) {
                console.error("Waterfall error:", err);
                res.redirect("/forgot");
            }
        }
    );
});

module.exports = router;
