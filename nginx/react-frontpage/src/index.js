import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <GoogleOAuthProvider
    clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
    redirectUri="https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=630680641146-iuvf396a3ac4sn178t6sc3bkg83u3t10.apps.googleusercontent.com&redirect_uri=http://treenut.ddns.net:8080/server/user/oauth/callback/google&scope=openid%20email%20profile&access_type=offline"
  >
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </GoogleOAuthProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
