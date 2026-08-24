import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?url'
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  ZoomIn,
  ZoomOut,
  X,
} from 'lucide-react'
import type { EncyclopediaPdf } from '../types/encyclopedia'
import { readEncyclopediaPdfData } from '../services/encyclopediaService'

// Configure PDF.js worker using Vite asset URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

type PdfReaderModalProps = {
  pdf: EncyclopediaPdf
  onClose: () => void
  onOpenExternal: (filePath: string) => void
}

const formatFileSize = (bytes: number) => {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

const base64ToUint8Array = (base64String: string): Uint8Array => {
  const pureBase64 = base64String.replace(/^data:application\/pdf;base64,/, '')
  const binaryString = atob(pureBase64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

export const PdfReaderModal = ({
  pdf,
  onClose,
  onOpenExternal,
}: PdfReaderModalProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const renderTaskRef = useRef<any>(null)

  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [pageNum, setPageNum] = useState(1)
  const [numPages, setNumPages] = useState(1)
  const [scale, setScale] = useState(1.2)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Load PDF Document
  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    setError('')

    const loadPdf = async () => {
      try {
        const dataUrl = await readEncyclopediaPdfData(pdf.filePath)
        if (!isMounted) return

        const bytes = base64ToUint8Array(dataUrl)
        const loadingTask = pdfjsLib.getDocument({ data: bytes })
        const loadedDoc = await loadingTask.promise
        if (!isMounted) return

        setPdfDoc(loadedDoc)
        setNumPages(loadedDoc.numPages)
        setPageNum(1)
      } catch (err) {
        console.error('Failed to load PDF document:', err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Could not load PDF document for reading.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadPdf()
    return () => {
      isMounted = false
    }
  }, [pdf])

  // Render Page to Canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return

    let isCancelled = false

    const renderPage = async () => {
      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel()
        }

        const page = await pdfDoc.getPage(pageNum)
        if (isCancelled || !canvasRef.current) return

        const viewport = page.getViewport({ scale })
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        if (!context) return

        const outputScale = window.devicePixelRatio || 1
        canvas.width = Math.floor(viewport.width * outputScale)
        canvas.height = Math.floor(viewport.height * outputScale)
        canvas.style.width = `${Math.floor(viewport.width)}px`
        canvas.style.height = `${Math.floor(viewport.height)}px`

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null
        const renderContext = {
          canvasContext: context,
          viewport,
          transform: transform ?? undefined,
        }

        const renderTask = page.render(renderContext)
        renderTaskRef.current = renderTask
        await renderTask.promise
      } catch (renderError: any) {
        if (renderError?.name !== 'RenderingCancelledException') {
          console.error('Page render error:', renderError)
        }
      }
    }

    renderPage()

    return () => {
      isCancelled = true
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
      }
    }
  }, [pdfDoc, pageNum, scale])

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        setPageNum((prev) => Math.max(prev - 1, 1))
        return
      }
      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault()
        setPageNum((prev) => Math.min(prev + 1, numPages))
        return
      }
      if (event.key === '+' || event.key === '=') {
        event.preventDefault()
        setScale((prev) => Math.min(prev + 0.25, 3.0))
        return
      }
      if (event.key === '-' || event.key === '_') {
        event.preventDefault()
        setScale((prev) => Math.max(prev - 0.25, 0.5))
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [numPages, onClose])

  const handlePrevPage = () => setPageNum((prev) => Math.max(prev - 1, 1))
  const handleNextPage = () => setPageNum((prev) => Math.min(prev + 1, numPages))
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3.0))
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5))
  const handleFitWidth = () => {
    if (!containerRef.current) return
    const containerWidth = containerRef.current.clientWidth - 48
    if (containerWidth > 0) {
      setScale(Math.max(0.6, Math.min(2.5, containerWidth / 620)))
    }
  }

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        padding: '18px 24px',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          background: '#f8fafc',
          overflow: 'hidden',
          borderRadius: '14px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Custom Toolbar Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          {/* File Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '200px' }}>
            <FileText size={20} color="#2b5278" />
            <h3
              style={{
                margin: 0,
                fontSize: '1.05rem',
                fontWeight: 600,
                color: '#0f172a',
                maxWidth: '280px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={pdf.fileName}
            >
              {pdf.fileName}
            </h3>
            <span className="pill" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
              {formatFileSize(pdf.fileSize)}
            </span>
          </div>

          {/* Navigation & Zoom Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              background: '#f1f5f9',
              padding: '4px 12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Page Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                className="btn ghost"
                disabled={pageNum <= 1}
                style={{ padding: '3px 6px', height: 'auto', minHeight: 'unset' }}
                onClick={handlePrevPage}
                title="Previous Page (Left Arrow)"
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#334155', minWidth: '80px', textAlign: 'center' }}>
                Page {pageNum} of {numPages}
              </span>
              <button
                type="button"
                className="btn ghost"
                disabled={pageNum >= numPages}
                style={{ padding: '3px 6px', height: 'auto', minHeight: 'unset' }}
                onClick={handleNextPage}
                title="Next Page (Right Arrow)"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div style={{ width: '1px', height: '18px', background: '#cbd5e1' }} />

            {/* Zoom Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                className="btn ghost"
                disabled={scale <= 0.5}
                style={{ padding: '3px 6px', height: 'auto', minHeight: 'unset' }}
                onClick={handleZoomOut}
                title="Zoom Out (-)"
              >
                <ZoomOut size={16} />
              </button>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', minWidth: '45px', textAlign: 'center' }}>
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                className="btn ghost"
                disabled={scale >= 3.0}
                style={{ padding: '3px 6px', height: 'auto', minHeight: 'unset' }}
                onClick={handleZoomIn}
                title="Zoom In (+)"
              >
                <ZoomIn size={16} />
              </button>
              <button
                type="button"
                className="btn ghost"
                style={{ padding: '3px 8px', fontSize: '0.76rem', height: 'auto', minHeight: 'unset' }}
                onClick={handleFitWidth}
                title="Fit to Width"
              >
                Fit
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn ghost"
              style={{
                padding: '5px 12px',
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onClick={() => onOpenExternal(pdf.filePath)}
              title="Open in default external PDF app"
            >
              <ExternalLink size={14} />
              <span>Open Externally</span>
            </button>
            <button
              type="button"
              className="btn ghost"
              style={{
                padding: '5px 10px',
                fontSize: '0.85rem',
                color: '#64748b',
              }}
              onClick={onClose}
              title="Close Reader (Escape)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Canvas Display Viewport */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            overflow: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '24px',
            background: '#e2e8f0',
          }}
        >
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569', fontSize: '1rem' }}>
              Opening PDF document...
            </div>
          ) : error ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: '#dc2626' }}>
              <p style={{ margin: 0 }}>{error}</p>
              <button
                type="button"
                className="btn primary"
                onClick={() => onOpenExternal(pdf.filePath)}
              >
                Open in Desktop App
              </button>
            </div>
          ) : (
            <div
              style={{
                background: '#ffffff',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                borderRadius: '4px',
                lineHeight: 0,
              }}
            >
              <canvas ref={canvasRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
