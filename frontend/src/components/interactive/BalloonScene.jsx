import { Wind } from 'lucide-react'

export default function BalloonScene({ level, target = [0.25, 0.7], active, score }) {
  const [minimum, maximum] = target
  const inZone = level >= minimum && level <= maximum
  const lift = Math.round(Math.min(1, level) * 185)
  return (
    <div className={`balloon-scene ${active ? 'is-active' : ''} ${inZone ? 'is-in-zone' : ''}`}>
      <div className="balloon-scene__sky" aria-hidden="true">
        <span className="balloon-scene__cloud balloon-scene__cloud--one" />
        <span className="balloon-scene__cloud balloon-scene__cloud--two" />
        <div className="balloon-scene__balloon" style={{ transform: `translateY(${-lift}px)` }}>
          <span className="balloon-scene__shine" />
          <span className="balloon-scene__knot" />
          <span className="balloon-scene__string" />
        </div>
        <span className="balloon-scene__ground" />
      </div>
      <div className="balloon-meter" aria-label={`Voice level ${Math.round(level * 100)} percent`}>
        <div className="balloon-meter__labels"><span>Soft</span><strong><Wind aria-hidden="true" /> Steady zone</strong><span>Strong</span></div>
        <div className="balloon-meter__track">
          <span className="balloon-meter__zone" style={{ left: `${minimum * 100}%`, width: `${(maximum - minimum) * 100}%` }} />
          <span className="balloon-meter__level" style={{ width: `${Math.min(1, level) * 100}%` }} />
        </div>
      </div>
      {Number.isFinite(score) ? <div className="balloon-scene__score">Steady control <strong>{score}%</strong></div> : null}
    </div>
  )
}
