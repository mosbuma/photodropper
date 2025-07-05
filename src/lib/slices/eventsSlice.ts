import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface SocialEvent {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  photoDurationMs: number
  scrollSpeedPct: number
}

interface EventsState {
  events: SocialEvent[]
  isLoading: boolean
  error: string | null
}

const initialState: EventsState = {
  events: [],
  isLoading: false,
  error: null,
}

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setEvents: (state, action: PayloadAction<SocialEvent[]>) => {
      state.events = action.payload
    },
    addEvent: (state, action: PayloadAction<SocialEvent>) => {
      state.events.push(action.payload)
    },
    updateEvent: (state, action: PayloadAction<SocialEvent>) => {
      const index = state.events.findIndex(event => event.id === action.payload.id)
      if (index !== -1) {
        state.events[index] = action.payload
      }
    },
    deleteEvent: (state, action: PayloadAction<string>) => {
      state.events = state.events.filter(event => event.id !== action.payload)
    },
    setEventsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setEventsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    clearEvents: (state) => {
      state.events = []
    },
  },
})

export const {
  setEvents,
  addEvent,
  updateEvent,
  deleteEvent,
  setEventsLoading,
  setEventsError,
  clearEvents,
} = eventsSlice.actions

export default eventsSlice.reducer 