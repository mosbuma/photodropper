export interface Comment {
  id: string;
  eventId: string;
  photoId?: string;
  index: number;
  comment: string;
  commenterName?: string;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
  scheduleCount: number;
  showCount: number;
  lastShown?: string;
  showFrom?: string;
  showTo?: string;
} 