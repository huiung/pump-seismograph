import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Pump Seismograph - Memecoin Earthquake Monitor';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  // Generate seismograph wave points
  const waves = Array.from({ length: 60 }, (_, i) => {
    const x = i * 18 + 40;
    const spike = (i > 20 && i < 30) ? Math.sin((i - 20) * 0.8) * (i < 25 ? 40 + (i - 20) * 15 : 40 + (30 - i) * 15) : 0;
    const noise = Math.sin(i * 2.5) * 3 + Math.cos(i * 4) * 2;
    return { x, y: 315 + spike + noise };
  });

  const wave2 = Array.from({ length: 60 }, (_, i) => {
    const x = i * 18 + 40;
    const spike = (i > 35 && i < 45) ? Math.sin((i - 35) * 0.7) * (i < 40 ? 30 + (i - 35) * 10 : 30 + (45 - i) * 10) : 0;
    const noise = Math.sin(i * 3) * 2 + Math.cos(i * 5) * 1.5;
    return { x, y: 420 + spike + noise };
  });

  const pathD = waves.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const pathD2 = wave2.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0a0a',
          padding: '50px 60px',
          fontFamily: 'monospace',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Grid lines */}
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={`h${i}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: i * 90,
              height: 1,
              backgroundColor: 'rgba(34, 197, 94, 0.08)',
            }}
          />
        ))}
        {Array.from({ length: 14 }, (_, i) => (
          <div
            key={`v${i}`}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: i * 90,
              width: 1,
              backgroundColor: 'rgba(34, 197, 94, 0.08)',
            }}
          />
        ))}

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              fontSize: 52,
              fontWeight: 900,
              color: '#22c55e',
              letterSpacing: '-1px',
              textShadow: '0 0 30px rgba(34, 197, 94, 0.5)',
            }}
          >
            PUMP SEISMOGRAPH
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 22,
            color: 'rgba(255, 255, 255, 0.5)',
            marginTop: 12,
            letterSpacing: '1px',
          }}
        >
          MEMECOIN EARTHQUAKE MONITOR
        </div>

        {/* Seismograph waves */}
        <div style={{ display: 'flex', flex: 1, position: 'relative', marginTop: 20 }}>
          {/* Labels */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 105,
              fontSize: 14,
              color: '#22d3ee',
              letterSpacing: '1px',
            }}
          >
            AI
          </div>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 210,
              fontSize: 14,
              color: '#fb923c',
              letterSpacing: '1px',
            }}
          >
            DOG
          </div>

          <svg
            width="1100"
            height="350"
            viewBox="0 0 1100 350"
            style={{ position: 'absolute', left: 0, top: 0 }}
          >
            <path d={pathD} fill="none" stroke="#22d3ee" strokeWidth="2.5" />
            <path d={pathD2} fill="none" stroke="#fb923c" strokeWidth="2.5" />
          </svg>
        </div>

        {/* Richter badge */}
        <div
          style={{
            position: 'absolute',
            right: 60,
            top: 50,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '16px 28px',
            border: '2px solid rgba(239, 68, 68, 0.6)',
            borderRadius: 12,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
          }}
        >
          <div style={{ fontSize: 14, color: '#ef4444', letterSpacing: '2px' }}>
            RICHTER
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: '#ef4444',
              textShadow: '0 0 20px rgba(239, 68, 68, 0.5)',
            }}
          >
            7.2
          </div>
        </div>

        {/* Bottom tagline */}
        <div
          style={{
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.3)',
            letterSpacing: '2px',
          }}
        >
          REAL-TIME PUMP.FUN TOKEN ACTIVITY VISUALIZATION
        </div>
      </div>
    ),
    { ...size },
  );
}
