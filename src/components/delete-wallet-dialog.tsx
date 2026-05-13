import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { clearWalletStorage } from '@/lib/storage'

type DeleteWalletDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DeleteWalletDialog = ({ open, onOpenChange }: DeleteWalletDialogProps) => {
  const { t } = useTranslation()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    if (isDeleting) return
    setIsDeleting(true)
    try {
      await clearWalletStorage()
    } catch {
      // Wipe is best-effort; reload regardless so the router re-evaluates onboarded state.
    }
    window.location.hash = '/'
    window.location.reload()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('settings.security.resetAppTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('settings.security.resetAppDesc')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {t('settings.security.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {t('settings.security.resetAppConfirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default DeleteWalletDialog
