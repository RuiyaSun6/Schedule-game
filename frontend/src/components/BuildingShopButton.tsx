// Compact Building Shop icon for the bottom-left of the World, in the HUD's pixel-panel style.
export default function BuildingShopButton({ onClick }: { onClick: () => void }) {
  return <button type="button" className="building-shop-button pixel-panel" onClick={onClick} aria-label="Open Building Shop" title="Building Shop">
    <svg width="30" height="30" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
      <path fill="#a9473f" d="M8 1 1 7h2v1h10V7h2z" />
      <path fill="#f1dfbf" d="M3 8h10v7H3z" />
      <path fill="#6b4a33" d="M7 10h2v5H7z" />
      <path fill="#bfe0e8" d="M4 9h2v2H4zM10 9h2v2h-2z" />
      <path fill="#edcd74" d="M12 1h3v3h-3z" />
      <path fill="#75624c" d="M13 2h1v1h-1z" />
    </svg>
  </button>;
}
