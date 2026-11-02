// BASE_URL is '/' in dev and '/DebugUserProductivity/' in production, so every
// call lands under the deployed app where web.config rewrites /api to the backend.
const API_ROOT = `${import.meta.env.BASE_URL}api`
const API_BASE = `${API_ROOT}/UserProductivity`
const CUSTOMER_API = `${API_ROOT}/CommonTECustomer`
const WORKWEEK_API = `${API_ROOT}/CommonTEWorkWeek`
const PLANT_API = `${API_ROOT}/CommonTEPlant`

const SITES = ['PEN', 'PUN', 'HCM', 'JSP']

export const productivityApi = {
  // Get records for a single site (tags each record with SiteName)
  async getBySite(site) {
    const res = await fetch(`${API_BASE}/${site}`)
    if (!res.ok) throw new Error('Failed to fetch data')
    const data = await res.json()
    // Tag each record with its site since API doesn't return it
    return data.map(item => ({ ...item, SiteName: site }))
  },

  // Get all records across all sites (tagged with SiteName)
  async getAll(site = 'ALL') {
    if (site !== 'ALL') {
      return this.getBySite(site)
    }
    // Fetch all sites in parallel and merge
    const results = await Promise.all(SITES.map(s => this.getBySite(s)))
    return results.flat()
  },

  // Get customers by site
  async getCustomers(site = 'ALL') {
    const res = await fetch(`${CUSTOMER_API}/${site}`)
    if (!res.ok) throw new Error('Failed to fetch customers')
    return res.json()
  },

  // Get customers for a specific plant within a site
  async getCustomersByPlant(site, plantID) {
    const res = await fetch(`${API_ROOT}/CommonTECustomerByPlant/${site}/${plantID}`)
    if (!res.ok) throw new Error('Failed to fetch customers')
    return res.json()
  },

  // Get plants by site
  async getPlants(site = 'ALL') {
    const res = await fetch(`${PLANT_API}/${site}`)
    if (!res.ok) throw new Error('Failed to fetch plants')
    return res.json()
  },

  // Get work weeks
  async getWorkWeeks() {
    const res = await fetch(`${WORKWEEK_API}`)
    if (!res.ok) throw new Error('Failed to fetch work weeks')
    return res.json()
  },

  // Get all user role / access records
  async getUserRoles() {
    const res = await fetch(`${API_ROOT}/UserProductivityAccess`)
    if (!res.ok) throw new Error('Failed to fetch user roles')
    return res.json()
  },

  // Insert or update a user role / access record.
  // Insert omits userID; update passes the existing userID.
  async saveUserRole({ userID, ntLogin, roleName, siteName, isActive, createdBy }) {
    const fields = {
      // Insert uses 0; update passes the existing userID
      userID: (userID === undefined || userID === null || userID === '') ? '0' : String(userID),
      NTLogin: ntLogin ?? '',
      roleName: roleName ?? '',
      siteName: siteName ?? '',
      isActive: isActive ? 'true' : 'false',
      createdBy: createdBy ?? '',
    }
    const params = new URLSearchParams(fields)
    const url = `${API_ROOT}/UserProductivityAccessInsert?${params.toString()}`
    const res = await fetch(url, { method: 'POST' })
    const text = await res.text()
    if (!res.ok) {
      throw new Error(`Save failed (HTTP ${res.status}): ${text || res.statusText}`)
    }
    try { return text ? JSON.parse(text) : null } catch { return text }
  },

  // Search employee (AD lookup) by NT Login
  async searchEmployee(ntLogin) {
    const res = await fetch(`${API_ROOT}/Employee?NTLogin=${encodeURIComponent(ntLogin)}`)
    if (!res.ok) throw new Error('Failed to search employee')
    return res.json()
  },

  // Insert or update a user productivity record.
  // Same endpoint for both: leave userProdID empty to insert, pass it to update.
  async saveUserProductivity({
    userProdID = '',
    ntLogin,
    custName,
    productivity,
    remark,
    effectiveWW,
    isExcluded,
    isActive,
    createdBy,
    siteName,
    plantID,
  }) {
    // Normalize the productivity number: accept comma or period decimals,
    // strip spaces, and always send with a period so the backend can parse it.
    const normalizedProductivity = String(productivity ?? '')
      .trim()
      .replace(',', '.')

    const fields = {
      // Insert uses 0; update passes the existing record id
      userProdID: (userProdID === '' || userProdID == null) ? '0' : String(userProdID),
      NTLogin: ntLogin ?? '',
      custName: custName ?? '',
      productivity: normalizedProductivity,
      userType: '2',
      Remark: remark ?? '',
      effectiveWW: effectiveWW ?? '',
      isExcluded: isExcluded ? 'true' : 'false',
      isActive: isActive ? 'true' : 'false',
      createdBy: createdBy ?? '',
      siteName: siteName ?? '',
      plantID: plantID ?? '',
    }
    const params = new URLSearchParams(fields)
    const url = `${API_ROOT}/UserProductivityInsert?${params.toString()}`
    const res = await fetch(url, { method: 'POST' })
    const text = await res.text()
    if (!res.ok) {
      throw new Error(`Save failed (HTTP ${res.status}): ${text || res.statusText}`)
    }
    // Response may be empty or JSON; return text so caller can ignore it safely
    try { return text ? JSON.parse(text) : null } catch { return text }
  },
}
