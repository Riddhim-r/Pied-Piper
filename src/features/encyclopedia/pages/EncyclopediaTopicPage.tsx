import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ExternalLink, Eye, FileText, Upload } from 'lucide-react'
import ConfirmDialog from '../../../components/ConfirmDialog'
import PageHeader from '../../../components/PageHeader'
import TopNav from '../../../components/TopNav'
import { PdfReaderModal } from '../components/PdfReaderModal'
import {
  createEncyclopediaLink,
  deleteEncyclopediaLink,
  deleteEncyclopediaPdf,
  getEncyclopediaLinks,
  getEncyclopediaPdfs,
  getEncyclopediaTopic,
  openEncyclopediaLink,
  openEncyclopediaPdfExternal,
  updateEncyclopediaLink,
  uploadEncyclopediaPdf,
} from '../services/encyclopediaService'
import type { EncyclopediaLink, EncyclopediaPdf, EncyclopediaTopic } from '../types/encyclopedia'

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback
}

const formatFileSize = (bytes: number) => {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

const EncyclopediaTopicPage = () => {
  const { topicId = '' } = useParams()
  const [topic, setTopic] = useState<EncyclopediaTopic | null>(null)
  const [links, setLinks] = useState<EncyclopediaLink[]>([])
  const [pdfs, setPdfs] = useState<EncyclopediaPdf[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingPdf, setIsUploadingPdf] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [pendingDeletePdfId, setPendingDeletePdfId] = useState<string | null>(null)
  const [activeViewingPdf, setActiveViewingPdf] = useState<EncyclopediaPdf | null>(null)
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const loadTopic = async () => {
    setIsLoading(true)
    setError('')

    try {
      const [loadedTopic, loadedLinks, loadedPdfs] = await Promise.all([
        getEncyclopediaTopic(topicId),
        getEncyclopediaLinks(topicId),
        getEncyclopediaPdfs(topicId),
      ])
      setTopic(loadedTopic)
      setLinks(loadedLinks)
      setPdfs(loadedPdfs)
    } catch (loadError) {
      console.error(loadError)
      setError(getErrorMessage(loadError, 'Unable to load this topic.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTopic()
  }, [topicId])

  const resetForm = () => {
    setLabel('')
    setUrl('')
    setEditingId(null)
    setError('')
  }

  const openCreateForm = () => {
    resetForm()
    setShowForm(true)
  }

  const openEditForm = (link: EncyclopediaLink) => {
    setLabel(link.label)
    setUrl(link.url)
    setEditingId(link.id)
    setError('')
    setShowForm(true)
  }

  const closeForm = () => {
    resetForm()
    setShowForm(false)
  }

  const saveLink = async () => {
    const trimmedLabel = label.trim()
    const trimmedUrl = url.trim()

    if (!trimmedLabel || !trimmedUrl) {
      setError('Link name and URL are required.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const input = { label: trimmedLabel, url: trimmedUrl }
      if (editingId) {
        await updateEncyclopediaLink(editingId, input)
      } else {
        await createEncyclopediaLink(topicId, input)
      }

      closeForm()
      await loadTopic()
    } catch (saveError) {
      console.error(saveError)
      setError(getErrorMessage(saveError, 'Could not save link.'))
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDeleteId) {
      return
    }

    try {
      await deleteEncyclopediaLink(pendingDeleteId)
      setPendingDeleteId(null)
      await loadTopic()
    } catch (deleteError) {
      console.error(deleteError)
      setError(getErrorMessage(deleteError, 'Could not remove link.'))
    }
  }

  const handleUploadPdf = async () => {
    try {
      setError('')
      setIsUploadingPdf(true)
      const res = await uploadEncyclopediaPdf(topicId)
      if (!res.canceled) {
        await loadTopic()
      }
    } catch (uploadErr) {
      console.error(uploadErr)
      setError(getErrorMessage(uploadErr, 'Could not upload PDF document.'))
    } finally {
      setIsUploadingPdf(false)
    }
  }

  const confirmDeletePdf = async () => {
    if (!pendingDeletePdfId) {
      return
    }

    try {
      await deleteEncyclopediaPdf(pendingDeletePdfId)
      setPendingDeletePdfId(null)
      await loadTopic()
    } catch (deleteErr) {
      console.error(deleteErr)
      setError(getErrorMessage(deleteErr, 'Could not remove PDF document.'))
    }
  }

  const openLink = async (linkUrl: string) => {
    try {
      setError('')
      await openEncyclopediaLink(linkUrl)
    } catch (openError) {
      console.error(openError)
      setError(getErrorMessage(openError, 'Could not open link.'))
    }
  }

  return (
    <div className="page">
      <TopNav
        title="Pied Piper"
        subtitle="Encyclopedia"
        rightSlot={
          <Link className="btn ghost" to="/encyclopedia">
            Back to Topics
          </Link>
        }
      />

      <div className="content">
        <ConfirmDialog
          open={pendingDeleteId !== null}
          title="Remove Link?"
          message="This link will be removed permanently from the topic."
          confirmText="Remove"
          cancelText="Cancel"
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={confirmDelete}
        />

        <ConfirmDialog
          open={pendingDeletePdfId !== null}
          title="Remove PDF Document?"
          message="This PDF document will be deleted from your topic storage."
          confirmText="Remove PDF"
          cancelText="Cancel"
          onCancel={() => setPendingDeletePdfId(null)}
          onConfirm={confirmDeletePdf}
        />

        {activeViewingPdf ? (
          <PdfReaderModal
            pdf={activeViewingPdf}
            onClose={() => setActiveViewingPdf(null)}
            onOpenExternal={openEncyclopediaPdfExternal}
          />
        ) : null}

        {isLoading ? <div className="card">Loading topic...</div> : null}

        {!isLoading && !topic ? (
          <div className="card empty-state">
            <h3>Topic not found</h3>
            <p>This topic may have been deleted or moved to the Recycle Bin.</p>
          </div>
        ) : null}

        {!isLoading && topic ? (
          <>
            <PageHeader
              title={topic.title}
              description={topic.description || 'Store useful links & PDF documents for this topic.'}
              actionSlot={
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn primary"
                    type="button"
                    disabled={isUploadingPdf}
                    onClick={handleUploadPdf}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Upload size={16} />
                    <span>{isUploadingPdf ? 'Uploading...' : 'Upload PDF'}</span>
                  </button>
                  <button
                    className="btn ghost"
                    type="button"
                    data-global-create
                    onClick={openCreateForm}
                  >
                    Add Link
                  </button>
                </div>
              }
            />

            {showForm ? (
              <div className="card form-grid">
                <label className="field">
                  <span>Link name</span>
                  <input
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                    placeholder="React documentation"
                    maxLength={160}
                  />
                </label>

                <label className="field">
                  <span>URL</span>
                  <input
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://react.dev"
                    maxLength={2000}
                  />
                </label>

                {error ? <p className="error">{error}</p> : null}

                <div className="form-actions">
                  <button className="btn ghost" type="button" data-global-close onClick={closeForm}>
                    Cancel
                  </button>
                  <button className="btn primary" type="button" disabled={isSaving} onClick={saveLink}>
                    {isSaving ? 'Saving...' : editingId ? 'Update Link' : 'Add Link'}
                  </button>
                </div>
              </div>
            ) : null}

            {!showForm && error ? <p className="error">{error}</p> : null}

            {/* PDF Documents Section */}
            <div style={{ marginTop: '24px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>PDF Documents ({pdfs.length})</h2>
              </div>

              {pdfs.length === 0 ? (
                <div className="card empty-state" style={{ padding: '24px' }}>
                  <h3>No PDF documents uploaded yet</h3>
                  <p>Click "Upload PDF" above to add reference PDFs to this topic.</p>
                </div>
              ) : (
                <div className="stack" style={{ gap: '12px' }}>
                  {pdfs.map((pdf) => (
                    <div className="card" key={pdf.id} style={{ padding: '16px 20px' }}>
                      <div className="card-head" style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FileText size={20} color="#2b5278" />
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{pdf.fileName}</h3>
                            <span className="muted" style={{ fontSize: '0.8rem' }}>
                              {formatFileSize(pdf.fileSize)} • Added {new Date(pdf.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="card-actions" style={{ gap: '8px', marginTop: '12px' }}>
                        <button
                          className="btn primary"
                          type="button"
                          style={{ padding: '4px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => setActiveViewingPdf(pdf)}
                        >
                          <Eye size={14} />
                          <span>Read PDF</span>
                        </button>
                        <button
                          className="btn ghost"
                          type="button"
                          style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => openEncyclopediaPdfExternal(pdf.filePath)}
                        >
                          <ExternalLink size={14} />
                          <span>Open Externally</span>
                        </button>
                        <button
                          className="btn danger"
                          type="button"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={() => setPendingDeletePdfId(pdf.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saved Links Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Saved Links ({links.length})</h2>
              </div>

              {links.length === 0 ? (
                <div className="card empty-state" style={{ padding: '24px' }}>
                  <h3>No links yet</h3>
                  <p>Add the first useful link to this topic using the button above.</p>
                </div>
              ) : (
                <div className="stack" style={{ gap: '12px' }}>
                  {links.map((link) => (
                    <div className="card" key={link.id} style={{ padding: '16px 20px' }}>
                      <div className="card-head">
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{link.label}</h3>
                          <p className="saved-url" style={{ margin: '4px 0 0 0' }}>{link.url}</p>
                        </div>
                      </div>

                      <div className="card-actions" style={{ gap: '8px', marginTop: '12px' }}>
                        <button className="btn primary" type="button" style={{ padding: '4px 12px', fontSize: '0.78rem' }} onClick={() => openLink(link.url)}>
                          Open
                        </button>
                        <button className="btn ghost" type="button" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => openEditForm(link)}>
                          Edit
                        </button>
                        <button
                          className="btn danger"
                          type="button"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={() => setPendingDeleteId(link.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default EncyclopediaTopicPage
