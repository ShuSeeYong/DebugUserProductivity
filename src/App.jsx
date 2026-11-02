import React, { useState, useMemo, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import ProductivityPage from './pages/ProductivityPage'
import UserRolePage from './pages/UserRolePage'
import AccessDenied from './pages/AccessDenied'
import { productivityApi } from './services/api'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [justLoggedIn, setJustLoggedIn] = useState(false)
  const [userRoles, setUserRoles] = useState([])
  const [rolesLoading, setRolesLoading] = useState(true)
  const navigate = useNavigate()

  // Load user roles from the API (source of truth for permissions)
  useEffect(() => {
    let cancelled = false
    productivityApi.getUserRoles()
      .then(data => {
        if (cancelled) return
        const list = Array.isArray(data) ? data : []
        setUserRoles(list.map(dto => ({
          ntLogin: dto.NTLogin ?? dto.ntLogin ?? '',
          empName: dto.EmployeeName ?? dto.employeeName ?? '',
          role: dto.roleName ?? dto.RoleName ?? '',
          site: dto.siteName ?? dto.SiteName ?? '',
          isActive: dto.isActive === true || dto.isActive === 'true',
        })))
      })
      .catch(err => console.error('Failed to load user roles:', err))
      .finally(() => { if (!cancelled) setRolesLoading(false) })
    return () => { cancelled = true }
  }, [])

  const handleLogin = (data) => {
    setUser({
      ntLogin: data.ntLogin,
      name: data.name || data.ntLogin,
    })
    setJustLoggedIn(true)
  }

  // Navigate to home after login
  useEffect(() => {
    if (justLoggedIn && user) {
      navigate('/', { replace: true })
      setJustLoggedIn(false)
    }
  }, [justLoggedIn, user, navigate])

  const handleLogout = () => {
    setUser(null)
    navigate('/', { replace: true })
  }

  // Check user role after login (resolved from the API-loaded roles)
  const userRole = useMemo(() => {
    if (!user) return null
    return userRoles.find(r =>
      r.ntLogin.toLowerCase() === user.ntLogin.toLowerCase() && r.isActive
    )
  }, [user, userRoles])

  // Show login page if not logged in
  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  // Wait for roles to load before deciding access (avoids a false "access denied")
  if (rolesLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#667eea' }}>
        Loading…
      </div>
    )
  }

  // Show access denied if user not in role list
  if (!userRole) {
    return <AccessDenied user={user} onLogout={handleLogout} />
  }

  // Determine which sites the user can see
  const allowedSite = userRole.site // 'ALL' or specific site like 'PEN'
  const isAdmin = userRole.role === 'Administrator'

  return (
    <div className="app">
      <Navbar user={user} onLogout={handleLogout} isAdmin={isAdmin} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<ProductivityPage allowedSite={allowedSite} currentUser={userRole.empName || user.name || user.ntLogin} />} />
          {isAdmin && <Route path="/user-role" element={<UserRolePage currentUser={userRole.empName || user.name || user.ntLogin} />} />}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
