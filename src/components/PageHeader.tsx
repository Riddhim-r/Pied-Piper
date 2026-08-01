import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  description?: string
  actionSlot?: ReactNode
}

const PageHeader = ({ title, description, actionSlot }: PageHeaderProps) => {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actionSlot ? <div className="header-actions">{actionSlot}</div> : null}
    </div>
  )
}

export default PageHeader