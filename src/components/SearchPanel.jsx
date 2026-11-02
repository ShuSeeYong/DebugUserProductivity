import React, { useState, useMemo } from 'react'
import Select from 'react-select'
import { FiSearch, FiRotateCcw } from 'react-icons/fi'
import './SearchPanel.css'

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: '12px',
    border: state.isFocused ? '2px solid #667eea' : '2px solid #e2e8f0',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(102, 126, 234, 0.1)' : 'none',
    padding: '4px 8px',
    fontSize: '14px',
    transition: 'all 0.2s',
    '&:hover': {
      borderColor: '#667eea',
    },
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
    zIndex: 9999,
  }),
  menuList: (base) => ({
    ...base,
    padding: '4px',
  }),
  placeholder: (base) => ({
    ...base,
    color: '#a0aec0',
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
}

const isActiveOptions = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]

function SearchPanel({ onSearch, onReset, activeSite, data }) {
  const [filters, setFilters] = useState({
    customer: null,
    employeeName: '',
    ntLogin: '',
    isActive: null,
  })

  // Build customer options from data
  const customerOptions = useMemo(() => {
    const uniqueCustomers = [...new Set(data.map(item => item.CustomerName).filter(Boolean))]
    return uniqueCustomers.sort().map(customer => ({
      value: customer,
      label: customer,
    }))
  }, [data])

  // Reset filters when site tab changes
  React.useEffect(() => {
    setFilters({ customer: null, employeeName: '', ntLogin: '', isActive: null })
  }, [activeSite])

  // Auto-filter on any change
  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value }
    setFilters(newFilters)
    onSearch(newFilters)
  }

  const handleReset = () => {
    setFilters({ customer: null, employeeName: '', ntLogin: '', isActive: null })
    onReset()
  }

  return (
    <div className="search-panel">
      <div className="search-panel-header">
        <FiSearch className="search-panel-icon" />
        <h2>Search</h2>
      </div>
      <div className="search-panel-body">
        <div className="search-field">
          <label className="search-label">Customer</label>
          <Select
            options={customerOptions}
            value={filters.customer}
            onChange={(val) => handleFilterChange('customer', val)}
            placeholder="Select customers..."
            isClearable
            isMulti
            styles={customSelectStyles}
            menuPortalTarget={document.body}
          />
        </div>
        <div className="search-field search-field-small">
          <label className="search-label">Employee Name</label>
          <input
            type="text"
            className="search-input"
            placeholder="Search name..."
            value={filters.employeeName}
            onChange={(e) => handleFilterChange('employeeName', e.target.value)}
          />
        </div>
        <div className="search-field search-field-small">
          <label className="search-label">NT Login</label>
          <input
            type="text"
            className="search-input"
            placeholder="Search NT Login..."
            value={filters.ntLogin}
            onChange={(e) => handleFilterChange('ntLogin', e.target.value)}
          />
        </div>
        <div className="search-field search-field-small">
          <label className="search-label">Is Active</label>
          <Select
            options={isActiveOptions}
            value={filters.isActive}
            onChange={(val) => handleFilterChange('isActive', val)}
            placeholder="All"
            isClearable
            styles={customSelectStyles}
            menuPortalTarget={document.body}
          />
        </div>
        <div className="search-actions">
          <button className="btn btn-secondary" onClick={handleReset}>
            <FiRotateCcw />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default SearchPanel
