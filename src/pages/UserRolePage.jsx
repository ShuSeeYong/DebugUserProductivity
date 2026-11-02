import React, { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiUsers } from 'react-icons/fi'
import UserRoleModal from '../components/UserRoleModal'
import { productivityApi } from '../services/api'
import './UserRolePage.css'

// Map the API's UserProductivityAccessDTO into the shape the table uses
function mapRole(dto) {
  return {
    id: dto.userID ?? dto.UserID,
    ntLogin: dto.NTLogin ?? dto.ntLogin ?? '',
    empName: dto.EmployeeName ?? dto.employeeName ?? '',
    role: dto.roleName ?? dto.RoleName ?? '',
    site: dto.siteName ?? dto.SiteName ?? '',
    isActive: dto.isActive === true || dto.isActive === 'true',
    updatedBy: dto.updatedBy ?? dto.UpdatedBy ?? '',
    updatedDate: dto.updatedDate ?? dto.UpdatedDate ?? '',
  }
}

function UserRolePage({ currentUser = '' }) {
  const [roles, setRoles] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ ntLogin: '', empName: '', role: '', site: '', isActive: '' })

  const fetchRoles = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await productivityApi.getUserRoles()
      const list = Array.isArray(data) ? data : []
      setRoles(list.map(mapRole))
    } catch (err) {
      console.error('Error fetching user roles:', err)
      setError('Failed to load user roles. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  const filteredRoles = roles.filter(role => {
    if (filters.ntLogin && !role.ntLogin.toLowerCase().includes(filters.ntLogin.toLowerCase())) return false
    if (filters.empName && !role.empName.toLowerCase().includes(filters.empName.toLowerCase())) return false
    if (filters.role && role.role !== filters.role) return false
    if (filters.site && role.site !== filters.site) return false
    if (filters.isActive && String(role.isActive) !== filters.isActive) return false
    return true
  })

  const handleEdit = (role) => {
    setEditingRole(role)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingRole(null)
    setShowModal(true)
  }

  const handleSave = async (formData) => {
    try {
      await productivityApi.saveUserRole({
        userID: editingRole ? editingRole.id : undefined, // include only when editing
        ntLogin: formData.ntLogin,
        roleName: formData.role?.value,
        siteName: formData.site?.value,
        isActive: formData.isActive,
        createdBy: currentUser,
      })
      setShowModal(false)
      setEditingRole(null)
      fetchRoles()
    } catch (err) {
      console.error('Save role failed:', err)
      alert(err.message || 'Failed to save the user role. Please try again.')
    }
  }

  return (
    <div className="user-role-page">
      <div className="user-role-header">
        <div className="user-role-title">
          <FiUsers className="user-role-title-icon" />
          <h2>User Role</h2>
        </div>
        <button className="btn-action btn-add" onClick={handleAdd}>
          <FiPlus />
          <span>New User Role</span>
        </button>
      </div>

      <div className="user-role-table-wrapper">
        <table className="user-role-table">
          <thead>
            <tr>
              <th>
                <span>NT Login</span>
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Filter..."
                  value={filters.ntLogin}
                  onChange={(e) => setFilters(prev => ({ ...prev, ntLogin: e.target.value }))}
                />
              </th>
              <th>
                <span>Employee Name</span>
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Filter..."
                  value={filters.empName}
                  onChange={(e) => setFilters(prev => ({ ...prev, empName: e.target.value }))}
                />
              </th>
              <th>
                <span>Role</span>
                <select
                  className="filter-select"
                  value={filters.role}
                  onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="">Please Select</option>
                  <option value="Administrator">Administrator</option>
                  <option value="User">User</option>
                </select>
              </th>
              <th>
                <span>Site</span>
                <select
                  className="filter-select"
                  value={filters.site}
                  onChange={(e) => setFilters(prev => ({ ...prev, site: e.target.value }))}
                >
                  <option value="">Please Select</option>
                  <option value="ALL">ALL</option>
                  <option value="PEN">PEN</option>
                  <option value="PUN">PUN</option>
                  <option value="HCM">HCM</option>
                  <option value="JSP">JSP</option>
                </select>
              </th>
              <th>
                <span>Is Active</span>
                <select
                  className="filter-select"
                  value={filters.isActive}
                  onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
                >
                  <option value="">All</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </th>
              <th><span>Updated By</span></th>
              <th><span>Update Date</span></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#667eea' }}>Loading…</td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#c53030' }}>{error}</td></tr>
            )}
            {!loading && !error && filteredRoles.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No records found</td></tr>
            )}
            {!loading && filteredRoles.map((role) => (
              <tr key={role.id}>
                <td>{role.ntLogin}</td>
                <td>{role.empName}</td>
                <td>{role.role}</td>
                <td>{role.site}</td>
                <td>
                  <span className={`badge ${role.isActive ? 'badge-active' : 'badge-inactive'}`}>
                    {role.isActive ? 'Yes' : 'No'}
                  </span>
                </td>
                <td>{role.updatedBy}</td>
                <td>{role.updatedDate ? new Date(role.updatedDate).toLocaleDateString() : '—'}</td>
                <td>
                  <button className="edit-btn" title="Edit" onClick={() => handleEdit(role)}>
                    <FiEdit2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserRoleModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingRole(null); }}
        onSave={handleSave}
        roleData={editingRole}
      />
    </div>
  )
}

export default UserRolePage
