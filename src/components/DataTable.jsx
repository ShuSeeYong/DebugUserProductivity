import React, { useState, useRef, useCallback } from 'react'
import { FiPlus, FiDownload, FiBarChart2, FiEdit2, FiList, FiChevronUp, FiChevronDown } from 'react-icons/fi'
import * as XLSX from 'xlsx'
import AddModal from './AddModal'
import EditModal from './EditModal'
import './DataTable.css'

const initialColumns = [
  { key: 'edit', label: '', width: 50 },
  { key: 'SiteName', label: 'Site', width: 80 },
  { key: 'PlantName', label: 'Plant', width: 100 },
  { key: 'NTLogin', label: 'NT\u00a0Login', width: 110 },
  { key: 'EmployeeName', label: 'Employee\u00a0Name', width: 150 },
  { key: 'jobTitle', label: 'Job\u00a0Title', width: 160 },
  { key: 'CustomerName', label: 'Customer', width: 140 },
  { key: 'productivity', label: 'Target\u00a0Ouput', width: 90 },
  { key: 'Remark', label: 'Remark', width: 220 },
  { key: 'effectiveWW', label: 'Effective\u00a0WW', width: 120 },
  { key: 'isActive', label: 'Is\u00a0Active', width: 110 },
  { key: 'isExclude', label: 'Is\u00a0Excluded', width: 100 },
  { key: 'updatedBy', label: 'Updated\u00a0By', width: 120 },
  { key: 'updatedDate', label: 'Updated\u00a0Date', width: 110 },
]

