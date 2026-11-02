import React from 'react'
import { FiAlertCircle, FiLogOut } from 'react-icons/fi'

function AccessDenied({ user, onLogout }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f0f4f8',
      padding: '20px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '48px 40px',
        maxWidth: '440px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: '#fef2f2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <FiAlertCircle size={32} color="#dc2626" />
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1a202c', marginBottom: '12px' }}>
          Access Denied
        </h2>

        <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.7', marginBottom: '8px' }}>
          You are not able to access this page.
        </p>
        <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.7', marginBottom: '28px' }}>
          Please contact your administrator to grant you access.
        </p>

        <button
          onClick={onLogout}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: '#f1f5f9',
            color: '#475569',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
          }}
        >
          <FiLogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}

export default AccessDenied
