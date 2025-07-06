import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface PhotoStreamItem {
  id: string;
  photoId: string;
  eventId: string;
  index: number;
  photoUrl: string;
  uploaderName: string | null;
  dateTaken: string | null;
  coordinates: string | null;
  location: string | null;
  visible: boolean;
  updatedAt: string | null;
  scheduleCount: number;
  showCount: number;
  lastShown?: string | null;
  showFrom?: string | null;
  showTo?: string | null;
  comments: CommentStreamItem[];
}

export interface CommentStreamItem {
  id: string;
  eventId: string;
  photoId: string | null;
  index: number;
  comment: string;
  commenterName: string | null;
  visible: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  scheduleCount: number;
  showCount: number;
  lastShown?: string | null;
  showFrom?: string | null;
  showTo?: string | null;
}

export interface Playlist {
  hash: string
  photoStream: PhotoStreamItem[]
  eventCommentStream: CommentStreamItem[]
  commentStyle: 'TICKER' | 'COMICBOOK'
}

interface AppState {
  activeEventId: string | null
  currentPhotoIndex: number
  currentPhotoCommentIndex: number
  currentEventCommentIndex: number
  currentPlaylist: Playlist | null
  currentPlaylistHash: string
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AppState = {
  activeEventId: null,
  currentPhotoIndex: 0,
  currentPhotoCommentIndex: 0,
  currentEventCommentIndex: 0,
  currentPlaylist: null,
  currentPlaylistHash: '',
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setActiveEvent: (state, action: PayloadAction<string | null>) => {
      state.activeEventId = action.payload
    },
    setCurrentPhotoIndex: (state, action: PayloadAction<number>) => {
      state.currentPhotoIndex = action.payload
    },
    setCurrentPhotoCommentIndex: (state, action: PayloadAction<number>) => {
      state.currentPhotoCommentIndex = action.payload
    },
    setCurrentEventCommentIndex: (state, action: PayloadAction<number>) => {
      state.currentEventCommentIndex = action.payload
    },
    setCurrentPlaylist: (state, action: PayloadAction<Playlist>) => {
      state.currentPlaylist = action.payload
    },
    setCurrentPlaylistHash: (state, action: PayloadAction<string>) => {
      state.currentPlaylistHash = action.payload
    },
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    resetApp: (state) => {
      state.activeEventId = null
      state.currentPhotoIndex = 0
      state.currentPhotoCommentIndex = 0
      state.currentEventCommentIndex = 0
      state.currentPlaylist = null
      state.currentPlaylistHash = ''
    },
  },
})

export const {
  setActiveEvent,
  setCurrentPhotoIndex,
  setCurrentPhotoCommentIndex,
  setCurrentEventCommentIndex,
  setCurrentPlaylist,
  setCurrentPlaylistHash,
  setAuthenticated,
  setLoading,
  setError,
  resetApp,
} = appSlice.actions

export default appSlice.reducer 