export interface Job {
  url: string;
  title: string;
  location: string;
  company: string;
  ats_id: string;
  id: string;
}

export interface JobMarker extends Job {
  lat: number;
  lng: number;
}
