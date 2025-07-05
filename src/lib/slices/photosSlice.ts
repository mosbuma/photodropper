import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Photo {
  id: string
  eventId: string
  index: number
  photoUrl: string
  uploaderName?: string
  dateTaken?: string
  coordinates?: string
  location?: string
  visible: boolean
  updatedAt: string
}

interface PhotosState {
  photos: Photo[]
  isLoading: boolean
  error: string | null
}

const initialState: PhotosState = {
  photos: [],
  isLoading: false,
  error: null,
}

const photosSlice = createSlice({
  name: 'photos',
  initialState,
  reducers: {
    setPhotos: (state, action: PayloadAction<Photo[]>) => {
      state.photos = action.payload
    },
    addPhoto: (state, action: PayloadAction<Photo>) => {
      state.photos.push(action.payload)
    },
    updatePhoto: (state, action: PayloadAction<Photo>) => {
      const index = state.photos.findIndex(photo => photo.id === action.payload.id)
      if (index !== -1) {
        state.photos[index] = action.payload
      }
    },
    deletePhoto: (state, action: PayloadAction<string>) => {
      state.photos = state.photos.filter(photo => photo.id !== action.payload)
    },
    setPhotosLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setPhotosError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    clearPhotos: (state) => {
      state.photos = []
    },
  },
})

export const {
  setPhotos,
  addPhoto,
  updatePhoto,
  deletePhoto,
  setPhotosLoading,
  setPhotosError,
  clearPhotos,
} = photosSlice.actions

export default photosSlice.reducer 