function DataTable({ data, allowedSite, onRefresh, loading = false, currentUser = '', existingData = [] }) {
  const [columns, setColumns] = useState(initialColumns)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })
  const pageSize = 20
  const resizingRef = useRef(null)

  // Reset to page 1 when data changes (e.g. filter applied)
  React.useEffect(() => {
    setCurrentPage(1)
  }, [data])

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key !== key) return { key, direction: 'asc' }
      if (prev.direction === 'asc') return { key, direction: 'desc' }
      if (prev.direction === 'desc') return { key: null, direction: null }
      return { key, direction: 'asc' }
    })
    setCurrentPage(1)
  }

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return data

    const dir = sortConfig.direction === 'asc' ? 1 : -1
    const key = sortConfig.key

    return [...data].sort((a, b) => {
      let av = a[key]
      let bv = b[key]

      // Nulls/empty always sort last
      const aEmpty = av === null || av === undefined || av === ''
      const bEmpty = bv === null || bv === undefined || bv === ''
      if (aEmpty && bEmpty) return 0
      if (aEmpty) return 1
      if (bEmpty) return -1

      // Booleans
      if (typeof av === 'boolean' || typeof bv === 'boolean') {
        return ((av ? 1 : 0) - (bv ? 1 : 0)) * dir
      }

      // Dates
      if (key === 'updatedDate' || key === 'effectiveWW') {
        const ad = new Date(av).getTime()
        const bd = new Date(bv).getTime()
        if (!isNaN(ad) && !isNaN(bd)) return (ad - bd) * dir
      }

      // Numbers
      const an = Number(av)
      const bn = Number(bv)
      if (!isNaN(an) && !isNaN(bn) && av !== '' && bv !== '') {
        return (an - bn) * dir
      }

      // Strings (case-insensitive)
      return String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' }) * dir
    })
  }, [data, sortConfig])

  const totalPages = Math.ceil(sortedData.length / pageSize)
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleMouseDown = useCallback((e, index) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = columns[index].width

    const handleMouseMove = (moveEvent) => {
      const diff = moveEvent.clientX - startX
      const newWidth = Math.max(40, startWidth + diff)
      setColumns(prev => {
        const updated = [...prev]
        updated[index] = { ...updated[index], width: newWidth }
        return updated
      })
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      resizingRef.current = null
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    resizingRef.current = index
  }, [columns])

  // Turn a row/column into a clean plain-text value for export
  const exportValue = (row, col) => {
    switch (col.key) {
      case 'isActive':
        return row.isActive ? 'Active' : 'Inactive'
      case 'isExclude':
        return row.isExclude ? 'Yes' : 'No'
      case 'updatedDate':
        return row.updatedDate ? new Date(row.updatedDate).toLocaleDateString() : ''
      default: {
        const v = row[col.key]
        return v === null || v === undefined ? '' : String(v)
      }
    }
  }

  const handleExport = () => {
    if (!sortedData || sortedData.length === 0) {
      alert('There is no data to export.')
      return
    }
    // Skip the edit-button column; use the label (strip non-breaking spaces)
    const exportCols = columns.filter(c => c.key !== 'edit')
    const headers = exportCols.map(c => c.label.replace(/\u00a0/g, ' ').trim())

    // Build an array-of-arrays: header row + data rows
    const aoa = [
      headers,
      ...sortedData.map(row => exportCols.map(col => exportValue(row, col))),
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(aoa)

    // Set sensible column widths based on the table column widths (px -> approx chars)
    worksheet['!cols'] = exportCols.map(c => ({ wch: Math.max(10, Math.round(c.width / 7)) }))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'User Productivity')

    const stamp = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(workbook, `UserProductivity_${stamp}.xlsx`)
  }

  const renderCell = (row, col) => {
    switch (col.key) {
      case 'edit':
        return (
          <button className="edit-btn" title="Edit" onClick={() => { setEditingRow(row); setShowEditModal(true); }}>
            <FiEdit2 size={14} />
          </button>
        )
      case 'SiteName':
        return <strong>{row.SiteName}</strong>
      case 'Remark':
        return <div className="remark-cell">{row.Remark || '—'}</div>
      case 'isActive':
        return (
          <span className={`badge ${row.isActive ? 'badge-active' : 'badge-inactive'}`}>
            {row.isActive ? '● Active' : '● Inactive'}
          </span>
        )
      case 'isExclude':
        return (
          <span className={`badge ${row.isExclude ? 'badge-yes' : 'badge-no'}`}>
            {row.isExclude ? 'Yes' : 'No'}
          </span>
        )
      case 'updatedDate':
        return row.updatedDate ? new Date(row.updatedDate).toLocaleDateString() : '—'
      default:
        return row[col.key] || '—'
    }
  }

  return (
    <div className="data-table-container">
      {loading && (
        <div className="table-loading-bar" role="progressbar" aria-label="Loading data">
          <div className="table-loading-bar-fill" />
        </div>
      )}
      <div className="data-table-header">
        <div className="data-table-title">
          <FiList className="data-table-title-icon" />
          <h2>Debug User Productivity List</h2>
        </div>
        <div className="data-table-actions">
          <button className="btn-action btn-add" onClick={() => setShowAddModal(true)}>
            <FiPlus />
            <span>New User Productivity</span>
          </button>
          <button className="btn-action btn-export" onClick={handleExport}>
            <FiDownload />
            <span>Export To Excel</span>
          </button>
          <button className="btn-action btn-powerbi">
            <FiBarChart2 />
            <span>Go To Power BI</span>
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, index) => {
                const sortable = col.key !== 'edit'
                const isSorted = sortConfig.key === col.key
                return (
                  <th
                    key={col.key}
                    style={{ width: `${col.width}px`, minWidth: `${col.width}px` }}
                    className={sortable ? 'sortable-th' : ''}
                    onClick={sortable ? () => handleSort(col.key) : undefined}
                    aria-sort={isSorted ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <div className="th-content">
                      <span className="th-label">
                        {col.label}
                        {sortable && (
                          <span className="sort-icons">
                            <FiChevronUp
                              size={11}
                              className={isSorted && sortConfig.direction === 'asc' ? 'sort-active' : 'sort-inactive'}
                            />
                            <FiChevronDown
                              size={11}
                              className={isSorted && sortConfig.direction === 'desc' ? 'sort-active' : 'sort-inactive'}
                            />
                          </span>
                        )}
                      </span>
                      {index < columns.length - 1 && (
                        <div
                          className="resize-handle"
                          onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, index); }}
                        />
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {loading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="table-loading-cell">
                  <div className="table-loading-message">
                    <span className="table-loading-spinner" />
                    Loading data…
                  </div>
                </td>
              </tr>
            )}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="table-empty-cell">
                  No records found
                </td>
              </tr>
            )}
            {paginatedData.map((row, rowIndex) => (
              <tr key={`${row.userProdID ?? row.id ?? 'row'}-${(currentPage - 1) * pageSize + rowIndex}`}>
                {columns.map((col) => (
                  <td key={col.key} style={{ width: `${col.width}px`, minWidth: `${col.width}px` }}>
                    {renderCell(row, col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <span className="pagination-info">
          Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, data.length)} of {data.length} records
        </span>
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            ««
          </button>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            «
          </button>
          <span className="pagination-page">Page {currentPage} of {totalPages}</span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            »
          </button>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            »»
          </button>
        </div>
      </div>

      <AddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaved={() => {
          setShowAddModal(false)
          if (onRefresh) onRefresh()
        }}
        allowedSite={allowedSite}
        currentUser={currentUser}
        existingData={existingData}
      />

      <EditModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingRow(null); }}
        onSaved={() => {
          setShowEditModal(false)
          setEditingRow(null)
          if (onRefresh) onRefresh()
        }}
        rowData={editingRow}
        allowedSite={allowedSite}
        currentUser={currentUser}
        existingData={existingData}
      />
    </div>
  )
}

export default DataTable
