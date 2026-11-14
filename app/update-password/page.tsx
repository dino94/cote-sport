'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const exchangeCode = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            setError('Le lien est invalide ou a expiré. Veuillez refaire une demande.')
            return
          }
        } else {
          const { data } = await supabase.auth.getSession()

          if (!data.session) {
            setError('Lien invalide. Veuillez passer par la page Mot de passe oublié.')
            return
          }
        }

        setSessionReady(true)
      } catch {
        setError('Une erreur est survenue lors de la vérification du lien.')
      }
    }

    exchangeCode()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push('/login')
  }

  if (!sessionReady && !error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-full max-w-md bg-card border border-line/10 rounded-3xl p-8 text-center">
          <p className="text-sm text-muted">Vérification du lien...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-full max-w-md bg-card border border-line/10 rounded-3xl p-8 text-center space-y-4">
          <h1 className="text-2xl font-black text-ink">Réinitialisation impossible</h1>
          <p className="text-sm text-red-400">{error}</p>
          <Link href="/forgot-password" className="inline-flex text-primary font-bold hover:underline">
            Refaire une demande
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-card border border-line/10 rounded-3xl p-8">
        <h1 className="text-2xl font-black text-center mb-2 text-ink">Nouveau mot de passe</h1>
        <p className="text-sm text-muted text-center mb-6">
          Choisissez un nouveau mot de passe sécurisé.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="text-xs font-bold text-muted uppercase tracking-wide">
              Nouveau mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full mt-1 bg-bg border border-line/10 rounded-xl px-4 py-3 text-ink focus:border-primary focus:outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="text-xs font-bold text-muted uppercase tracking-wide">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full mt-1 bg-bg border border-line/10 rounded-xl px-4 py-3 text-ink focus:border-primary focus:outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-black font-black rounded-xl py-3 hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link href="/login" className="text-sm text-muted hover:text-ink transition">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}