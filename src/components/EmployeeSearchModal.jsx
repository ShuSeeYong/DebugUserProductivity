import React, { useState } from 'react'
import { FiX, FiSearch } from 'react-icons/fi'
import { productivityApi } from '../services/api'
import './EmployeeSearchModal.css'

function EmployeeSearchModal({ isOpen, onClose, onSelect, initialLogin = '' }) {
  const [searchTerm, setSearchTerm] = useState(initialLogin)
  const [results, setResults] = useState([])
  const [selectedRow, setSelectedRow] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)

  // Reset to a clean state every time the modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSearchTerm('')
      setResults([])
      setSelectedRow(null)
      setError(null)
      setSearched(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    setLoading(true)
    setError(null)
    setSelectedRow(null)
    try {
      const data = await productivityApi.searchEmployee(searchTerm.trim())
      const list = Array.isArray(data) ? data : (data ? [data] : [])
      setResults(list)
      setSearched(true)
    } catch (err) {
      console.error('Employee search failed:', err)
      setError('Failed to search. Please try again.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleSelect = () => {
    if (selectedRow) {
      onSelect(selectedRow)
      onClose()
    }
  }

  // Normalize field names from the API (handles different casings)
  const getLogin = (row) => row.ntLogin ?? row.NTLogin ?? row.ntlogin ?? ''
  const getName = (row) => row.displayName ?? row.DisplayName ?? row.employeeName ?? row.EmployeeName ?? ''
  const getTitle = (row) => row.jobTitle ?? row.JobTitle ?? row.title ?? ''

  return (
    <div className="emp-modal-overlay" onClick={onClose}>
      <div className="emp-modal-container" onClick={e => e.stopPropagation()}>
        <div className="emp-modal-header">
          <h2>User Productivity Employee Search</h2>
          <button className="emp-modal-close" onClick={onClose}>
            <FiX size={22} />
          </button>
        </div>

        <div className="emp-modal-body">
          <div className="emp-search-row">
            <label className="emp-search-label">NT Login</label>
            <input
              type="text"
              className="emp-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter NT Login..."
              autoFocus
            />
            <button className="emp-btn-search" onClick={handleSearch} disabled={loading}>
              <FiSearch size={15} />
              <span>Search</span>
            </button>
          </div>

          <div className="emp-toolbar">
            <button
              className="emp-btn-select"
              onClick={handleSelect}
              disabled={!selectedRow}
            >
              Select
            </button>
            <div className="emp-pager">
              {loading ? 'Loading…' : `${results.length ? '1' : '0'} to ${results.length} of ${results.length}`}
            </div>
          </div>

          {error && <div className="emp-error">{error}</div>}

          <div className="emp-results">
            <table className="emp-table">
              <thead>
                <tr>
                  <th>NT Login</th>
                  <th>Display Name</th>
                  <th>Job Title</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row, idx) => {
                  const login = getLogin(row)
                  const isSelected = selectedRow && getLogin(selectedRow) === login
                  return (
                    <tr
                      key={login || idx}
                      className={isSelected ? 'emp-row-selected' : ''}
                      onClick={() => setSelectedRow(row)}
                      onDoubleClick={() => { onSelect(row); onClose(); }}
                    >
                      <td>{login}</td>
                      <td>{getName(row)}</td>
                      <td>{getTitle(row)}</td>
                    </tr>
                  )
                })}
                {searched && !loading && results.length === 0 && (
                  <tr>
                    <td colSpan={3} className="emp-no-results">No employee found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="emp-modal-footer">
          <button className="emp-btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default EmployeeSearchModal
