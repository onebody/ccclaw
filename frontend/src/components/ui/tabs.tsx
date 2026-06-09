import { useState, useCallback, ReactNode, ReactElement } from 'react'
import { cn } from '@/lib/utils'

// ----------------------------------------------------------------
// Tabs - 简单标签页组件（无需 shadcn/ui 依赖）
// ----------------------------------------------------------------

interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children: ReactNode
}

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error('Tabs 组件必须在 Tabs 内使用')
  return ctx
}

export function Tabs({ defaultValue, value, onValueChange, className, children }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || '')
  const currentValue = value !== undefined ? value : internalValue
  const handleChange = useCallback((v: string) => {
    if (value === undefined) setInternalValue(v)
    onValueChange?.(v)
  }, [value, onValueChange])

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleChange }}>
      <div className={cn(className)}>{children}</div>
    </TabsContext.Provider>
  )
}

// ----------------------------------------------------------------
// TabsList
// ----------------------------------------------------------------
export function TabsList({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('flex items-center gap-1 border-b', className)}>
      {children}
    </div>
  )
}

// ----------------------------------------------------------------
// TabsTrigger
// ----------------------------------------------------------------
export function TabsTrigger({ value, className, children }: { value: string; className?: string; children: ReactNode }) {
  const { value: currentValue, onValueChange } = useTabsContext()
  const isActive = currentValue === value

  return (
    <button
      className={cn(
        'px-3 py-1.5 text-sm font-medium transition-colors border-b-2 border-transparent',
        'hover:text-foreground hover:border-muted-foreground/30',
        isActive && 'text-primary border-primary',
        !isActive && 'text-muted-foreground',
        className
      )}
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  )
}

// ----------------------------------------------------------------
// TabsContent
// ----------------------------------------------------------------
export function TabsContent({ value, className, children }: { value: string; className?: string; children: ReactNode }) {
  const { value: currentValue } = useTabsContext()
  if (currentValue !== value) return null

  return (
    <div className={cn('mt-2', className)}>
      {children}
    </div>
  )
}
