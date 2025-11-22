import { useState, useCallback, useMemo, useEffect, useImperativeHandle, forwardRef } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl } from 'react-map-gl/mapbox';
import type { JobMarker } from '../types';
import { StatsOverlay } from './StatsOverlay';
import type { MapControlCallbacks, ViewState } from '../utils/mapControl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface JobMapProps {
  jobs: JobMarker[];
  mapboxToken: string;
  totalJobs?: number;
  isLoadingMore?: boolean;
  loadingProgress?: { current: number; total: number };
  onMapControlReady?: (callbacks: MapControlCallbacks) => void;
  filteredJobs?: JobMarker[] | null;
  onViewStateChange?: (viewState: ViewState) => void;
}

interface ClusterMarker {
  lat: number;
  lng: number;
  jobs: JobMarker[];
  isCluster: boolean;
}

const MAX_ZOOM_FOR_CLUSTERING = 10;

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function createClusters(jobs: JobMarker[], zoom: number): ClusterMarker[] {
  if (zoom > MAX_ZOOM_FOR_CLUSTERING) {
    // Don't cluster at high zoom levels
    return jobs.map(job => ({
      lat: job.lat,
      lng: job.lng,
      jobs: [job],
      isCluster: false,
    }));
  }

  const clusters: ClusterMarker[] = [];
  const used = new Set<number>();

  // Simple clustering algorithm based on distance
  const clusterDistanceKm = 50 / Math.pow(2, zoom); // Decrease distance as zoom increases

  jobs.forEach((job, index) => {
    if (used.has(index)) return;

    const cluster: JobMarker[] = [job];
    used.add(index);

    // Find nearby jobs
    jobs.forEach((otherJob, otherIndex) => {
      if (used.has(otherIndex)) return;

      const distance = calculateDistance(job.lat, job.lng, otherJob.lat, otherJob.lng);
      if (distance < clusterDistanceKm) {
        cluster.push(otherJob);
        used.add(otherIndex);
      }
    });

    // Calculate cluster center
    const centerLat = cluster.reduce((sum, j) => sum + j.lat, 0) / cluster.length;
    const centerLng = cluster.reduce((sum, j) => sum + j.lng, 0) / cluster.length;

    clusters.push({
      lat: centerLat,
      lng: centerLng,
      jobs: cluster,
      isCluster: cluster.length > 1,
    });
  });

  return clusters;
}

