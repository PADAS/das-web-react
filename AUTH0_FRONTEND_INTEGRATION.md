# Auth0 Frontend Integration

This document describes the frontend Auth0 integration that has been implemented in the EarthRanger React application.

## Overview

The frontend now supports Auth0 authentication alongside the existing form-based authentication. The integration uses backend endpoints to handle the Auth0 OAuth flow, avoiding React SDK compatibility issues.

## Features Implemented

### 1. Auth0 Login Button
- Added "Sign in with Auth0" button to the login page
- Only shows when `REACT_APP_AUTH0_ENABLED=true`
- Styled with Bootstrap components and custom CSS

### 2. Auth0 Callback Handling
- Created `Auth0Callback` component to handle Auth0 redirects
- Processes authorization code and state parameters
- Exchanges code for backend tokens using existing authentication flow
- Handles errors gracefully with redirects back to login

### 3. Environment Configuration
- Added `REACT_APP_AUTH0_ENABLED` environment variable
- Controls whether Auth0 button is displayed

## Files Modified

### Core Components
- `src/Login/index.js` - Added Auth0 button and handler
- `src/Login/styles.module.scss` - Added Auth0 button styling
- `src/Auth0Callback/index.js` - New component for handling Auth0 callbacks
- `src/index.js` - Added Auth0 callback route

### Authentication
- `src/ducks/auth.js` - Added Auth0 action creators
- `src/constants/index.js` - Added Auth0 environment variable

### Translations
- `public/locales/en-US/login.json` - Added Auth0 button text

## Environment Variables

Add these to your environment configuration:

```bash
# Enable Auth0 authentication
REACT_APP_AUTH0_ENABLED=true
```

## Backend Requirements

The frontend expects these backend endpoints to be implemented:

1. **GET /auth/auth0/login** - Initiates Auth0 OAuth flow
2. **POST /auth/auth0/callback** - Handles Auth0 callback and returns tokens

See `BACKEND_AUTH0_INTEGRATION.md` for detailed backend implementation.

## Usage

1. Set `REACT_APP_AUTH0_ENABLED=true` in your environment
2. Implement the required backend endpoints
3. Configure Auth0 dashboard with correct callback URLs
4. Users will see "Sign in with Auth0" button on login page
5. Clicking the button redirects to Auth0 for authentication
6. After successful authentication, users are redirected back and logged in

## Routes

- `/login` - Login page with Auth0 button (when enabled)
- `/auth0/callback` - Auth0 callback handler

## Error Handling

The integration handles various error scenarios:
- Missing authorization code or state
- Auth0 authentication errors
- Backend callback failures
- Network errors

All errors redirect back to the login page with appropriate error messages.

## Security Considerations

- State parameter is used for CSRF protection
- Tokens are handled server-side, not in the frontend
- No Auth0 secrets are exposed in the frontend
- Uses existing authentication infrastructure

## Testing

1. Start your backend with Auth0 endpoints implemented
2. Set `REACT_APP_AUTH0_ENABLED=true`
3. Navigate to the login page
4. Click "Sign in with Auth0"
5. Complete Auth0 authentication
6. Verify successful login and redirect to main app

## Benefits

- **No React SDK Issues**: Avoids compatibility problems with Auth0 React SDK
- **Existing Infrastructure**: Uses current authentication system
- **Security**: Server-side token handling
- **Flexibility**: Easy to enable/disable via environment variable
- **Maintainability**: Clean separation of concerns
