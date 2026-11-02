import React, { useState, useEffect } from 'react'
import Select from 'react-select'
import { FiX, FiSearch, FiSave, FiEdit2 } from 'react-icons/fi'
import { productivityApi } from '../services/api'
import EmployeeSearchModal from './EmployeeSearchModal'
import './AddModal.css'

const siteOptions = [
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
    zIndex: 9999,
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

function EditModal({ isOpen, onClose, onSaved, rowData, allowedSite, currentUser = '', existingData = [] }) {
  // If user has specific site, restrict options
  const availableSiteOptions = allowedSite && allowedSite !== 'ALL'
    ? siteOptions.filter(o => o.value === allowedSite)
    : siteOptions
  const [formData, setFormData] = useState({
    userProdID: '',
    site: null,
    plant: null,
    ntLogin: '',
    empName: '',
    jobTitle: '',
    customer: null,
    plantEditable: false,
    targetOutput: '',
    remark: '',
    effectiveWW: null,
    isExclude: false,
    isActive: true,
  })

  const [customerOptions, setCustomerOptions] = useState([])
  const [plantOptions, setPlantOptions] = useState([])
  const [workWeekOptions, setWorkWeekOptions] = useState([])
  const [showEmpSearch, setShowEmpSearch] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  // Load work weeks on open
  useEffect(() => {
    if (isOpen) {
      productivityApi.getWorkWeeks()
        .then(data => {
          const options = data.map(item => ({
            value: item.yrww,
            label: item.yrww,
          })).filter(o => o.value)
          setWorkWeekOptions(options)
        })
        .catch(err => console.error('Failed to load work weeks:', err))
    }
  }, [isOpen])

  // Prevent the background page from scrolling while the modal is open
  useEffect(() => {
    if (isOpen) {
      const prevBody = document.body.style.overflow
      const prevHtml = document.documentElement.style.overflow
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prevBody
        document.documentElement.style.overflow = prevHtml
      }
    }
  }, [isOpen])

  // Load plants when site changes
  useEffect(() => {
    if (formData.site) {
      productivityApi.getPlants(formData.site.value)
        .then(data => {
          const options = data.map(item => ({
            value: item.plantName ?? item.PlantName,
            label: item.plantName ?? item.PlantName,
            plantID: item.plantID ?? item.PlantID ?? item.plantId ?? item.id ?? item.ID,
          })).filter(o => o.value).sort((a, b) => a.label.localeCompare(b.label))
          setPlantOptions(options)
        })
        .catch(err => console.error('Failed to load plants:', err))
    } else {
      setPlantOptions([])
    }
  }, [formData.site])

  // Load customers when plant changes (filtered by site + plant)
  useEffect(() => {
    if (formData.site && formData.plant && formData.plant.plantID != null) {
      productivityApi.getCustomersByPlant(formData.site.value, formData.plant.plantID)
        .then(data => {
          if (Array.isArray(data)) {
            const options = data.map(item => ({
              value: item.custName,
              label: item.custName,
            })).filter(o => o.value).sort((a, b) => a.label.localeCompare(b.label))
            setCustomerOptions(options)
          }
        })
        .catch(err => {
          console.error('Failed to load customers:', err)
          setCustomerOptions([])
        })
    }
  }, [formData.site, formData.plant])

  // Pre-fill form when rowData changes
  useEffect(() => {
    if (rowData) {
      const plantName = rowData.plantName ?? rowData.PlantName
      const plantID = rowData.plantID ?? rowData.PlantID
      setFormData({
        userProdID: rowData.userProdID ?? rowData.UserProdID ?? rowData.id ?? '',
        site: siteOptions.find(o => o.value === rowData.SiteName) || null,
        plant: plantName != null
          ? { value: plantName, label: plantName, plantID }
          : (plantID != null ? { value: String(plantID), label: String(plantID), plantID } : null),
        customer: rowData.CustomerName ? { value: rowData.CustomerName, label: rowData.CustomerName } : null,
        ntLogin: rowData.NTLogin || '',
        empName: rowData.EmployeeName || '',
        jobTitle: rowData.jobTitle || '',
        plantEditable: false,
        targetOutput: rowData.productivity || '',
        remark: rowData.Remark || '',
        effectiveWW: rowData.effectiveWW ? { value: rowData.effectiveWW, label: rowData.effectiveWW } : null,
        isExclude: rowData.isExclude || false,
        isActive: rowData.isActive || false,
      })
      setSaveError(null)
    }
  }, [rowData])

  if (!isOpen) return null

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Unlock the Plant dropdown for editing and clear the current customer,
  // forcing the user to re-select a customer for the new plant.
  const startPlantEdit = () => {
    setFormData(prev => ({ ...prev, plantEditable: true, customer: null }))
    setCustomerOptions([])
  }

  // Cancel plant editing and restore the original plant + customer from the row.
  const cancelPlantEdit = () => {
    setFormData(prev => ({
      ...prev,
      plantEditable: false,
      plant: rowData
        ? (() => {
            const plantName = rowData.plantName ?? rowData.PlantName
            const plantID = rowData.plantID ?? rowData.PlantID
            return plantName != null
              ? { value: plantName, label: plantName, plantID }
              : (plantID != null ? { value: String(plantID), label: String(plantID), plantID } : null)
          })()
        : null,
      customer: rowData?.CustomerName
        ? { value: rowData.CustomerName, label: rowData.CustomerName }
        : null,
    }))
  }

  // When a new plant is chosen, clear the customer so it must be re-selected.
  const handlePlantChange = (val) => {
    setFormData(prev => ({ ...prev, plant: val, customer: null }))
  }

  const handleSave = async () => {
    if (!formData.plant || formData.plant.plantID == null) {
      setSaveError('Please select a plant.')
      return
    }

    // Duplicate check: same Plant + Customer + NT Login + Effective WW
    // (exclude the record currently being edited)
    const norm = (v) => String(v ?? '').trim().toLowerCase()
    const currentID = String(formData.userProdID ?? '')
    const isDuplicate = existingData.some(row => {
      const rowID = String(row.userProdID ?? row.UserProdID ?? row.id ?? '')
      if (rowID && rowID === currentID) return false // skip self
      const sameLogin = norm(row.NTLogin) === norm(formData.ntLogin)
      const sameCustomer = norm(row.CustomerName) === norm(formData.customer?.value)
      const sameWW = norm(row.effectiveWW) === norm(formData.effectiveWW?.value)

      const rowPlantID = row.plantID ?? row.PlantID
      const rowPlantName = row.plantName ?? row.PlantName
      const samePlant = rowPlantID != null
        ? String(rowPlantID) === String(formData.plant?.plantID ?? '')
        : norm(rowPlantName) === norm(formData.plant?.value)

      return sameLogin && sameCustomer && sameWW && samePlant
    })
    if (isDuplicate) {
      setSaveError('A record with the same Plant, Customer, NT Login, and Effective WW already exists.')
      return
    }

    setSaving(true)
    setSaveError(null)
    try {
      await productivityApi.saveUserProductivity({
        userProdID: formData.userProdID, // present = update
        ntLogin: formData.ntLogin,
        custName: formData.customer?.value,
        productivity: formData.targetOutput,
        remark: formData.remark,
        effectiveWW: formData.effectiveWW?.value,
        isExcluded: formData.isExclude,
        isActive: formData.isActive,
        createdBy: currentUser,
        siteName: formData.site?.value,
        plantID: formData.plant?.plantID,
      })
      if (onSaved) onSaved()
    } catch (err) {
      console.error('Save failed:', err)
      setSaveError(err.message || 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleEmployeeSelect = (emp) => {
    const login = emp.ntLogin ?? emp.NTLogin ?? emp.ntlogin ?? ''
    const name = emp.displayName ?? emp.DisplayName ?? emp.employeeName ?? emp.EmployeeName ?? ''
    const title = emp.jobTitle ?? emp.JobTitle ?? emp.title ?? ''
    setFormData(prev => ({
      ...prev,
      ntLogin: login,
      empName: name,
      jobTitle: title,
    }))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>User Productivity Edit</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Site</label>
            <input
              type="text"
              className="form-input"
              value={formData.site ? formData.site.label : ''}
              readOnly
              style={{ background: '#f7fafc', color: '#64748b' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Plant</label>
            {formData.plantEditable ? (
              <div className="input-with-button">
                <div style={{ flex: 1 }}>
                  <Select
                    options={plantOptions}
                    value={formData.plant}
                    onChange={handlePlantChange}
                    placeholder="Select plant..."
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPlacement="auto"
                    menuShouldScrollIntoView={false}
                  />
                </div>
                <button
                  className="btn-inline-search"
                  type="button"
                  style={{ background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)' }}
                  onClick={cancelPlantEdit}
                >
                  <FiX size={16} />
                  <span>Cancel</span>
                </button>
              </div>
            ) : (
              <div className="input-with-button">
                <input
                  type="text"
                  className="form-input"
                  value={formData.plant ? formData.plant.label : ''}
                  readOnly
                  style={{ background: '#f7fafc', color: '#64748b' }}
                />
                <button
                  className="btn-inline-search"
                  type="button"
                  style={{ background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)' }}
                  onClick={startPlantEdit}
                >
                  <FiEdit2 size={16} />
                  <span>Edit</span>
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Customer Name</label>
            {formData.plantEditable ? (
              <Select
                options={customerOptions}
                value={formData.customer}
                onChange={(val) => handleChange('customer', val)}
                placeholder={formData.plant ? "Select customer..." : "Select plant first..."}
                isDisabled={!formData.plant}
                styles={customSelectStyles}
                menuPortalTarget={document.body}
                menuPlacement="auto"
                menuShouldScrollIntoView={false}
              />
            ) : (
              <input
                type="text"
                className="form-input"
                value={formData.customer ? formData.customer.label : ''}
                readOnly
                style={{ background: '#f7fafc', color: '#64748b' }}
              />
            )}
          </div>

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

          <div className="form-group">
            <label className="form-label">Job Title</label>
            <input
              type="text"
              className="form-input"
              value={formData.jobTitle}
              readOnly
              style={{ background: '#f7fafc', color: '#64748b' }}
            />
          </div>

          

          <div className="form-group">
            <label className="form-label">Target Output</label>
            <input
              type="text"
              className="form-input"
              value={formData.targetOutput}
              readOnly
              style={{ background: '#f7fafc', color: '#64748b' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Remark</label>
            <input
              type="text"
              className="form-input"
              value={formData.remark}
              readOnly
              style={{ background: '#f7fafc', color: '#64748b' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Effective WW</label>
            <input
              type="text"
              className="form-input"
              value={formData.effectiveWW ? formData.effectiveWW.label : ''}
              readOnly
              style={{ background: '#f7fafc', color: '#64748b' }}
            />
          </div>

          <div className="form-row">
            <div className="form-group form-group-half">
              <label className="form-label">Is Exclude</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="editIsExclude"
                    checked={formData.isExclude === true}
                    onChange={() => handleChange('isExclude', true)}
                  />
                  <span className="radio-custom"></span>
                  <span>Yes</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="editIsExclude"
                    checked={formData.isExclude === false}
                    onChange={() => handleChange('isExclude', false)}
                  />
                  <span className="radio-custom"></span>
                  <span>No</span>
                </label>
              </div>
            </div>

            <div className="form-group form-group-half">
              <label className="form-label">Is Active</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="editIsActive"
                    checked={formData.isActive === true}
                    onChange={() => handleChange('isActive', true)}
                  />
                  <span className="radio-custom"></span>
                  <span>Yes</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="editIsActive"
                    checked={formData.isActive === false}
                    onChange={() => handleChange('isActive', false)}
                  />
                  <span className="radio-custom"></span>
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {saveError && <div className="modal-save-error">{saveError}</div>}

        <div className="modal-footer">
          <button className="btn-modal btn-modal-save" onClick={handleSave} disabled={saving}>
            <FiSave size={16} />
            <span>{saving ? 'Saving…' : 'Save'}</span>
          </button>
          <button className="btn-modal btn-modal-cancel" onClick={onClose} disabled={saving}>
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

export default EditModal
