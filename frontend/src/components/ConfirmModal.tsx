type ConfirmVariant = 'primary' | 'delete' | 'success' | 'warning'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
}

const variantStyles: Record<ConfirmVariant, { button: string; shadow: string }> = {
  primary: {
    button: 'bg-gradient-to-r from-violet-600 to-fuchsia-600',
    shadow: 'shadow-lg shadow-violet-500/20',
  },
  delete: {
    button: 'bg-gradient-to-r from-red-600 to-rose-600',
    shadow: 'shadow-lg shadow-red-500/20',
  },
  success: {
    button: 'bg-gradient-to-r from-emerald-600 to-teal-600',
    shadow: 'shadow-lg shadow-emerald-500/20',
  },
  warning: {
    button: 'bg-gradient-to-r from-amber-600 to-orange-600',
    shadow: 'shadow-lg shadow-amber-500/20',
  },
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'primary',
}: ConfirmModalProps) {
  if (!isOpen) return null

  const style = variantStyles[variant]

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xs md:max-w-sm rounded-2xl border border-white/10 bg-[#161622] p-6 shadow-2xl">
        <h3 className="mb-2 text-xl font-bold text-white">{title}</h3>
        <p className="mb-6 text-sm text-slate-400 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`cursor-pointer rounded-xl px-4 py-2 text-sm text-white transition hover:opacity-90 ${style.button} ${style.shadow}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
