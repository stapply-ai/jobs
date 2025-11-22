interface StatsOverlayProps {
  totalJobs: number;
  displayedJobs: number;
  totalLocations: number;
}

export function StatsOverlay({ totalJobs, displayedJobs, totalLocations }: StatsOverlayProps) {
  return (
    <div style={{
      position: 'absolute',
      top: '24px',
      left: '24px',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(20px)',
      padding: '20px 24px',
      borderRadius: '16px',
      color: '#ffffff',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      minWidth: '200px',
      zIndex: 1,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        fontSize: '13px',
        letterSpacing: '0.01em'
      }}>
        <div style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'rgba(255, 255, 255, 0.5)',
          fontWeight: '500'
        }}>
          Stapply Job Map
        </div>

        <div style={{
          fontSize: '32px',
          fontWeight: '300',
          color: '#ffffff',
          lineHeight: '1',
          fontVariantNumeric: 'tabular-nums'
        }}>
          {displayedJobs.toLocaleString()}
        </div>

        <div style={{
          display: 'flex',
          gap: '16px',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          <div>
            <div style={{ fontVariantNumeric: 'tabular-nums' }}>
              {totalLocations.toLocaleString()}
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)' }}>
              locations
            </div>
          </div>
          <div style={{
            width: '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }} />
          <div>
            <div style={{ fontVariantNumeric: 'tabular-nums' }}>
              {totalJobs.toLocaleString()}
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)' }}>
              total
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
