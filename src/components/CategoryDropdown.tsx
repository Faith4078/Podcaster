import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

// A reusable select-style dropdown matching the design system (#15171C bg,
// #252525 border, #f97535 accent, #71788B muted). A toggle button opens a menu of
// options; selecting one calls onChange and closes. `null` is the "All" / cleared
// state. Accessible: keyboard (Enter/Space/Arrows/Escape) + click-outside to
// close.
export default function CategoryDropdown({
  options,
  value,
  onChange,
  allLabel = 'All categories',
  className,
}: {
  options: string[]
  value: string | null
  onChange: (next: string | null) => void
  /** Label for the cleared (null) state. */
  allLabel?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  // Index of the keyboard-highlighted option; -1 is the leading "All" row.
  const [activeIndex, setActiveIndex] = useState(-1)

  // The full option list including the leading "All" entry (null value).
  const rows: Array<{ value: string | null; label: string }> = [
    { value: null, label: allLabel },
    ...options.map((o) => ({ value: o, label: o })),
  ]

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return
    function onPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [open])

  // When opening, highlight the current selection so arrow keys start there.
  useEffect(() => {
    if (open) {
      const current = rows.findIndex((r) => r.value === value)
      setActiveIndex(current)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function select(next: string | null) {
    onChange(next)
    setOpen(false)
  }

  function onTriggerKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(true)
    }
  }

  function onListKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, rows.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (activeIndex >= 0 && activeIndex < rows.length) {
        select(rows[activeIndex].value)
      }
    }
  }

  // Keep focus on the open list so keyboard navigation works.
  useEffect(() => {
    if (open) listRef.current?.focus()
  }, [open])

  const selectedLabel = value ?? allLabel

  return (
    <div ref={rootRef} className={`relative inline-block ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Filter by category"
        className={`flex items-center justify-between gap-2 rounded-md border px-4 py-2.5 text-sm font-semibold transition-colors min-w-[180px] ${
          value
            ? 'border-[#f97535]/50 bg-[#15171C] text-white'
            : 'border-[#252525] bg-[#15171C] text-[#71788B] hover:text-white hover:border-[#f97535]/40'
        }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${value ? 'text-[#f97535]' : ''}`}
        />
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-label="Categories"
          onKeyDown={onListKey}
          className="absolute left-0 top-full z-50 mt-2 max-h-72 w-full min-w-[200px] overflow-y-auto rounded-xl border border-[#252525] bg-[#15171C] p-1.5 shadow-xl shadow-black/40 outline-none"
        >
          {rows.map((row, i) => {
            const isSelected = row.value === value
            const isActive = i === activeIndex
            return (
              <button
                key={row.value ?? '__all__'}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => select(row.value)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  isActive ? 'bg-white/[0.06]' : ''
                } ${isSelected ? 'text-[#f97535] font-semibold' : 'text-white'}`}
              >
                <span className="truncate">{row.label}</span>
                {isSelected && <Check size={15} className="shrink-0 text-[#f97535]" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
