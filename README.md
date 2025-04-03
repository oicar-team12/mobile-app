# ShiftSync - Mobile App

ShiftSync is a shift scheduling application designed to modernize shift management for businesses like restaurants, cafes, and retail shops. This repository contains the mobile app for employees to view their schedules and mark their availability.

## Features

- **Authentication:** Secure login for employees
- **Schedule Viewing:** Easily view assigned shifts on a weekly calendar
- **Availability Marking:** Mark when you're available to work using an intuitive interface

## Technology Stack

- React Native
- Expo
- React Navigation

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```
4. Use the Expo Go app on your iOS or Android device to scan the QR code and run the app

## Project Structure

```
src/
  ├── assets/         # Images, fonts, and other static assets
  ├── components/     # Reusable UI components
  ├── navigation/     # Navigation configuration
  └── screens/        # Application screens
```

## Development Roadmap

- Implement notification system for new shifts
- Add profile management
- Integrate with backend API for real data
- Implement shift swapping functionality
