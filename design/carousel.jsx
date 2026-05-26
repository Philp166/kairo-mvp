/**
 * Kairo Dashboard — Carousel
 * Horizontal sliding track of cells. One page per click.
 * Props:
 *   items        — array of data
 *   renderItem   — (item, idx) => ReactNode
 *   perPage      — cells visible per page (default 1)
 *   label        — small mono label shown in the controller
 *   counter      — bool, show "01 / 04" indicator (default true)
 */

const { useState: _csUseState } = React;

function Carousel({ items, renderItem, perPage = 1, label, counter = true }) {
  const [page, setPage] = _csUseState(0);
  const n = items.length;
  const pages = Math.max(1, Math.ceil(n / perPage));
  const safePage = Math.min(page, pages - 1);
  const go = (d) => setPage((p) => Math.max(0, Math.min(pages - 1, p + d)));
  const cellPct = 100 / perPage;
  const trackShift = safePage * 100; // shift by one viewport (= perPage cells)

  return (
    <div className="carousel">
      <div className="carousel-rail">
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${trackShift}%)` }}
        >
          {items.map((it, i) => (
            <div
              className="carousel-cell"
              key={i}
              style={{ flex: `0 0 ${cellPct}%` }}
            >
              {renderItem(it, i)}
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
          ‹
        </button>
        {counter && (
          <span className="carousel-counter mono">
            <span className="accent">{String(safePage + 1).padStart(2, '0')}</span>
            <span className="dim"> / {String(pages).padStart(2, '0')}</span>
          </span>
        )}
        <div className="carousel-dots">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              className={`carousel-dot ${i === safePage ? 'on' : ''}`}
              onClick={() => setPage(i)}
              aria-label={`go to page ${i + 1}`}
            />
          ))}
        </div>
        {label && (
          <span className="mono dim carousel-label">{label}</span>
        )}
        <button
          className="carousel-btn"
          onClick={() => go(1)}
          disabled={safePage === pages - 1}
          aria-label="next"
        >
          ›
        </button>
      </div>
    </div>
  );
}

window.Carousel = Carousel;
