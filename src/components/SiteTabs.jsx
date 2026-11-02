import React from 'react'
import './SiteTabs.css'

function SiteTabs({ sites, activeSite, onSiteChange }) {
  return (
    <div className="site-tabs">
      {sites.map((site) => (
        <button
          key={site}
          className={`site-tab ${activeSite === site ? 'site-tab-active' : ''}`}
          onClick={() => onSiteChange(site)}
        >
          {site}
        </button>
      ))}
    </div>
  )
}

export default SiteTabs
