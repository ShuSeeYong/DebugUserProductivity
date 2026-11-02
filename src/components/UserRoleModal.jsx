import React, { useState, useEffect } from 'react'
import Select from 'react-select'
import { FiX, FiSearch, FiSave } from 'react-icons/fi'

import EmployeeSearchModal from './EmployeeSearchModal'
import './AddModal.css'

const roleOptions = [
  { value: 'Administrator', label: 'Administrator' },
  { value: 'User', label: 'User' },
]

const siteOptions = [
  { value: 'ALL', label: 'ALL' },
  { value: 'PEN', label: 'PEN' },
  { value: 'PUN', label: 'PUN' },
  { value: 'HCM', label: 'HCM' },
  { value: 'JSP', label: 'JSP' },
]

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: '12px',
    border: state.isFocused ? '2px solid #667eea' : '2px solid #e2e8f0',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(102, 126, 234, 0.1)' : 'none',
    padding: '4px 8px',
    fontSize: '14px',
    transition: 'all 0.2s',
    '&:hover': { borderColor: '#667eea' },
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#667eea' : state.isFocused ? '#f0f4ff' : '#fff',
    color: state.isSelected ? '#fff' : '#1a202c',
    borderRadius: '8px',
    margin: '2px 4px',
    padding: '10px 12px',
    fontSize: '14px',
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    padding: '4px',
    zIndex: 99999,
    overflow: 'hidden',
  }),
  menuList: (base) => ({
    ...base,
    overflowX: 'hidden',
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 99999,
  }),
  placeholder: (base) => ({
    ...base,
    color: '#a0aec0',
  }),
}

function UserRoleModal({ isOpen, onClose, onSave, roleData }) {
  const isEdit = !!roleData
  const [formData, setFormData] = useState({
    ntLogin: '',
    empName: '',
    role: null,
    site: null,
    isActive: true,
  })
  const [showEmpSearch, setShowEmpSearch] = useState(false)

  useEffect(() => {
    if (roleData) {
      setFormData({
        ntLogin: roleData.ntLogin || '',
        empName: roleData.empName || '',
        role: roleOptions.find(o => o.value === roleData.role) || null,
        site: siteOptions.find(o => o.value === roleData.site) || null,
        isActive: roleData.isActive !== undefined ? roleData.isActive : true,
      })
    } else {
      setFormData({ ntLogin: '', empName: '', role: null, site: null, isActive: true })
    }
  }, [roleData, isOpen])

  if (!isOpen) return null

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    onSave(formData)
  }

  const handleEmployeeSelect = (emp) => {
    const login = emp.ntLogin ?? emp.NTLogin ?? emp.ntlogin ?? ''
    const name = emp.displayName ?? emp.DisplayName ?? emp.employeeName ?? emp.EmployeeName ?? ''
    setFormData(prev => ({ ...prev, ntLogin: login, empName: name }))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'User Role Edit' : 'Add New User Role'}</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Add mode: NT Login with Search */}
          {!isEdit && (
            <div className="form-group">
              <label className="form-label">NT Login</label>
              <div className="input-with-button">
                <input
                  type="text"
                  className="form-input"
                  value={formData.ntLogin}
                  onChange={(e) => handleChange('ntLogin', e.target.value)}
                  placeholder="Enter NT Login..."
                />
                <button className="btn-inline-search" type="button" onClick={() => setShowEmpSearch(true)}>
                  <FiSearch size={16} />
                  <span>Search</span>
                </button>
              </div>
            </div>
          )}

          {/* Edit mode: NT Login read-only */}
          {isEdit && (
            <div className="form-group">
              <label className="form-label">NT Login</label>
              <input
                type="text"
                className="form-input"
                value={formData.ntLogin}
                readOnly
                style={{ background: '#f7fafc', color: '#64748b' }}
              />
            </div>
          )}

          {/* Edit mode: Employee Name read-only */}
          {isEdit && (
            <div className="form-group">
              <label className="form-label">Employee Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.empName}
                readOnly
                style={{ background: '#f7fafc', color: '#64748b' }}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Role</label>
            <Select
              options={roleOptions}
              value={formData.role}
              onChange={(val) => handleChange('role', val)}
              placeholder="Select role..."
              styles={customSelectStyles}
              menuPortalTarget={document.body}
              menuPlacement="auto"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Site</label>
            <Select
              options={siteOptions}
              value={formData.site}
              onChange={(val) => handleChange('site', val)}
              placeholder="Select site..."
              styles={customSelectStyles}
              menuPortalTarget={document.body}
              menuPlacement="auto"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Is Active</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="roleIsActive"
                  checked={formData.isActive === true}
                  onChange={() => handleChange('isActive', true)}
                />
                <span className="radio-custom"></span>
                <span>Yes</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="roleIsActive"
                  checked={formData.isActive === false}
                  onChange={() => handleChange('isActive', false)}
                />
                <span className="radio-custom"></span>
                <span>No</span>
              </label>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-modal btn-modal-save" onClick={handleSave}>
            <FiSave size={16} />
            <span>Save</span>
          </button>
          <button className="btn-modal btn-modal-cancel" onClick={onClose}>
            <span>Cancel</span>
          </button>
        </div>
      </div>

      <EmployeeSearchModal
        isOpen={showEmpSearch}
        onClose={() => setShowEmpSearch(false)}
        onSelect={handleEmployeeSelect}
        initialLogin={formData.ntLogin}
      />
    </div>
  )
}

export default UserRoleModal
