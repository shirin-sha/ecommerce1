import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import SettingsGeneral from './SettingsGeneral'

export default function Settings() {
  const location = useLocation()
  const currentTab = location.pathname.split('/').pop() || 'general'

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'products', label: 'Products' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'shipping', label: 'Shipping' },
    { id: 'payments', label: 'Payments' },
    { id: 'emails', label: 'Emails' },
    { id: 'site-visibility', label: 'Site Visibility' },
  ]

  return (
    <div>
      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b">
          <div className="flex gap-1 px-6">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                to={`/settings/${tab.id}`}
                className={`px-6 py-3 border-b-2 font-medium ${
                  currentTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {currentTab === 'general' && <SettingsGeneral />}
        {currentTab === 'products' && <div>Products Settings - Coming Soon</div>}
        {currentTab === 'inventory' && <div>Inventory Settings - Coming Soon</div>}
        {currentTab === 'shipping' && <div>Shipping Settings - Coming Soon</div>}
        {currentTab === 'payments' && <div>Payment Settings - Coming Soon</div>}
        {currentTab === 'emails' && <div>Email Settings - Coming Soon</div>}
        {currentTab === 'site-visibility' && <div>Site Visibility Settings - Coming Soon</div>}
      </div>
    </div>
  )
}
