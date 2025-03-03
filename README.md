Authentication Project
Description
This is a simple web application built using Node.js and Express for user authentication management. The application includes features such as user registration, login, logout, password recovery, and password change.

Technologies Used
Node.js: Runtime environment for running the application.

Express: Framework for building the web application.

MongoDB: Database for storing user information.

Passport.js: Authentication library for user verification.

Nodemailer: Sending confirmation and password recovery emails.

EJS: Template engine for rendering HTML pages.

Key Features
Registration: Users can create a new account by registering with their email and password.

Login: Users can log in to the system using their email and password.

Logout: Users can securely log out of their accounts.

Password Recovery: Users can reset their password by requesting a password reset link via email.

Password Change: Authenticated users can change their password from the dashboard.
Usage
Sign Up: Navigate to /signup to create a new account.

Log In: Navigate to /login to access your account.

Dashboard: Access /dashboard after logging in to view your profile.

Forgot Password: Navigate to /forgot to request a password reset link.

Change Password: Access /password/change to update your password.

Notes
Ensure MongoDB is running locally or update the DATABASE_LOCAL variable to your MongoDB connection string.

Configure Nodemailer with a valid Gmail account for sending emails.

License
This project is open-source and available under the MIT License.
