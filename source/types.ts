export interface Conferences {
  conferences: Array<Conference>;
}

export interface Conference {
  acronym: string;
  aspect_ratio: string;
  updated_at: string;
  title: string;
  schedule_url: string;
  slug: string;
  event_last_released_at: string;
  link: string | null;
  description: string | null;
  webgen_location: string;
  logo_url: string;
  images_url: string;
  recordings_url: string;
  url: string;
}

export interface ConferenceWithEvents extends Conference {
  events: Array<Event>;
}

export interface Event {
  guid: string;
  title: string;
  subtitle: string | null;
  slug: string;
  link: string;
  description: string;
  original_language: string;
  persons: Array<string>;
  tags: Array<unknown>;
  view_count: number;
  promoted: boolean;
  date: string;
  release_date: string;
  updated_at: string;
  length: number;
  duration: number;
  thumb_url: string;
  poster_url: string;
  timeline_url: string;
  thumbnails_url: string;
  frontend_link: string;
  url: string;
  conference_title: string;
  conference_url: string;
  releated: Array<unknown>;
}

export interface EventWithRecordings extends Event {
  recordings: Array<Recording>;
}

export interface Recording {
  size: number;
  length: number;
  mime_type: string;
  language: string;
  filename: string;
  state: string;
  folder: string;
  high_quality: boolean;
  width: number;
  height: number;
  updated_at: string;
  recording_url: string;
  url: string;
  event_url: string;
  conference_url: string;
}
