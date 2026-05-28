import { useT } from '../lib/i18n'

interface SectionHeadProps {
  num: string
  titleKey: string
  subKey: string
}

export function SectionHead({ num, titleKey, subKey }: SectionHeadProps) {
  const { t } = useT()
  return (
    <div className="section-head">
      <span className="section-num">{num}</span>
      <span className="section-title">{t(titleKey)}</span>
      <span className="section-sub">{t(subKey)}</span>
    </div>
  )
}
