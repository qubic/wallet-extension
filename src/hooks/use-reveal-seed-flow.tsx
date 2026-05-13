import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { VaultInvalidPassphraseError, VaultEntryNotFoundError } from '@qubic-labs/sdk'
import { openBrowserVault } from '@/lib/vault'
import PassphrasePromptDrawer from '@/components/pages/manage-accounts/passphrase-prompt-drawer'
import RevealSeedDrawer from '@/components/pages/manage-accounts/reveal-seed-drawer'

type RevealTarget = { identity: string; name: string }

export const useRevealSeedFlow = (currentIdentity?: string) => {
  const { t } = useTranslation()
  const [target, setTarget] = useState<RevealTarget | null>(null)
  const [passphrasePromptOpen, setPassphrasePromptOpen] = useState(false)
  const [passphraseInput, setPassphraseInput] = useState('')
  const [passphraseError, setPassphraseError] = useState('')
  const [revealedSeed, setRevealedSeed] = useState('')
  const [isRevealOpen, setIsRevealOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (currentIdentity === undefined) return
    if (target && target.identity !== currentIdentity) {
      setTarget(null)
      setPassphrasePromptOpen(false)
      setPassphraseInput('')
      setPassphraseError('')
      setIsRevealOpen(false)
      setRevealedSeed('')
    }
  }, [currentIdentity, target])

  const openReveal = (newTarget: RevealTarget) => {
    setTarget(newTarget)
    setPassphraseInput('')
    setPassphraseError('')
    setPassphrasePromptOpen(true)
  }

  const handlePassphraseSubmit = async () => {
    if (!target || submitting) return
    if (!passphraseInput.trim()) {
      setPassphraseError(t('accounts.manage.errors.passphraseRequired'))
      return
    }
    setSubmitting(true)
    try {
      const vault = await openBrowserVault(passphraseInput, false)
      const seed = await vault.getSeed(target.identity)
      setRevealedSeed(seed)
      setPassphrasePromptOpen(false)
      setPassphraseInput('')
      setPassphraseError('')
      setIsRevealOpen(true)
    } catch (error) {
      if (
        error instanceof VaultInvalidPassphraseError ||
        error instanceof VaultEntryNotFoundError
      ) {
        setPassphraseError(t('accounts.manage.errors.invalidPassphrase'))
        return
      }
      setPassphraseError(t('accounts.manage.errors.reveal'))
    } finally {
      setSubmitting(false)
    }
  }

  const drawers = (
    <>
      <PassphrasePromptDrawer
        open={passphrasePromptOpen}
        passphrase={passphraseInput}
        error={passphraseError}
        loading={submitting}
        onOpenChange={(open) => {
          setPassphrasePromptOpen(open)
          if (!open) {
            setPassphraseInput('')
            setPassphraseError('')
          }
        }}
        onPassphraseChange={(value) => {
          setPassphraseInput(value)
          if (passphraseError) setPassphraseError('')
        }}
        onSubmit={handlePassphraseSubmit}
      />
      <RevealSeedDrawer
        open={isRevealOpen}
        seed={revealedSeed}
        accountName={target?.name ?? ''}
        onOpenChange={(open) => {
          setIsRevealOpen(open)
          if (!open) {
            setRevealedSeed('')
            setTarget(null)
          }
        }}
      />
    </>
  )

  return { openReveal, drawers }
}
