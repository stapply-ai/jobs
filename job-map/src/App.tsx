import { useEffect, useState, useRef, useCallback } from 'react';
import { JobMap } from './components/JobMap';
import { LoadingScreen } from './components/LoadingScreen';
import { ChatInterface } from './components/ChatInterface';
import { loadJobsWithCoordinates, getLocationStats } from './utils/dataProcessor';
import type { JobMarker } from './types';
import { MAPBOX_TOKEN } from './config';
import { AIService } from './services/aiService';
import type { MapControlCallbacks, ViewState } from './utils/mapControl';

function App() {
  const [jobMarkers, setJobMarkers] = useState<JobMarker[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState('Initializing');
  const [error, setError] = useState<string | null>(null);
  const [totalJobsCount, setTotalJobsCount] = useState(0);
  const [filteredJobs, setFilteredJobs] = useState<JobMarker[] | null>(null);
  const [viewState, setViewState] = useState<ViewState | null>(null);
  const aiServiceRef = useRef<AIService>(new AIService());
  const mapControlCallbacksRef = useRef<MapControlCallbacks | null>(null);

  const handleMapControlReady = useCallback((callbacks: MapControlCallbacks) => {
    mapControlCallbacksRef.current = callbacks;

    // Initialize AI service if we have jobs
    if (jobMarkers.length > 0) {
      aiServiceRef.current.initialize(
        jobMarkers,
        {
          ...callbacks,
          setFilteredJobs: (jobs) => {
            setFilteredJobs(jobs);
            callbacks.setFilteredJobs(jobs);
          },
        },
        viewState || undefined
      );
    }
  }, [jobMarkers, viewState]);

  const handleViewStateChange = useCallback((newViewState: ViewState) => {
    setViewState(newViewState);
    // Update AI service with new view state
    if (mapControlCallbacksRef.current && jobMarkers.length > 0) {
      aiServiceRef.current.updateViewState(newViewState);
    }
  }, [jobMarkers.length]);

  // Update AI service when jobs change
  useEffect(() => {
    if (jobMarkers.length > 0 && mapControlCallbacksRef.current) {
      aiServiceRef.current.updateJobs(jobMarkers);
    }
  }, [jobMarkers]);

  useEffect(() => {
    async function loadData() {
      try {
        // Load CSV with coordinates
        setLoadingStage('Loading jobs data');
        const jobs = await loadJobsWithCoordinates('/jobs_minimal.csv');
        console.log(`Loaded ${jobs.length} jobs with coordinates`);

        if (jobs.length === 0) {
          throw new Error('No jobs found in CSV file');
        }

        setTotalJobsCount(jobs.length);
        setJobMarkers(jobs);

        // Get stats
        const stats = getLocationStats(jobs);
        console.log('Location stats:', stats);

        setInitialLoading(false);

        // Initialize AI service once we have jobs
        if (mapControlCallbacksRef.current) {
          aiServiceRef.current.initialize(
            jobs,
            mapControlCallbacksRef.current,
            viewState || undefined
          );
        }
      } catch (err) {
        console.error('Error loading job data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load job data');
        setInitialLoading(false);
      }
    }

    loadData();
  }, []);

  if (error) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        color: '#ef4444',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Error Loading Data</h1>
        <p style={{ fontSize: '16px', color: '#94a3b8' }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '24px',
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (initialLoading) {
    return <LoadingScreen stage={loadingStage} />;
  }

  // Show chat interface (API key is checked server-side)
  // The chat will show an error if the API key isn't configured
  const showChat = true;

  return (
    <>
      <JobMap
        jobs={jobMarkers}
        mapboxToken={MAPBOX_TOKEN}
        totalJobs={totalJobsCount}
        onMapControlReady={handleMapControlReady}
        filteredJobs={filteredJobs}
        onViewStateChange={handleViewStateChange}
      />
      {showChat && (
        <ChatInterface
          aiService={aiServiceRef.current}
        />
      )}
    </>
  );
}

export default App;
