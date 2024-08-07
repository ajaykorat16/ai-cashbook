import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ClientProvider } from './contexts/ClientContexts';

const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_MICROSOFT_CLIENT_ID,
    authority: process.env.REACT_APP_MICROSOFT_API,
    redirectUri: window.location.origin,
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <MsalProvider instance={msalInstance}>
        <AuthProvider>
          <ClientProvider>
            <App />
          </ClientProvider>
        </AuthProvider>
      </MsalProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);

