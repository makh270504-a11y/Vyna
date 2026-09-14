'use client'

import React, { useState } from 'react'
import { subscribeToNewsletter } from './actions'
import { toast } from 'sonner'

export function NewsletterForm() {
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const result = await subscribeToNewsletter(formData)

    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else if (result.success) {
      toast.success(result.message)
      const form = event.target as HTMLFormElement
      form.reset()
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row max-w-md mx-auto gap-3">
      <input 
        type="email" 
        name="email"
        placeholder="Votre adresse email" 
        className="flex-1 px-5 py-3 rounded-full border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all shadow-sm"
        required
        disabled={loading}
      />
      <button 
        type="submit" 
        disabled={loading}
        className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "En cours..." : "M'inscrire"}
      </button>
    </form>
  )
}
