import { useEffect } from "react"

type Props = {
  imgs: string[]
  index: number
  title: string
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}

export default function ImageViewer({ imgs, index, title, onClose, onNext, onPrev }: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onNext()
      if (e.key === "ArrowLeft") onPrev()
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onNext, onPrev, onClose])

  return (
    <div className="viewer-overlay" onClick={onClose}>
      <button className="viewer-close" onClick={onClose}>✕ Fermer</button>

      <img
        className="viewer-img"
        src={imgs[index]}
        alt={`${title} - ${index + 1}`}
        onClick={e => e.stopPropagation()}
      />

      {imgs.length > 1 && (
        <div className="viewer-controls" onClick={e => e.stopPropagation()}>
          <button className="viewer-btn" onClick={onPrev} disabled={index === 0}>←</button>
          <span className="viewer-counter">{index + 1} / {imgs.length}</span>
          <button className="viewer-btn" onClick={onNext} disabled={index === imgs.length - 1}>→</button>
        </div>
      )}
    </div>
  )
}