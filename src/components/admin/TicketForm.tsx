import type { FormEvent } from 'react'

import type { events } from '@/types'

export interface FeedbackState {
  type: 'success' | 'error'
  message: string
}

export const initialTicketForm = {
  eventId: '',
  name: '',
  price: '',
  quantity: '',
  advantages: '',
  available: true,
}

interface TicketFormProps {
  events: events[]
  values: typeof initialTicketForm
  onChange: (
    event: FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  isPending: boolean
  feedback: FeedbackState | null
  submitLabel: string
  pendingLabel: string
}

export default function TicketForm({
  events,
  values,
  onChange,
  onSubmit,
  onCancel,
  isPending,
  feedback,
  submitLabel,
  pendingLabel,
}: TicketFormProps) {
  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-white/80">
          <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Événement associé</span>
          <select
            name="eventId"
            value={values.eventId}
            onChange={onChange as (event: FormEvent<HTMLSelectElement>) => void}
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
            required
          >
            <option value="">Sélectionnez un événement</option>
            {events.map((event) => (
              <option key={event.$id} value={event.$id}>
                {event.name}
              </option>
            ))}
          </select>
        </label>
        <Field label="Nom" name="name" value={values.name} onChange={onChange} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Prix" name="price" type="number" value={values.price} onChange={onChange} required min={0} />
        <Field
          label="Quantité totale"
          name="quantity"
          type="number"
          value={values.quantity}
          onChange={onChange}
          required
          min={0}
        />
        <label className="flex items-center gap-3 text-sm text-white/70">
          <input
            type="checkbox"
            name="available"
            checked={Boolean(values.available)}
            onChange={onChange as (event: FormEvent<HTMLInputElement>) => void}
            className="h-4 w-4 rounded border border-white/20 bg-black text-main focus:ring-main"
          />
          <span>Ticket disponible</span>
        </label>
      </div>
      <Textarea
        label="Avantages"
        name="advantages"
        value={values.advantages}
        onChange={onChange}
        helperText="Un avantage par ligne"
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {feedback && (
          <p className={`text-sm ${feedback.type === 'success' ? 'text-emerald-300' : 'text-red-400'}`}>{feedback.message}</p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2 text-[11px] uppercase tracking-[0.35em] text-white/60 transition hover:border-white/25 hover:text-white"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-black/40 px-5 py-2 text-[11px] uppercase tracking-[0.35em] text-white/80 transition hover:border-[rgba(201,161,77,0.55)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? pendingLabel : submitLabel}
          </button>
        </div>
      </div>
    </form>
  )
}

interface FieldProps {
  label: string
  name: string
  value: string
  type?: string
  required?: boolean
  min?: number
  onChange: (event: FormEvent<HTMLInputElement>) => void
}

function Field({ label, name, value, onChange, required, type = 'text', min }: FieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-white/80">
      <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">{label}</span>
      <input
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        type={type}
        min={min}
        className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
      />
    </label>
  )
}

interface TextareaProps {
  label: string
  name: string
  value: string
  helperText?: string
  onChange: (event: FormEvent<HTMLTextAreaElement>) => void
}

function Textarea({ label, name, value, onChange, helperText }: TextareaProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-white/80">
      <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">{label}</span>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
      />
      {helperText && <span className="text-xs text-white/45">{helperText}</span>}
    </label>
  )
}

export function parseLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}
