import type React from "react"
import { HardwareIndicator } from "@/components/hardware-indicator"

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  showHardwareStatus?: boolean
}

export function PageHeader({ title, description, children, showHardwareStatus = false }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </div>
        {showHardwareStatus && <HardwareIndicator />}
      </div>
      {children && <div className="flex gap-2 flex-wrap">{children}</div>}
    </div>
  )
}
