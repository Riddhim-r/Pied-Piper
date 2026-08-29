import React, { useEffect, useRef, useImperativeHandle, forwardRef, useLayoutEffect } from 'react'

export interface AutoResizingTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number
}

export const AutoResizingTextarea = forwardRef<
  HTMLTextAreaElement,
  AutoResizingTextareaProps
>(({ value, onChange, style, rows = 3, ...props }, ref) => {
  const internalRef = useRef<HTMLTextAreaElement>(null)
  useImperativeHandle(ref, () => internalRef.current!)

  const initialMinHeightRef = useRef<number>(0)

  const adjustHeight = () => {
    const textarea = internalRef.current
    if (!textarea) return

    // Capture initial height (default height based on rows/CSS) on first measurement
    if (initialMinHeightRef.current === 0 && textarea.offsetHeight > 0) {
      initialMinHeightRef.current = textarea.offsetHeight
    }

    // Border height (top + bottom) when box-sizing is border-box
    const borderHeight = textarea.offsetHeight - textarea.clientHeight

    // Temporarily reset height to 'auto' to measure true scrollHeight
    textarea.style.height = 'auto'

    const calculatedContentHeight = textarea.scrollHeight + borderHeight
    const targetHeight = Math.max(initialMinHeightRef.current, calculatedContentHeight)

    textarea.style.height = `${targetHeight}px`
  }

  useLayoutEffect(() => {
    adjustHeight()
  }, [value])

  useEffect(() => {
    const handleResize = () => adjustHeight()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (props.onPaste) {
      props.onPaste(e)
    }
    if (e.defaultPrevented) return

    const text = e.clipboardData?.getData('text/plain')
    if (text !== undefined) {
      e.preventDefault()

      const textarea = internalRef.current || (e.target as HTMLTextAreaElement)
      const start = textarea.selectionStart ?? 0
      const end = textarea.selectionEnd ?? 0
      const currentValue = textarea.value ?? ''

      const newValue = currentValue.substring(0, start) + text + currentValue.substring(end)
      const newCursorPos = start + text.length

      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(textarea, newValue)
      } else {
        textarea.value = newValue
      }

      textarea.selectionStart = newCursorPos
      textarea.selectionEnd = newCursorPos

      const event = new Event('input', { bubbles: true })
      textarea.dispatchEvent(event)
    }
  }

  return (
    <textarea
      ref={internalRef}
      value={value}
      rows={rows}
      onChange={(e) => {
        onChange?.(e)
        adjustHeight()
      }}
      onPaste={handlePaste}
      style={{
        resize: 'vertical',
        overflowY: 'hidden',
        boxSizing: 'border-box',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        tabSize: 4,
        ...style,
      }}
      {...props}
    />
  )
})

AutoResizingTextarea.displayName = 'AutoResizingTextarea'

export default AutoResizingTextarea
