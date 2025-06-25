# Droppin Unified Frontend

This is a unified frontend system that automatically detects whether a user is on desktop or mobile and serves the appropriate version of the Droppin B2B delivery platform.

## Features

- **Automatic Device Detection**: Detects desktop, tablet, and mobile devices
- **Responsive Design**: Automatically switches between desktop and mobile versions
- **Real-time Switching**: Updates the interface when window is resized
- **Single Codebase**: Both versions are managed in one project
- **Brand Consistency**: Uses consistent brand colors (#f36325 orange, #004b6f dark blue)

## How It Works

The system uses multiple detection methods:

1. **User Agent Detection**: Checks for mobile/tablet user agents
2. **Touch Capability**: Detects touch screens
3. **Screen Size**: Uses responsive breakpoints
4. **Device Features**: Checks for mobile-specific features

### Device Detection Logic

- **Mobile**: Screen width ≤ 768px OR mobile user agent OR touch screen with small screen
- **Tablet**: Screen width 769px - 1024px OR tablet user agent OR touch screen with medium screen
- **Desktop**: Screen width > 1024px AND desktop user agent

## Project Structure

```
src/
├── desktop/           # Desktop version components
│   ├── pages/        # Desktop pages
│   ├── components/   # Desktop components
│   ├── context/      # Authentication context
│   └── services/     # API services
├── mobile/           # Mobile version components
│   ├── pages/        # Mobile pages
│   ├── components/   # Mobile components
│   ├── context/      # Authentication context
│   └── services/     # API services
├── utils/            # Shared utilities
│   └── deviceDetection.js  # Device detection logic
├── App.js            # Main App component with routing
└── index.js          # Entry point
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend server running

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the unified frontend:
```bash
./start-unified.sh
```

Or manually:
```bash
npm start
```

3. Access the application:
   - **URL**: http://localhost:3000
   - The app will automatically detect your device and show the appropriate version

### Development

- **Desktop Development**: Resize your browser window to > 1024px
- **Mobile Development**: Resize your browser window to ≤ 768px or use browser dev tools
- **Tablet Development**: Resize your browser window to 769px - 1024px

## Available Scripts

- `npm start` - Start the development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run dev` - Start both frontend and backend (if backend is in the same repo)

## Device Detection API

The system provides several utility functions:

```javascript
import { 
  isMobileDevice, 
  isTabletDevice, 
  getDeviceType, 
  shouldUseMobileVersion,
  useResponsive 
} from './utils/deviceDetection';

// Check if current device is mobile
const isMobile = isMobileDevice();

// Get device type ('mobile', 'tablet', 'desktop')
const deviceType = getDeviceType();

// Check if mobile version should be used
const useMobile = shouldUseMobileVersion();

// Responsive hook for React components
const { isMobile, isTablet, isDesktop, screenSize } = useResponsive();
```

## Routing

The unified system uses React Router with automatic routing based on device type:

- **Public Routes**: Home, Login, Register, Package Tracking
- **Protected Routes**: User Dashboard, Shop Dashboard, Driver Dashboard, Admin Dashboard
- **Automatic Redirects**: Based on user role and device type

## Brand Colors

The system uses consistent brand colors throughout:

- **Primary Orange**: #f36325
- **Secondary Dark Blue**: #004b6f
- **White**: #ffffff

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile, etc.)

## Troubleshooting

### Common Issues

1. **Device detection not working**: Clear browser cache and reload
2. **Styling issues**: Check if CSS files are properly imported
3. **Routing problems**: Ensure all route components are properly imported

### Debug Mode

To debug device detection, open browser console and check:

```javascript
// Check current device type
console.log('Device Type:', getDeviceType());

// Check if mobile version should be used
console.log('Use Mobile:', shouldUseMobileVersion());
```

## Contributing

When adding new features:

1. Add components to both `desktop/` and `mobile/` directories
2. Update routing in `App.js`
3. Test on both desktop and mobile viewports
4. Ensure brand colors are consistent
5. Update this README if needed

## License

This project is part of the Droppin B2B delivery platform. 