import { useState, type ReactNode } from 'react'

/* ── Types ─────────────────────────────────────────────────── */

interface CarouselProps {
  items: ReactNode[]
  perPage?: number
  label?: string
  counter?: boolean
}

/* ── Component ─────────────────────────────────────────────── */

export default function Carousel({
  items,
  perPage = 1,
  label,
  counter = true,
}: CarouselProps) {
  const [page, setPage] = useState(0)
  const n = items.length
  const pages = Math.max(1, Math.ceil(n / perPage))
  const safePage = Math.min(page, pages - 1)

  const go = (d: number) =>
    setPage((p) => Math.max(0, Math.min(pages - 1, p + d)))

  const cellPct = 100 / perPage
  const trackShift = safePage * 100

  return (
    <div className="carousel">
      <div className="carousel-rail">
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${trackShift}%)` }}
        >
          {items.map((item, i) => (
            <div
              className="carousel-cell"
              key={i}
              style={{ flex: `0 0 ${cellPct}%` }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="carousel-ctrl">
        <button
          className="carousel-btn"
          onClick={() => go(-1)}
          disabled={safePage === 0}
          aria-label="prev"
        >
          &lsaquo;
        </button>

        {counter && (
          <span className="carousel-counter mono">
            <span className="accent">
              {String(safePage + 1).padStart(2, '0')}
            </span>
            <span className="dim">
              {' '}
              / {String(pages).padStart(2, '0')}
            </span>
          </span>
        )}

        <div className="carousel-dots">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              className={`carousel-dot${i === safePage ? ' on' : ''}`}
              onClick={() => setPage(i)}
              aria-label={`go to page ${i + 1}`}
            />
          ))}
        </div>

        {label && <span className="mono dim carousel-label">{label}</span>}

        <button
          className="carousel-btn"
          onClick={() => go(1)}
          disabled={safePage === pages - 1}
          aria-label="next"
        >
          &rsaquo;
        </button>
      </div>
    </div>
  )
}
