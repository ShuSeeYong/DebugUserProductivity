import React, { useState } from 'react'
import { FiUser, FiLock } from 'react-icons/fi'
import { loginWithSoap } from '../services/auth'
import './LoginPage.css'

function LoginPage({ onLogin }) {
  const [ntLogin, setNtLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!ntLogin.trim() || !password.trim()) {
      setError('Please enter both NT Login and Password.')
      return
    }

    setLoading(true)
    try {
      const data = await loginWithSoap(ntLogin.trim(), password)
      if (data.success) {
        onLogin(data)
      } else {
        setError(data.message || 'Invalid user name or password.')
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to the server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Left panel - dark blue with logo */}
      <div className="login-left">
        {/* Floating balloons */}
        <div className="login-balloons">
          <div className="balloon b1"></div>
          <div className="balloon b2"></div>
          <div className="balloon b3"></div>
          <div className="balloon b4"></div>
          <div className="balloon b5"></div>
          <div className="balloon b6"></div>
        </div>

        <div className="login-left-content">
          <img src={`${import.meta.env.BASE_URL}DebugLogoW.png`} alt="Debug User Productivity" className="login-left-logo" />
          <h2>Productivity Tracking System</h2>
        </div>
        <div className="login-left-footer">
          &copy; {new Date().getFullYear()} Jabil Inc. &middot; Penang Engineering
        </div>
      </div>

      {/* Right panel - clean white form */}
      <div className="login-right">
        <div className="login-right-content">
          <h2>Welcome</h2>
          <p className="login-subtitle">Sign in to your account</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <div className="login-field-input">
                <FiUser className="login-field-icon" />
                <input
                  type="text"
                  value={ntLogin}
                  onChange={(e) => setNtLogin(e.target.value)}
                  placeholder="Enter your NT Login"
                  autoFocus
                />
              </div>
            </div>

            <div className="login-field">
              <div className="login-field-input">
                <FiLock className="login-field-icon" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? <span className="login-spinner"></span> : <span>Sign In</span>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
