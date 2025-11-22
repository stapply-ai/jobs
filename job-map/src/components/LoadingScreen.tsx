interface LoadingScreenProps {
  stage: string;
  current?: number;
  total?: number;
}

export function LoadingScreen({ stage, current, total }: LoadingScreenProps) {
  const progress = current && total ? (current / total) * 100 : 0;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f172a',
      color: '#e2e8f0',
      gap: '32px'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        minWidth: '280px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '2px solid rgba(59, 130, 246, 0.2)',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />

        <p style={{
          fontSize: '14px',
          color: '#94a3b8',
          margin: 0,
          fontWeight: '400'
        }}>
          {stage}
        </p>

        {current !== undefined && total !== undefined && total > 0 && (
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginTop: '8px'
          }}>
            <div style={{
              width: '100%',
              height: '2px',
              backgroundColor: '#1e293b',
              borderRadius: '1px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: '#3b82f6',
                transition: 'width 0.2s ease',
                borderRadius: '1px'
              }} />
            </div>
            <p style={{
              fontSize: '12px',
              color: '#64748b',
              margin: 0,
              textAlign: 'center'
            }}>
              {current} / {total}
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
