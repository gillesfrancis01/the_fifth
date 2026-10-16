'use client'

import React, { ChangeEvent, FormEvent } from 'react'

export const emptyForm = {
  name: '',
  descriptionEn: '',
  descriptionFr: '',
  date: '',
  adresse: '',
  image: '',
  teaser: '',
}

export interface FeedbackState {
  type: 'success' | 'error'
  message: string
}

export interface EventFormProps {
  values: typeof emptyForm
  onChange: (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  isPending: boolean
  feedback: FeedbackState | null
  submitLabel: string
  pendingLabel: string
  selectedFile: File | null
  setSelectedFile: (file: File | null) => void
}

export default function EventForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  isPending,
  feedback,
  submitLabel,
  pendingLabel,
  selectedFile,
  setSelectedFile,
}: EventFormProps) {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom" name="name" value={values.name} onChange={onChange} required />
        <Field label="Date" name="date" type="datetime-local" value={values.date} onChange={onChange} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Adresse" name="adresse" value={values.adresse} onChange={onChange} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Visuel de l’événement</span>
        <div className="relative flex items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/40 p-4 transition hover:border-[rgba(201,161,77,0.55)]">
          {selectedFile ? (
            <div className="flex w-full items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-white/10">
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                  />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-white max-w-[200px] truncate">{selectedFile.name}</p>
                  <p className="text-xs text-white/45">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs uppercase tracking-wider text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
              >
                Supprimer
              </button>
            </div>
          ) : values.image ? (
            <div className="flex w-full items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-white/10">
                  <img
                    src={values.image}
                    alt="Current image"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-white max-w-[200px] truncate">Image actuelle</p>
                  <p className="text-xs text-white/45">Uploadez un fichier pour la remplacer</p>
                </div>
              </div>
              <label className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-wider text-white hover:bg-white/10">
                Remplacer
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 cursor-pointer opacity-0 w-0 h-0"
                />
              </label>
            </div>
          ) : (
            <label className="flex w-full cursor-pointer flex-col items-center justify-center py-4">
              <span className="text-xs text-white/60">Faites glisser ou cliquez pour choisir un fichier</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          )}
        </div>
      </div>

      <Field label="Teaser" name="teaser" value={values.teaser} onChange={onChange} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Textarea
          label="Description (EN)"
          name="descriptionEn"
          value={values.descriptionEn}
          onChange={onChange}
          rows={6}
          helperText="Séparez vos paragraphes par une ligne vide"
        />
        <Textarea
          label="Description (FR)"
          name="descriptionFr"
          value={values.descriptionFr}
          onChange={onChange}
          rows={6}
          helperText="Séparez vos paragraphes par une ligne vide"
        />
      </div>
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
  onChange: (event: FormEvent<HTMLInputElement>) => void
}

function Field({ label, name, value, onChange, required, type = 'text' }: FieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-white/80">
      <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">{label}</span>
      <input
        className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        type={type}
      />
    </label>
  )
}

interface TextareaProps {
  label: string
  name: string
  value: string
  rows?: number
  helperText?: string
  onChange: (event: FormEvent<HTMLTextAreaElement>) => void
}

function Textarea({ label, name, value, onChange, rows = 4, helperText }: TextareaProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-white/80">
      <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">{label}</span>
      <textarea
        className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[rgba(201,161,77,0.55)]"
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
      />
      {helperText && <span className="text-xs text-white/45">{helperText}</span>}
    </label>
  )
}
