import React, { useState, useEffect } from 'react'
import Select from 'react-select'
import { FiX, FiSearch, FiSave } from 'react-icons/fi'
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

function AddModal({ isOpen, onClose, onSaved, allowedSite, currentUser = '', existingData = [] }) {
  // If user has specific site, restrict options
  const availableSiteOptions = allowedSite && allowedSite !== 'ALL'
    ? siteOptions.filter(o => o.value === allowedSite)
    : siteOptions

  const [formData, setFormData] = useState({
    site: allowedSite && allowedSite !== 'ALL' ? { value: allowedSite, label: allowedSite } : null,
    plant: null,
    ntLogin: '',
    customer: null,
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

      // Reset form and clear any previous error/saving state
      setFormData({
        site: allowedSite && allowedSite !== 'ALL' ? { value: allowedSite, label: allowedSite } : null,
        plant: null, ntLogin: '', customer: null, targetOutput: '',
        remark: '', effectiveWW: null, isExclude: false, isActive: true,
      })
      setSaveError(null)
      setSaving(false)
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

  // Load customers when plant changes (customers filtered by site + selected plant)
  useEffect(() => {
    if (formData.site && formData.plant && formData.plant.plantID != null) {
      productivityApi.getCustomersByPlant(formData.site.value, formData.plant.plantID)
        .then(data => {
          const options = data.map(item => ({
            value: item.custName,
            label: item.custName,
          })).filter(o => o.value).sort((a, b) => a.label.localeCompare(b.label))
          setCustomerOptions(options)
        })
        .catch(err => console.error('Failed to load customers:', err))
    } else {
      setCustomerOptions([])
    }
  }, [formData.site, formData.plant])

  if (!isOpen) return null

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      // Reset dependent fields
      if (field === 'site') {
        updated.plant = null
        updated.customer = null
      }
      if (field === 'plant') {
        updated.customer = null
      }
      return updated
    })
  }

  const handleSave = async () => {
    // Basic validation
    if (!formData.site) { setSaveError('Please select a site.'); return }
    if (!formData.plant) { setSaveError('Please select a plant.'); return }
    if (!formData.ntLogin) { setSaveError('Please enter an NT Login.'); return }
    if (!formData.customer) { setSaveError('Please select a customer.'); return }

    // Duplicate check: same Plant + Customer + NT Login + Effective WW
    const norm = (v) => String(v ?? '').trim().toLowerCase()
    const isDuplicate = existingData.some(row => {
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
        userProdID: '', // empty = insert
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
          <h2>Add New User Productivity</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Site</label>
            <Select
              options={availableSiteOptions}
              value={formData.site}
              onChange={(val) => handleChange('site', val)}
              placeholder="Select site..."
              styles={customSelectStyles}
              menuPortalTarget={document.body}
              menuPlacement="auto"
              menuShouldScrollIntoView={false}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Plant</label>
            <Select
              options={plantOptions}
              value={formData.plant}
              onChange={(val) => handleChange('plant', val)}
              placeholder={formData.site ? "Select plant..." : "Select site first..."}
              isDisabled={!formData.site}
              styles={customSelectStyles}
              menuPortalTarget={document.body}
              menuPlacement="auto"
              menuShouldScrollIntoView={false}
            />
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
            <label className="form-label">Customer Name</label>
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
          </div>

          <div className="form-group">
            <label className="form-label">Target Output</label>
            <input
              type="text"
              inputMode="decimal"
              className="form-input"
              value={formData.targetOutput}
              onChange={(e) => {
                let cleaned = e.target.value
                  .replace(',', '.')          // comma -> period
                  .replace(/[^0-9.]/g, '')     // strip anything that isn't a digit or period
                // Keep only the first period (no multiple decimal points)
                const firstDot = cleaned.indexOf('.')
                if (firstDot !== -1) {
                  cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
                }
                handleChange('targetOutput', cleaned)
              }}
              placeholder="Enter target output..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Remark</label>
            <textarea
              className="form-textarea"
              value={formData.remark}
              onChange={(e) => handleChange('remark', e.target.value)}
              placeholder="Enter remark..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Effective WW (Year-WorkWeek)</label>
            <Select
              options={workWeekOptions}
              value={formData.effectiveWW}
              onChange={(val) => handleChange('effectiveWW', val)}
              placeholder="Select effective week..."
              styles={customSelectStyles}
              menuPortalTarget={document.body}
              menuPlacement="auto"
              maxMenuHeight={190}
              menuShouldScrollIntoView={false}
            />
          </div>

          <div className="form-row">
            <div className="form-group form-group-half">
              <label className="form-label">Is Exclude</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="isExclude"
                    checked={formData.isExclude === true}
                    onChange={() => handleChange('isExclude', true)}
                  />
                  <span className="radio-custom"></span>
                  <span>Yes</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="isExclude"
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
                    name="isActive"
                    checked={formData.isActive === true}
                    onChange={() => handleChange('isActive', true)}
                  />
                  <span className="radio-custom"></span>
                  <span>Yes</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="isActive"
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

export default AddModal
