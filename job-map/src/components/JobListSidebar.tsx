import { useState, useMemo, useEffect } from 'react';
import clsx from 'clsx';
import type { JobMarker } from '../types';

interface JobListSidebarProps {
  jobs: JobMarker[];
  isOpen: boolean;
  onClose: () => void;
  onJobClick?: (job: JobMarker) => void;
  filteredJobs?: JobMarker[] | null;
}

type SortOption = 'recent' | 'company' | 'location' | 'title';

export function JobListSidebar({ jobs, isOpen, onClose, onJobClick, filteredJobs }: JobListSidebarProps) {
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const displayJobs = useMemo(() => {
    return filteredJobs !== null && filteredJobs !== undefined ? filteredJobs : jobs;
  }, [jobs, filteredJobs]);

  // Filter and sort jobs
  const processedJobs = useMemo(() => {
    let filtered = displayJobs;

    // Apply search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.location.toLowerCase().includes(searchLower)
      );
    }

    // Sort jobs
    const sorted = [...filtered];
    switch (sortBy) {
      case 'company':
        sorted.sort((a, b) => a.company.localeCompare(b.company));
        break;
      case 'location':
        sorted.sort((a, b) => a.location.localeCompare(b.location));
        break;
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'recent':
      default:
        // Keep original order (most recent first)
        break;
    }

    return sorted;
  }, [displayJobs, searchText, sortBy]);

  // Group jobs by company for stats
  const companiesCount = useMemo(() => {
    const companies = new Set(processedJobs.map(job => job.company));
    return companies.size;
  }, [processedJobs]);

  const locationsCount = useMemo(() => {
    const locations = new Set(processedJobs.map(job => job.location));
    return locations.size;
  }, [processedJobs]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleJobClick = (job: JobMarker) => {
    onJobClick?.(job);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed top-0 right-0 h-screen z-40',
          'bg-black backdrop-blur-2xl',
          'border-l border-white/10',
          'w-full md:w-[480px]',
          'flex flex-col',
          'font-[system-ui,-apple-system,BlinkMacSystemFont,"Inter",sans-serif]',
          'transition-transform duration-300 ease-in-out',
          'shadow-[0_8px_32px_rgba(0,0,0,0.8)]',
          {
            'translate-x-0': isOpen,
            'translate-x-full': !isOpen,
          }
        )}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-white/10 bg-black/30">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h2 className="text-[15px] font-medium text-white m-0 tracking-[-0.01em]">All Jobs</h2>
              <p className="text-[11px] text-white/50 mt-1 m-0">
                {processedJobs.length.toLocaleString()} jobs • {companiesCount} companies • {locationsCount} locations
              </p>
            </div>
            <button
              onClick={onClose}
              className={clsx(
                'bg-transparent border-none rounded-md',
                'w-6 h-6 flex items-center justify-center',
                'cursor-pointer text-white/40 text-xl leading-none',
                'transition-all duration-150',
                'hover:bg-white/10 hover:text-white/80'
              )}
            >
              ×
            </button>
          </div>

          {/* Search and Sort */}
          <div className="px-5 pb-4 space-y-3">
            {/* Search */}
            <div
              className={clsx(
                'bg-white/8 rounded-xl border border-white/12 overflow-hidden',
                'transition-all duration-200',
                'focus-within:border-blue-500/50 focus-within:bg-white/10'
              )}
            >
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className={clsx(
                  'w-full px-4 py-2.5',
                  'bg-transparent border-none text-white text-[13px] outline-none',
                  'placeholder:text-white/40'
                )}
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/50">Sort:</span>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { value: 'recent', label: 'Recent' },
                  { value: 'company', label: 'Company' },
                  { value: 'location', label: 'Location' },
                  { value: 'title', label: 'Title' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value as SortOption)}
                    className={clsx(
                      'px-[10px] py-1 rounded-full text-[11px] font-medium',
                      'transition-[border-color,background-color] duration-200 ease-in-out cursor-pointer',
                      sortBy === option.value
                        ? 'bg-white/12 border border-white/20 text-white'
                        : 'bg-white/8 border border-white/12 text-white/70 hover:bg-white/12 hover:border-white/20'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Job List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-black">
          {processedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40 px-6 text-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mb-3 opacity-50"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <p className="text-[13px] text-white/60 m-0">No jobs found</p>
              <p className="text-[11px] text-white/40 mt-2 m-0">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {processedJobs.map((job, index) => (
                <div
                  key={`${job.id}-${index}`}
                  className={clsx(
                    'p-4 transition-all duration-150',
                    'hover:bg-white/5 cursor-pointer'
                  )}
                  onClick={() => handleJobClick(job)}
                >
                  {/* Company */}
                  <div className="text-[10px] font-medium text-white/50 mb-2 uppercase tracking-wider">
                    {job.company}
                  </div>

                  {/* Title */}
                  <h3 className="text-[13px] font-medium text-white mb-2 leading-normal m-0">
                    {job.title}
                  </h3>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 text-[12px] text-white/60 mb-3">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {job.location}
                  </div>

                  {/* View Job Button */}
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={clsx(
                      'inline-flex items-center gap-1.5',
                      'px-[10px] py-1 bg-white/8 text-white no-underline rounded-full',
                      'text-[11px] font-medium border border-white/12',
                      'transition-[border-color,background-color] duration-200 ease-in-out',
                      'hover:bg-white/12 hover:border-white/20'
                    )}
                  >
                    View Job
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with stats */}
        {processedJobs.length > 0 && (
          <div className="flex-shrink-0 border-t border-white/10 bg-black/30 px-5 py-3">
            <div className="text-[11px] text-white/50 text-center">
              Showing {processedJobs.length.toLocaleString()} of {jobs.length.toLocaleString()} jobs
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </>
  );
}
