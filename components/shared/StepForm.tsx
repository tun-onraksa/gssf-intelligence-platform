'use client'

import { ArrowLeft, ArrowRight, Check, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface Step {
  label: string
  icon: LucideIcon
}

interface StepFormProps {
  steps: Step[]
  currentStep: number
  title: string
  subtitle: string
  children: React.ReactNode
  onNext: () => void
  onBack: () => void
  onSubmit: () => void
  isLastStep: boolean
  isFirstStep: boolean
  nextDisabled?: boolean
  submitLabel?: string
}

export function StepForm({
  steps,
  currentStep,
  title,
  subtitle,
  children,
  onNext,
  onBack,
  onSubmit,
  isLastStep,
  isFirstStep,
  nextDisabled,
  submitLabel = 'Submit',
}: StepFormProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top nav ── */}
      <div className="border-b border-slate-200 bg-white px-6 py-3.5">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600">
              <span className="text-[10px] font-bold text-white">G</span>
            </div>
            <span className="text-sm font-semibold text-slate-800">GSSF Worlds 2026</span>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="mx-auto max-w-2xl px-4 pt-10 pb-16">
        {/* ── Progress stepper ── */}
        <div className="mb-8 flex items-start justify-center">
          {steps.map((step, i) => {
            const StepIcon = step.icon
            const isDone = i < currentStep
            const isActive = i === currentStep
            return (
              <div key={i} className="flex items-start">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-all duration-200 ${
                      isDone
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : isActive
                        ? 'border-blue-600 bg-white text-blue-600'
                        : 'border-slate-200 bg-white text-slate-400'
                    }`}
                  >
                    {isDone ? <Check size={12} strokeWidth={3} /> : <StepIcon size={12} />}
                  </div>
                  <span
                    className={`mt-1.5 max-w-[52px] text-center text-[10px] font-medium leading-tight ${
                      isActive ? 'text-blue-600' : isDone ? 'text-slate-500' : 'text-slate-300'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`mx-0.5 mt-4 h-px w-8 shrink-0 transition-colors duration-200 ${
                      i < currentStep ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* ── Title ── */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>

        {/* ── Card ── */}
        <div
          key={currentStep}
          className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg"
          style={{ animation: 'stepIn 0.15s ease' }}
        >
          {children}
        </div>

        {/* ── Navigation ── */}
        <div className="mt-5 flex items-center justify-between">
          {!isFirstStep ? (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft size={14} /> Back
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={isLastStep ? onSubmit : onNext}
            disabled={nextDisabled}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLastStep ? (
              submitLabel
            ) : (
              <>
                Continue <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
