// src/components/LoginButton.js
import React from 'react';
import { useAuth } from '../AuthContext';

function LoginButton() {
  const { login } = useAuth();

  return (
    <div>
      <button onClick={login} className="btn btn-primary">
        Login with Auth0
      </button>
    </div>
  );
}

export default LoginButton;
