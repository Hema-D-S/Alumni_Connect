# Email Setup for Password Reset Functionality

## Gmail App Password Setup

To enable password reset emails, you need to set up a Gmail App Password:

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account settings: https://myaccount.google.com/
2. Click "Security" in the left sidebar
3. Under "Signing in to Google", click "2-Step Verification"
4. Follow the prompts to enable 2FA if not already enabled

### Step 2: Generate App Password

1. Go back to Security settings
2. Under "Signing in to Google", click "App passwords"
3. Select "Mail" as the app and "Other (custom name)" as device
4. Enter "Alumni Connect" as the custom name
5. Click "Generate"
6. Copy the 16-character password (no spaces)

### Step 3: Update Backend Environment Variables

Update your `backend/.env` file:

```env
# Replace with your actual Gmail address
EMAIL_USER=your-email@gmail.com

# Replace with the app password from Step 2
EMAIL_PASS=your-16-character-app-password
```

### Step 4: Update Frontend URL (Production)

For production deployment, update the `FRONTEND_URL` in your backend environment:

```env
# For local development
FRONTEND_URL=http://localhost:5173

# For production (update with your actual Vercel URL)
FRONTEND_URL=https://your-vercel-app.vercel.app
```

## Testing the Functionality

### Local Testing:

1. Start your backend server: `npm start`
2. Start your frontend: `npm run dev`
3. Go to the login page and click "Forgot your password?"
4. Enter your email and click "Send Reset Link"
5. Check your email for the reset link
6. Click the link to reset your password

### Common Issues:

1. **"Authentication failed" error:**

   - Make sure 2FA is enabled
   - Double-check the app password (no spaces)
   - Verify EMAIL_USER and EMAIL_PASS in .env

2. **Email not received:**

   - Check spam/junk folder
   - Verify the email address exists in your database
   - Check backend console for error messages

3. **Invalid reset token:**
   - Tokens expire after 1 hour
   - Each token can only be used once
   - Request a new reset if needed

## Security Features

- Reset tokens are hashed before storing in database
- Tokens expire after 1 hour
- Tokens are single-use only
- User-friendly error messages
- Email validation

## Production Deployment

For production, make sure to:

1. Update FRONTEND_URL to your production domain
2. Use environment variables in your hosting platform
3. Keep email credentials secure
4. Consider using a dedicated email service for high volume

The password reset system is now fully functional with email sending capabilities!
