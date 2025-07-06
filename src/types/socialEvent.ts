export interface SocialEvent {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  photoDurationMs: number;
  scrollSpeedPct: number;
  commentStyle: 'TICKER' | 'COMICBOOK';
} 