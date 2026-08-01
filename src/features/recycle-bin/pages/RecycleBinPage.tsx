import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../../components/PageHeader'
import TopNav from '../../../components/TopNav'
import { getRecycleBinCategories } from '../services/recycleBinService'
import type { RecycleBinCategory } from '../types/recycleBin'

const getErrorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : 'Unable to load the Recycle Bin.'
}

const RecycleBinPage = () => {
  const [categories, setCategories] = useState<RecycleBinCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategories(await getRecycleBinCategories())
      } catch (loadError) {
        console.error(loadError)
        setError(getErrorMessage(loadError))
      } finally {
        setIsLoading(false)
      }
    }

    loadCategories()
  }, [])

  const totalItems = categories.reduce((total, category) => total + category.itemCount, 0)

  return (
    <div className="page">
      <TopNav
        title="Pied Piper"
        subtitle="Recycle Bin"
        rightSlot={
          <Link className="btn ghost" to="/dashboard">
            Back
          </Link>
        }
      />

      <div className="content">
        <PageHeader
          title="Recycle Bin"
          description={`${totalItems} deleted ${totalItems === 1 ? 'item' : 'items'} across all categories.`}
        />

        {error ? <p className="error">{error}</p> : null}
        {isLoading ? <div className="card">Loading Recycle Bin...</div> : null}

        {!isLoading ? (
          <div className="grid">
            {categories.map((category) => (
              <Link
                className="card link-card recycle-category-card"
                key={category.id}
                to={`/recycle-bin/${category.id}`}
              >
                <h3>{category.label}</h3>
                <p className="metric">{category.itemCount}</p>
                <span className="muted">
                  {category.itemCount === 1 ? 'deleted item' : 'deleted items'}
                </span>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default RecycleBinPage
