import { createFileRoute } from '@tanstack/react-router'

import { MemoryPanel } from '@/features/memory/MemoryPanel'
import { useAppClient } from '@/lib/state/useAppClient'

export const Route = createFileRoute('/memory')({ component: MemoryPage })

export function MemoryPage() {
  const { client } = useAppClient()

  return (
    <div className="dashboard-flow">
      <div data-animate="rise">
        <MemoryPanel client={client} />
      </div>
    </div>
  )
}
