import React from 'react'

export default function DashboardNotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Page Not Found</h1>
      <p className="text-[var(--text-secondary)]">The page you requested doesn't exist in this restaurant dashboard.</p>
    </div>
  )
}
