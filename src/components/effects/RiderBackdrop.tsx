import './RiderBackdrop.css';

/** Лёгкий grainy-gradient без SVG blur-фильтров */
export default function RiderBackdrop() {
  return (
    <div className="rider-backdrop" aria-hidden="true">
      <div className="rider-backdrop__mesh" />
      <div className="rider-backdrop__blob rider-backdrop__blob--a" />
      <div className="rider-backdrop__blob rider-backdrop__blob--b" />
      <div className="rider-backdrop__noise" />
      <div className="rider-backdrop__vignette" />
    </div>
  );
}
