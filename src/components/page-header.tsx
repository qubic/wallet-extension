import type { ReactNode } from 'react'
import { ArrowLeftIcon } from 'lucide-react'

type PageHeaderProps = {
  title: ReactNode
  onBack: () => void
}

const PageHeader = ({ title, onBack }: PageHeaderProps) => {
  return (
    <div className="relative flex items-center justify-center py-3">
      <button
        type="button"
        className="absolute left-0 cursor-pointer p-1 text-muted-foreground transition-colors hover:text-foreground"
        onClick={onBack}
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </button>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  )
}

export default PageHeader