export const JobMap = forwardRef<MapControlCallbacks, JobMapProps>(
  ({ jobs, mapboxToken, totalJobs, isLoadingMore, loadingProgress, onMapControlReady, filteredJobs, onViewStateChange }, ref) => {
    // Calculate initial view state based on jobs if available
    const getInitialViewState = (): ViewState => {
      if (jobs.length > 0) {
        // Calculate center of all jobs
        const validJobs = jobs.filter(j => !isNaN(j.lat) && !isNaN(j.lng));
        if (validJobs.length > 0) {
          const avgLat = validJobs.reduce((sum, j) => sum + j.lat, 0) / validJobs.length;
          const avgLng = validJobs.reduce((sum, j) => sum + j.lng, 0) / validJobs.length;
          return {
            longitude: avgLng,
            latitude: avgLat,
            zoom: 2,
          };
        }
      }
      return {
        longitude: -95.7129,
        latitude: 37.0902,
        zoom: 3.5,
      };
    };

    const [viewState, setViewState] = useState<ViewState>(getInitialViewState());

    // Update view state when jobs change (if initially empty)
    useEffect(() => {
      if (jobs.length > 0 && viewState.longitude === -95.7129 && viewState.latitude === 37.0902) {
        const newViewState = getInitialViewState();
        setViewState(newViewState);
      }
    }, [jobs.length]);

    const [popupJob, setPopupJob] = useState<JobMarker | null>(null);
    const [popupJobsAtLocation, setPopupJobsAtLocation] = useState<JobMarker[]>([]);
    const [currentJobIndex, setCurrentJobIndex] = useState(0);

    // Use filtered jobs if provided, otherwise use all jobs
    const displayJobs = useMemo(() => {
      return filteredJobs !== null && filteredJobs !== undefined ? filteredJobs : jobs;
    }, [jobs, filteredJobs]);

    const clusters = useMemo(() => {
      console.log(`Creating clusters from ${displayJobs.length} jobs`);
      const result = createClusters(displayJobs, viewState.zoom);
      console.log(`Created ${result.length} clusters`);
      return result;
    }, [displayJobs, viewState.zoom]);

    const uniqueLocations = useMemo(() => {
      const locations = new Set(displayJobs.map(job => job.location));
      return locations.size;
    }, [displayJobs]);

    // Map control callbacks
    const flyTo = useCallback((longitude: number, latitude: number, zoom?: number) => {
      setViewState(prev => ({
        ...prev,
        longitude,
        latitude,
        zoom: zoom !== undefined ? zoom : prev.zoom,
      }));
    }, []);

    const setZoom = useCallback((zoom: number) => {
      setViewState(prev => ({
        ...prev,
        zoom: Math.max(1, Math.min(15, zoom)),
      }));
    }, []);

    const setFilteredJobs = useCallback((_filtered: JobMarker[] | null) => {
      // This is handled by the filteredJobs prop from parent
      // We could emit an event here if needed
    }, []);

    const getViewState = useCallback((): ViewState => {
      return { ...viewState };
    }, [viewState]);

    // Expose callbacks via ref and callback
    const callbacks: MapControlCallbacks = useMemo(() => ({
      flyTo,
      setZoom,
      setFilteredJobs,
      getViewState,
    }), [flyTo, setZoom, setFilteredJobs, getViewState]);

    useEffect(() => {
      onMapControlReady?.(callbacks);
    }, [callbacks, onMapControlReady]);

    useImperativeHandle(ref, () => callbacks, [callbacks]);

    // Find all jobs at the same location (within a very small distance)
    const findJobsAtLocation = useCallback((lat: number, lng: number, allJobs: JobMarker[]): JobMarker[] => {
      const TOLERANCE_KM = 0.001; // ~100 meters - very small tolerance for "same location"
      return allJobs.filter(job => {
        const distance = calculateDistance(lat, lng, job.lat, job.lng);
        return distance < TOLERANCE_KM;
      });
    }, []);

    const handleClusterClick = useCallback((cluster: ClusterMarker) => {
      if (cluster.isCluster && cluster.jobs.length > 1) {
        // Check if we're zoomed in enough - if so, show popup instead of zooming
        if (viewState.zoom >= MAX_ZOOM_FOR_CLUSTERING) {
          // At high zoom, show popup with navigation
          const jobsAtLocation = findJobsAtLocation(cluster.lat, cluster.lng, displayJobs);
          setPopupJobsAtLocation(jobsAtLocation);
          setCurrentJobIndex(0);
          setPopupJob(jobsAtLocation[0]);
        } else {
          // Zoom in on cluster
          setViewState(prev => ({
            ...prev,
            longitude: cluster.lng,
            latitude: cluster.lat,
            zoom: Math.min(prev.zoom + 2, 15),
          }));
        }
      } else {
        // Single marker clicked - check if there are other jobs at the same location
        const jobsAtLocation = findJobsAtLocation(cluster.lat, cluster.lng, displayJobs);
        setPopupJobsAtLocation(jobsAtLocation);
        setCurrentJobIndex(0);
        setPopupJob(jobsAtLocation[0]);
      }
    }, [viewState.zoom, displayJobs, findJobsAtLocation]);

    const handleNextJob = useCallback(() => {
      const nextIndex = (currentJobIndex + 1) % popupJobsAtLocation.length;
      setCurrentJobIndex(nextIndex);
      setPopupJob(popupJobsAtLocation[nextIndex]);
    }, [currentJobIndex, popupJobsAtLocation]);

    const handlePrevJob = useCallback(() => {
      const prevIndex = currentJobIndex === 0 ? popupJobsAtLocation.length - 1 : currentJobIndex - 1;
      setCurrentJobIndex(prevIndex);
      setPopupJob(popupJobsAtLocation[prevIndex]);
    }, [currentJobIndex, popupJobsAtLocation]);

    const handleClosePopup = useCallback(() => {
      setPopupJob(null);
      setPopupJobsAtLocation([]);
      setCurrentJobIndex(0);
    }, []);

    // Keyboard navigation support
    useEffect(() => {
      if (!popupJob || popupJobsAtLocation.length <= 1) return;

      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handlePrevJob();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleNextJob();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          handleClosePopup();
        }
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => {
        window.removeEventListener('keydown', handleKeyPress);
      };
    }, [popupJob, popupJobsAtLocation, handleNextJob, handlePrevJob, handleClosePopup]);

    const getClusterColor = (count: number): string => {
      if (count < 5) return '#3b82f6'; // blue-500
      if (count < 20) return '#00FFB3'; // green
      if (count < 50) return '#FFD600'; // yellow
      if (count < 100) return '#FF6B00'; // orange
      return '#FF0080'; // pink
    };

    const getClusterSize = (count: number): number => {
      if (count < 5) return 32;
      if (count < 20) return 40;
      if (count < 50) return 48;
      if (count < 100) return 56;
      return 64;
    };

    // Ensure map always renders, even with 0 jobs
    if (!mapboxToken) {
      return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: '#ffffff' }}>
          <div style={{ textAlign: 'center' }}>
            <h2>Mapbox token missing</h2>
            <p>Please set VITE_MAPBOX_TOKEN in your .env file</p>
          </div>
        </div>
      );
    }

    console.log('JobMap render:', {
      jobsCount: jobs.length,
      displayJobsCount: displayJobs.length,
      clustersCount: clusters.length,
      mapboxToken: mapboxToken ? 'present' : 'missing'
    });

    return (
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        <StatsOverlay
          totalJobs={totalJobs || jobs.length}
          displayedJobs={displayJobs.length}
          totalLocations={uniqueLocations}
        />

        {isLoadingMore && loadingProgress && (
          <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(20px)',
            padding: '14px 24px',
            borderRadius: '12px',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '240px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif'
          }}>
            <div style={{
              width: '14px',
              height: '14px',
              border: '2px solid rgba(59, 130, 246, 0.3)',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '6px',
                fontWeight: '500'
              }}>
                Loading jobs
              </div>
              <div style={{
                width: '100%',
                height: '3px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(loadingProgress.current / loadingProgress.total) * 100}%`,
                  height: '100%',
                  backgroundColor: '#3b82f6',
                  transition: 'width 0.3s ease',
                  boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)'
                }} />
              </div>
              <div style={{
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.4)',
                marginTop: '4px',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {loadingProgress.current} / {loadingProgress.total}
              </div>
            </div>
          </div>
        )}

        <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.3;
          }
        }
        .mapboxgl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .mapboxgl-popup-tip {
          display: none !important;
        }
        .custom-popup .mapboxgl-popup-content {
          background: transparent !important;
        }
      `}</style>

        <Map
          {...viewState}
          onMove={(evt) => {
            const newViewState = evt.viewState;
            setViewState(newViewState);
            onViewStateChange?.(newViewState);
          }}
          onError={(e) => {
            console.error('Map error:', e);
          }}
          onLoad={() => {
            console.log('Map loaded successfully');
          }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={mapboxToken}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" />
          <FullscreenControl position="top-right" />

          {clusters.map((cluster, index) => {
            const size = cluster.isCluster ? getClusterSize(cluster.jobs.length) : 20;
            const color = cluster.isCluster ? getClusterColor(cluster.jobs.length) : '#3b82f6';

            return (
              <Marker
                key={`${cluster.lat}-${cluster.lng}-${index}`}
                longitude={cluster.lng}
                latitude={cluster.lat}
                anchor="center"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  handleClusterClick(cluster);
                }}
              >
                {cluster.isCluster ? (
                  <div
                    style={{
                      position: 'relative',
                      width: size,
                      height: size,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      const inner = e.currentTarget.querySelector('.marker-inner') as HTMLElement;
                      if (inner) inner.style.transform = 'scale(1.15)';
                    }}
                    onMouseLeave={(e) => {
                      const inner = e.currentTarget.querySelector('.marker-inner') as HTMLElement;
                      if (inner) inner.style.transform = 'scale(1)';
                    }}
                  >
                    {/* Pulsing ring */}
                    <div style={{
                      position: 'absolute',
                      inset: '-8px',
                      borderRadius: '50%',
                      backgroundColor: color,
                      opacity: 0.2,
                      animation: 'pulse 2s ease-in-out infinite',
                    }} />

                    {/* Main marker */}
                    <div
                      className="marker-inner"
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: `2px solid ${color}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        color: color,
                        fontSize: '13px',
                        boxShadow: `0 0 20px ${color}40, 0 4px 12px rgba(0, 0, 0, 0.4)`,
                        transition: 'transform 0.2s ease',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {cluster.jobs.length}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      const dot = e.currentTarget.querySelector('.marker-dot') as HTMLElement;
                      if (dot) dot.style.transform = 'scale(1.3)';
                    }}
                    onMouseLeave={(e) => {
                      const dot = e.currentTarget.querySelector('.marker-dot') as HTMLElement;
                      if (dot) dot.style.transform = 'scale(1)';
                    }}
                  >
                    {/* Single job marker - minimalist dot */}
                    <div
                      className="marker-dot"
                      style={{
                        width: size,
                        height: size,
                        borderRadius: '50%',
                        backgroundColor: color,
                        boxShadow: `0 0 12px ${color}80, 0 2px 8px rgba(0, 0, 0, 0.3)`,
                        transition: 'transform 0.2s ease',
                        border: '2px solid rgba(0, 0, 0, 0.5)',
                      }}
                    />
                    {/* Inner glow */}
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      opacity: 0.8,
                    }} />
                  </div>
                )}
              </Marker>
            );
          })}

          {popupJob && (
            <Popup
              longitude={popupJob.lng}
              latitude={popupJob.lat}
              anchor="bottom"
              onClose={handleClosePopup}
              closeButton={false}
              closeOnClick={false}
              offset={15}
              className="custom-popup"
            >
              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '20px',
                minWidth: '300px',
                maxWidth: '360px',
                color: '#ffffff',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
                position: 'relative',
              }}>
                {/* Close button */}
                <button
                  onClick={handleClosePopup}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '6px',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '18px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                  }}
                >
                  ×
                </button>

                {/* Multiple jobs indicator and navigation */}
                {popupJobsAtLocation.length > 1 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                    paddingRight: '32px',
                  }}>
                    <div style={{
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontWeight: '500',
                    }}>
                      {currentJobIndex + 1} of {popupJobsAtLocation.length} jobs here
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={handlePrevJob}
                        title="Previous job (←)"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '6px',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#ffffff',
                          fontSize: '16px',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                          e.currentTarget.style.borderColor = '#3b82f6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        }}
                      >
                        ←
                      </button>
                      <button
                        onClick={handleNextJob}
                        title="Next job (→)"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '6px',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#ffffff',
                          fontSize: '16px',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                          e.currentTarget.style.borderColor = '#3b82f6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        }}
                      >
                        →
                      </button>
                    </div>
                  </div>
                )}

                <div style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'rgba(255, 255, 255, 0.4)',
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  {popupJob.company}
                </div>

                <h3 style={{
                  margin: '0 0 16px 0',
                  fontSize: '18px',
                  fontWeight: '500',
                  color: '#ffffff',
                  lineHeight: '1.4',
                  paddingRight: '20px'
                }}>
                  {popupJob.title}
                </h3>

                <div style={{
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <div style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6'
                  }} />
                  {popupJob.location}
                </div>

                <a
                  href={popupJob.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    backgroundColor: '#3b82f6',
                    color: '#000000',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    border: 'none',
                    width: '100%',
                    letterSpacing: '0.02em'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#60a5fa';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  View Job
                  <span style={{ fontSize: '16px' }}>→</span>
                </a>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    );
  }
);

JobMap.displayName = 'JobMap';
