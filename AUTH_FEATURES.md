# Mobile App - Login & Registration

A React Native mobile application built with Expo and Expo Router, featuring login and registration functionality.

## Project Structure

```
app/
├── (auth)/              # Authentication screens group
│   ├── login.tsx        # Login screen
│   ├── register.tsx     # Registration screen
│   ├── index.tsx        # Auth redirect to login
│   └── _layout.tsx      # Auth navigation layout
├── (tabs)/              # Tab-based navigation (for future authenticated screens)
├── _layout.tsx          # Root layout
└── modal.tsx            # Modal component
```

## Features

### Login Screen
- Email and password input fields
- Email validation
- Simple login simulation with loading state
- Link to registration screen
- Forgot password button (placeholder)

### Registration Screen
- Full name input
- Email and password input fields
- Password confirmation field
- Form validation:
  - All fields required
  - Valid email format
  - Password minimum 6 characters
  - Password confirmation match
- Link back to login screen

## Getting Started

### Prerequisites
- Node.js and npm installed
- Expo CLI (optional, but recommended)

### Installation

1. Navigate to the project directory:
```bash
cd MobileApp
```

2. Install dependencies (already done):
```bash
npm install
```

### Running the App

#### Development Server
```bash
npm start
```

This will start the Expo development server. You'll see a QR code in the terminal.

#### Android
```bash
npm run android
```

#### iOS
```bash
npm run ios
```
(Requires macOS with Xcode installed)

#### Web
```bash
npm run web
```

## Technologies Used

- **React Native** - Cross-platform mobile development
- **Expo** - Framework for building React Native apps
- **Expo Router** - File-based routing for React Native
- **React Navigation** - Navigation library
- **TypeScript** - Type-safe JavaScript

## Default Behavior

The app starts with the login screen. Users can:
1. Enter credentials and click "Login" to simulate authentication
2. Click "Sign Up" to navigate to the registration screen
3. From registration, enter details and create an account
4. After successful registration, navigate back to login

## Future Enhancements

- Backend authentication integration
- User state management (Context API or Redux)
- Home/Dashboard screen for authenticated users
- Password recovery functionality
- OAuth integration (Google, GitHub, etc.)
- Email verification
- Session management
- Splash screen customization
- App icons and branding

## Notes

- This is a starter template with basic UI and form validation
- The login/registration API calls are simulated with timeouts
- To integrate with a real backend, replace the setTimeout calls with actual API requests
- All form data is stored in local component state; consider using a state management solution for production apps

## License

MIT
