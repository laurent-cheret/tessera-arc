import React, { useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';  // FIXED: Named import instead of default
import './TurnstileVerification.css';

const TurnstileVerification = ({ onVerified, onError }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);

  const handleSuccess = (token) => {
    setIsVerifying(true);
    
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    fetch(`${API_URL}/api/verify-turnstile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
      .then(res => res.json())
      .then(data => {
        setIsVerifying(false);
        if (data.success) {
          onVerified(data.sessionId);
        } else {
          setError('Verification failed. Please try again.');
          onError('Turnstile verification failed');
        }
      })
      .catch(err => {
        setIsVerifying(false);
        setError('Network error. Please try again.');
        onError(err.message);
      });
  };

  const handleError = (error) => {
    setError('Verification widget failed to load.');
    onError(error);
  };

  return (
    <div className="turnstile-container">
      <div className="turnstile-card">
        <h2>🛡️ Verify You're Human</h2>
        <p>Please complete this quick verification to continue.</p>
        
        <div className="turnstile-widget">
          <Turnstile
            siteKey={process.env.REACT_APP_TURNSTILE_SITE_KEY}
            onSuccess={handleSuccess}
            onError={handleError}
            options={{
              theme: 'light',
              size: 'normal',
            }}
          />
        </div>

        {isVerifying && (
          <div className="verifying-message">
            <div className="spinner"></div>
            <p>Verifying...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <div className="privacy-note">
          <small>
            🔒 Your privacy is protected. This verification helps us prevent spam.
          </small>
        </div>
      </div>
    </div>
  );
};

export default TurnstileVerification;