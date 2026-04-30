import { Progress } from '@/components/ui/progress'

type FlowHeaderProps = {
  title: string
  subtitle?: string
  stepLabel: string
  progressValue: number
}

const FlowHeader = ({ title, subtitle, stepLabel, progressValue }: FlowHeaderProps) => (
  <div className="space-y-3 text-center">
    <div className="space-y-1">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{stepLabel}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
    <Progress value={progressValue} />
  </div>
)

export default FlowHeader
