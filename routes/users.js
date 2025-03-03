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

router.post("/forgot", (req, res, next) => {
    async.waterfall(
        [
            // Bước 1: Tạo token ngẫu nhiên để reset mật khẩu
            (done) => {
                crypto.randomBytes(30, (err, buf) => {
                    let token = buf.toString("hex"); // Chuyển đổi thành chuỗi hex
                    done(err, token); // Truyền token hoặc lỗi sang bước tiếp theo
                });
            },
            // Bước 2: Tìm user và lưu token cùng thời gian hết hạn
            (token, done) => {
                User.findOne({ email: req.body.email }) // Tìm user theo email
                    .then((user) => {
                        if (!user) {
                            req.flash("error_msg", "User does not exist with this email.");
                            return res.redirect("/forgot");
                        }
                        user.resetPasswordToken = token; // Gán token cho user
                        user.resetPasswordExpires = Date.now() + 1800000; // Đặt thời gian hết hạn (30 phút)
                        user.save() // Lưu thay đổi vào database
                            .then(() => done(null, token, user)) // Thành công, truyền token và user
                            .catch((err) => done(err)); // Lỗi, truyền lỗi
                    })
                    .catch((err) => {
                        req.flash("error_msg", "Error: " + err);
                        res.redirect("/forgot");
                    });
            },
            // Bước 3: Cấu hình và gửi email chứa link reset
            (token, user) => {
                let smtpTransport = nodemailer.createTransport({
                    service: "Gmail", // Sử dụng dịch vụ Gmail
                    host: "smtp.gmail.com", // Host SMTP của Gmail
                    port: 587, // Port cho TLS
                    secure: false, // Không dùng SSL (dùng TLS)
                    auth: {
                        user: process.env.GMAIL_EMAIL,
                        pass: process.env.GMAIL_PASSWORD,
                    },
                    connectionTimeout: 10000, // Thời gian chờ kết nối (10 giây)
                    greetingTimeout: 5000, // Thời gian chờ chào hỏi (5 giây)
                });

                console.log("SMTP Config:", {
                    user: process.env.GMAIL_EMAIL,
                    pass: process.env.GMAIL_PASSWORD,
                });

                let mailOptions = {
                    to: user.email, // Địa chỉ nhận (email của user)
                    from: process.env.GMAIL_EMAIL, // Địa chỉ gửi (từ biến môi trường)
                    subject: "Recovery Email from Auth Project", // Tiêu đề email
                    text:
                        "Please click the following link to recover your password: \n\n" +
                        "http://" +
                        req.headers.host + // Host của server (ví dụ: localhost:3000)
                        "/reset/" +
                        token + // Link chứa token
                        "\n\n" +
                        "If you did not request this, please ignore this email.",
                };

                console.log("Mail Options:", mailOptions); // Log cấu hình email

                smtpTransport.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        console.error("Send mail error:", err.message, "Full error:", err);
                        req.flash("error_msg", "Failed to send email: " + err.message);
                        return res.redirect("/forgot");
                    }
                    console.log("Email sent successfully. Response:", info.response);
                    console.log("Email sent to:", user.email); // Log email nhận
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
