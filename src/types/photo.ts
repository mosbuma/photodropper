export interface Photo {
  id: string;
  eventId: string;
  index: number;
  photoUrl: string;
  uploaderName?: string;
  dateTaken?: string;
  coordinates?: string;
  location?: string;
  visible: boolean;
  updatedAt: string;
  scheduleCount: number;
  showCount: number;
  lastShown?: string;
  showFrom?: string;
  showTo?: string;
} 