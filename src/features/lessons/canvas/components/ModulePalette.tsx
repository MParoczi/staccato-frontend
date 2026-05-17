import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { MODULE_TYPES, MODULE_TYPE_REGISTRY } from '../lib/moduleRegistry'
import type { ModuleType } from '../lib/moduleRegistry'

interface ModulePaletteProps {
  onSelect: (type: ModuleType) => void
  disabled?: boolean
}

export function ModulePalette({ onSelect, disabled }: ModulePaletteProps) {
  const [open, setOpen] = useState(false)

  function handleSelect(type: ModuleType) {
    setOpen(false)   // D-03: close immediately before calling parent
    onSelect(type)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" disabled={disabled}>
          <Plus className="size-4 mr-1" />
          <span className="hidden sm:inline">Add module</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-2" align="start">
        <div className="grid grid-cols-3 gap-1">
          {MODULE_TYPES.map((type) => {
            const def = MODULE_TYPE_REGISTRY[type]
            const Icon = def.icon
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleSelect(type)}
                className="flex flex-col items-center gap-1 rounded p-2 text-xs hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ minWidth: 80, minHeight: 64 }}
              >
                <Icon className="size-5" />
                <span className="text-center leading-tight">{def.label}</span>
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
