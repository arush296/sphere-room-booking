import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import RoomList from './components/RoomList';
import BookingForm from './components/BookingForm';
import MyBookings from './components/MyBookings';
import AdminApproval from './components/AdminApproval';
import './App.css';

const GOOGLE_TOKEN_STORAGE_KEY = 'googleIdToken';
const ADMIN_EMAIL = 'f20240199@goa.bits-pilani.ac.in';

function App() {
  const [currentView, setCurrentView] = useState('rooms');
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL;
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const isAdmin = studentId.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const setAxiosAuthHeader = useCallback((token) => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      return;
    }

    delete axios.defaults.headers.common.Authorization;
  }, []);

  const clearAuthState = useCallback(() => {
    setStudentId('');
    setUser(null);
    localStorage.removeItem(GOOGLE_TOKEN_STORAGE_KEY);
    setAxiosAuthHeader('');
  }, [setAxiosAuthHeader]);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/rooms`);
      setRooms(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load rooms');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  const handleGoogleSignIn = useCallback(async (credential) => {
    try {
      setAuthLoading(true);
      const response = await axios.post(`${API_URL}/auth/google-login`, { credential });
      const signedInUser = response.data.user;

      setStudentId(signedInUser.email);
      setUser(signedInUser);
      localStorage.setItem(GOOGLE_TOKEN_STORAGE_KEY, credential);
      setAxiosAuthHeader(credential);
      setError('');
    } catch (err) {
      clearAuthState();
      setError(err.response?.data?.error || 'Google sign-in failed');
    } finally {
      setAuthLoading(false);
    }
  }, [API_URL, clearAuthState, setAxiosAuthHeader]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    const savedToken = localStorage.getItem(GOOGLE_TOKEN_STORAGE_KEY);
    if (!savedToken) return;

    // Decode JWT to get user info without backend verification
    try {
      const base64Url = savedToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);
      
      // Check if token is not expired and email is valid
      const expiryTime = payload.exp * 1000;
      if (expiryTime > Date.now() && payload.email?.endsWith('@goa.bits-pilani.ac.in')) {
        // Token is still valid, restore session
        setStudentId(payload.email);
        setUser({
          googleId: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture
        });
        setAxiosAuthHeader(savedToken);
        setError('');
        return;
      }
    } catch (err) {
      console.error('Error decoding saved token:', err);
    }

    // If token is invalid or expired, clear auth state
    clearAuthState();
  }, [clearAuthState, setAxiosAuthHeader]);

  useEffect(() => {
    if (window.google?.accounts?.id) {
      setGoogleReady(true);
      return;
    }

    const intervalId = setInterval(() => {
      if (window.google?.accounts?.id) {
        setGoogleReady(true);
        clearInterval(intervalId);
      }
    }, 250);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Force dark mode and clear any previously saved light preference.
    localStorage.setItem('theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  useEffect(() => {
    if (studentId || !GOOGLE_CLIENT_ID || !googleReady) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: ({ credential }) => handleGoogleSignIn(credential)
    });

    const signInContainer = document.getElementById('google-signin-button');
    if (signInContainer) {
      signInContainer.innerHTML = '';
      window.google.accounts.id.renderButton(signInContainer, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        width: 280
      });
    }
  }, [GOOGLE_CLIENT_ID, googleReady, handleGoogleSignIn, studentId]);

  const handleBookingSuccess = () => {
    setSelectedRoom(null);
    setCurrentView('mybookings');
  };

  const handleSignOut = () => {
    clearAuthState();
    setSelectedRoom(null);
    setCurrentView('rooms');
  };

  if (!studentId) {
    return (
      <div className="auth-page">
        <div className="auth-page-card">
          <h1>Sphere</h1>
          <p className="auth-page-subtitle">Room Booking Portal</p>
          <p className="auth-page-help">Sign in with your BITS Goa account to continue.</p>

          {error && <div className="error-message">{error}</div>}
          {authLoading && <div className="loading">Authenticating with Google...</div>}
          {!googleReady && <p className="signin-loading">Loading Google sign-in...</p>}

          <div className="auth-google-button" id="google-signin-button" />
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-top">
          <h1>Sphere - Room Booking</h1>
        </div>
        <div className="header-controls">
          <div className="user-session-card">
            <div className="user-session-info">
              <p className="user-name">{user?.name || 'Signed in user'}</p>
              <p className="user-email">{studentId}</p>
            </div>
            <button className="logout-button" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <nav className="app-nav">
        <button
          className={`nav-button ${currentView === 'rooms' ? 'active' : ''}`}
          onClick={() => { setCurrentView('rooms'); setSelectedRoom(null); }}
          disabled={!studentId}
        >
          Browse Rooms
        </button>
        <button
          className={`nav-button ${currentView === 'mybookings' ? 'active' : ''}`}
          onClick={() => setCurrentView('mybookings')}
          disabled={!studentId}
        >
          My Bookings
        </button>
        {isAdmin && (
          <button
            className={`nav-button admin-button ${currentView === 'admin' ? 'active' : ''}`}
            onClick={() => { setCurrentView('admin'); setSelectedRoom(null); }}
          >
            ⚙️ Admin Panel
          </button>
        )}
      </nav>

      <main className="app-main">
        {error && <div className="error-message">{error}</div>}
        {loading && <div className="loading">Loading...</div>}
        {authLoading && <div className="loading">Authenticating with Google...</div>}

        {studentId && !selectedRoom && currentView === 'rooms' && (
          <RoomList
            rooms={rooms}
            onSelectRoom={setSelectedRoom}
            loading={loading}
          />
        )}

        {studentId && selectedRoom && currentView === 'rooms' && (
          <BookingForm
            room={selectedRoom}
            studentId={studentId}
            onBack={() => setSelectedRoom(null)}
            onBookingSuccess={handleBookingSuccess}
          />
        )}

        {studentId && currentView === 'mybookings' && (
          <MyBookings studentId={studentId} />
        )}

        {studentId && isAdmin && currentView === 'admin' && (
          <AdminApproval
            rooms={rooms}
            onRoomUpdated={fetchRooms}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>&copy; 2026 Sphere. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
