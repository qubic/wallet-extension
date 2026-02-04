import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { clearOnboarded, openBrowserVault, setOnboarded } from '@/lib/vault'
import { useNavigate } from 'react-router-dom'

type AccountEntry = {
  name: string
  identity: string
}

const truncateIdentity = (identity: string) => {
  if (identity.length <= 12) {
    return identity
  }
  return `${identity.slice(0, 5)}…${identity.slice(-5)}`
}

const ManageAccounts = () => {
  const navigate = useNavigate()
  const [passphrase, setPassphrase] = useState('')
  const [accounts, setAccounts] = useState<AccountEntry[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const currentIdentity = localStorage.getItem('currentIdentity')

  useEffect(() => {
    if (hasLoaded && accounts.length === 0 && !loading) {
      clearOnboarded()
      navigate('/')
    }
  }, [accounts.length, hasLoaded, loading, navigate])

  const loadAccounts = async () => {
    setStatus(null)
    setLoading(true)
    try {
      const vault = await openBrowserVault(passphrase, false)
      const entries = vault.list().map((entry) => ({
        name: entry.name,
        identity: entry.identity,
      }))
      setAccounts(entries)
      setHasLoaded(true)
      setLoading(false)
    } catch (error) {
      setLoading(false)
      setHasLoaded(true)
      setStatus(error instanceof Error ? error.message : 'Failed to open vault.')
    }
  }

  const setActive = (identity: string, name: string) => {
    setOnboarded(identity, name)
  }

  const removeAccount = async (identity: string) => {
    setStatus(null)
    setLoading(true)
    try {
      const vault = await openBrowserVault(passphrase, false)
      await vault.remove(identity)
      await vault.save()
      const entries = vault.list().map((entry) => ({
        name: entry.name,
        identity: entry.identity,
      }))
      setAccounts(entries)
      setHasLoaded(true)
      setLoading(false)
      if (entries.length === 0) {
        clearOnboarded()
        navigate('/')
      } else if (identity === currentIdentity) {
        setOnboarded(entries[0].identity, entries[0].name)
      }
    } catch (error) {
      setLoading(false)
      setStatus(error instanceof Error ? error.message : 'Failed to remove account.')
    }
  }

  return (
    <section className="flex h-full w-full flex-col items-center justify-center gap-6 px-6">
      <div className="w-full max-w-sm space-y-2 text-center">
        <h2 className="text-lg font-semibold">Manage Accounts</h2>
        <p className="text-sm text-muted-foreground">Unlock your vault to view accounts.</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <Label htmlFor="passphrase">Vault passphrase</Label>
        <Input
          id="passphrase"
          type="password"
          value={passphrase}
          onChange={(event) => setPassphrase(event.target.value)}
        />
        <Button onClick={loadAccounts} disabled={!passphrase || loading}>
          {loading ? 'Loading...' : 'Load accounts'}
        </Button>
        {status && <p className="text-xs text-destructive">{status}</p>}
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        {accounts.map((account) => (
          <Card key={account.identity} className="border-border/60 bg-card/80">
            <CardContent className="flex items-center justify-between gap-3 p-3">
              <div className="text-sm">
                <p className="font-semibold">{account.name}</p>
                <p className="text-xs text-muted-foreground">
                  {truncateIdentity(account.identity)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={account.identity === currentIdentity ? 'secondary' : 'outline'}
                  onClick={() => setActive(account.identity, account.name)}
                >
                  {account.identity === currentIdentity ? 'Active' : 'Select'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => removeAccount(account.identity)}>
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {accounts.length === 0 && !loading && (
          <p className="text-center text-xs text-muted-foreground">No accounts loaded yet.</p>
        )}
      </div>
    </section>
  )
}

export default ManageAccounts
