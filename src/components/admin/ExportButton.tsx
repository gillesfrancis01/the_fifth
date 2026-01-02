'use client'

import { PiDownloadSimple } from "react-icons/pi"

interface ExportButtonProps<T> {
    data: T[]
    filename?: string
    label?: string
    headers?: { key: string; label: string }[]
}

export default function ExportButton<T>({
    data,
    filename = 'export',
    label = 'Exporter CSV',
    headers
}: ExportButtonProps<T>) {

    const handleExport = () => {
        if (!data || data.length === 0) {
            alert("Aucune donnée à exporter.")
            return
        }

        // Determine headers from data keys if not provided
        const cols = headers || Object.keys(data[0]).map(key => ({ key, label: key }))

        // Build CSV content
        const csvRows = []

        // Header row
        csvRows.push(cols.map(col => `"${col.label}"`).join(','))

        // Data rows
        data.forEach(row => {
            const values = cols.map(col => {
                // Access nested properties if key contains dots (e.g. "customer.fullName")
                const value = col.key.split('.').reduce((obj, k) => (obj || {})[k], row)

                // Handle null/undefined and escape quotes
                const stringValue = value === null || value === undefined ? '' : String(value)
                const escaped = stringValue.replace(/"/g, '""')
                return `"${escaped}"`
            })
            csvRows.push(values.join(','))
        })

        const csvContent = csvRows.join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <button
            onClick={handleExport}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/10 bg-black/40 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white/70 transition hover:border-[rgba(201,161,77,0.4)] hover:text-white"
        >
            <span className="absolute inset-0 translate-y-full bg-[radial-gradient(circle_at_top,rgba(201,161,77,0.15),transparent_70%)] opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100" />
            <PiDownloadSimple className="relative h-4 w-4" />
            <span className="relative">{label}</span>
        </button>
    )
}
