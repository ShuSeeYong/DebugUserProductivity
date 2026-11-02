import React from 'react'
import { NavLink } from 'react-router-dom'
import { FiUser, FiActivity, FiUsers, FiLogOut } from 'react-icons/fi'
import './Navbar.css'

function Navbar({ user, onLogout, isAdmin }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          <div className="navbar-logo">
            <img src={`${import.meta.env.BASE_URL}debug_IconW.png`} alt="" className="logo-icon-img" />
            <span className="logo-text">Debug User Productivity</span>
          </div>
          <div className="navbar-nav">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`} end>
              <FiActivity size={16} />
              <span>Productivity</span>
            </NavLink>
            {isAdmin && (
              <NavLink to="/user-role" className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
                <FiUsers size={16} />
                <span>User Role</span>
              </NavLink>
            )}
          </div>
        </div>
        <div className="navbar-right">
          <div className="user-info">
            <div className="user-avatar">
              <FiUser />
            </div>
            <span className="user-name">{user?.name || 'User'}</span>
          </div>
          <button className="logout-btn" onClick={onLogout} title="Sign Out">
            <FiLogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
