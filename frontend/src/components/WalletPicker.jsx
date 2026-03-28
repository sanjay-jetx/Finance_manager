import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

const OPTIONS = [
  { value: 'cash', label: '💵 Cash', desc: 'Physical cash' },
  { value: 'upi', label: '📱 UPI', desc: 'GPay / PhonePe' },
]

export default function WalletPicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false)
  const selected = OPTIONS.find((o) => o.value === value)

  return (
    <div className="relative">
      {label && <label className="label">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input flex items-center justify-between w-full text-left"
      >
        <span className="text-white">{selected?.label}</span>
        <ChevronDown size={15} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className="absolute z-20 left-0 right-0 mt-1 rounded-xl border border-white/10 overflow-hidden shadow-2xl"
          style={{ background: '#1a1f2e' }}
        >
          {OPTIONS.map((opt, i) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
              className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between
                ${value === opt.value
                  ? 'bg-primary-600/20 text-primary-300 font-semibold'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'}
                ${i !== 0 ? 'border-t border-white/5' : ''}
              `}
            >
              <span>
                {opt.label}{' '}
                <span className="text-gray-500 font-normal text-xs ml-1">— {opt.desc}</span>
              </span>
              {value === opt.value && <Check size={13} className="text-primary-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
