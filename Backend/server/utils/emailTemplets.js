// Welcome Email
exports.welcomeEmail = (name) => ({
  subject: "Welcome to AirWrite 🎉",
  html: `
    <h2>Welcome ${name} 👋</h2>
    <p>Your account has been created successfully.</p>
  `
});

// Verify Code Email
exports.verifyEmailTemplate = (name, code) => ({
  subject: "Verify Your Email",
  html: `
    <h2>Hello ${name}</h2>
    <p>Your verification code is:</p>
    <h1>${code}</h1>
    <p>Expires in 5 minutes</p>
  `
});

// Reset Password Email
exports.resetPasswordTemplate = (name, code) => ({
  subject: "Reset Your Password 🔐",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #f9f9f9;">
      <h2 style="color:#4F46E5;">Hello ${name},</h2>
      <p>You requested to reset your password.</p>
      <p>Your password reset code is:</p>
      <h1 style="color:#4F46E5;">${code}</h1>
      <p style="margin-top:20px;">Click the button below to reset your password:</p>
      <a href="http://localhost:5173/reset-password?code=${code}" 
         style="display:inline-block; padding:12px 25px; background-color:#4F46E5; color:#fff; text-decoration:none; border-radius:8px; font-weight:bold; margin-top:10px;">
        Reset Password
      </a>
      <p style="margin-top:20px; color:#555; font-size:12px;">This link and code will expire in 5 minutes.</p>
    </div>
  `,
});