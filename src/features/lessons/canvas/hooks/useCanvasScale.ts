import { useEffect, useRef, useState } from 'react'

export function useCanvasScale(canvasWidth: number) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const containerWidth = entries[0]?.contentRect.width ?? canvasWidth
      setScale(containerWidth / canvasWidth)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [canvasWidth])

  return { wrapperRef, scale }
}
