import React, { useState, useEffect, useMemo } from 'react'
import SearchPanel from '../components/SearchPanel'
import SiteTabs from '../components/SiteTabs'
import DataTable from '../components/DataTable'
import { productivityApi } from '../services/api'

const allSites = ['ALL', 'PEN', 'PUN', 'HCM', 'JSP']

function ProductivityPage({ allowedSite = 'ALL', currentUser = '' }) {
  const [allData, setAllData] = useState([])

  // If user has specific site, only show that site tab
  const sites = allowedSite === 'ALL' ? allSites : [allowedSite]
  const defaultSite = allowedSite === 'ALL' ? 'ALL' : allowedSite

  const [activeSite, setActiveSite] = useState(defaultSite)
  const [filters, setFilters] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load ALL data once (or site-specific if user is restricted)
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await productivityApi.getAll(allowedSite === 'ALL' ? 'ALL' : allowedSite)
      setAllData(result)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load data. Please check your network connection.')
    } finally {
      setLoading(false)
    }
  }

  // Load data once on mount
  useEffect(() => {
    fetchData()
  }, [])

  // Filter by active site tab (frontend filtering - instant)
  const siteFilteredData = useMemo(() => {
    if (activeSite === 'ALL' || allowedSite !== 'ALL') return allData
    return allData.filter(item => item.SiteName === activeSite)
  }, [allData, activeSite, allowedSite])

  // Apply search filters on top of site filter
  const filteredData = useMemo(() => {
    if (!filters) return siteFilteredData
    let result = siteFilteredData

    if (filters.customer && filters.customer.length > 0) {
      const selectedCustomers = filters.customer.map(c => c.value.toLowerCase())
      result = result.filter(item =>
        item.CustomerName && selectedCustomers.includes(item.CustomerName.toLowerCase())
      )
    }
    if (filters.employeeName) {
      result = result.filter(item =>
        item.EmployeeName && item.EmployeeName.toLowerCase().includes(filters.employeeName.toLowerCase())
      )
    }
    if (filters.ntLogin) {
      result = result.filter(item =>
        item.NTLogin && item.NTLogin.toLowerCase().includes(filters.ntLogin.toLowerCase())
      )
    }
    if (filters.isActive) {
      const isActiveVal = filters.isActive.value === 'true'
      result = result.filter(item => item.isActive === isActiveVal)
    }

    return result
  }, [siteFilteredData, filters])

  const handleSearch = (newFilters) => {
    setFilters(newFilters)
  }

  const handleReset = () => {
    setFilters(null)
  }

  const handleSiteChange = (site) => {
    setActiveSite(site)
    setFilters(null)
  }

  return (
    <>
      <SearchPanel onSearch={handleSearch} onReset={handleReset} activeSite={activeSite} data={siteFilteredData} />
      <SiteTabs sites={sites} activeSite={activeSite} onSiteChange={handleSiteChange} />
      {error && <div className="error-banner">{error}</div>}
      <DataTable data={filteredData} loading={loading} onRefresh={fetchData} allowedSite={allowedSite} currentUser={currentUser} existingData={allData} />
    </>
  )
}

export default ProductivityPage
