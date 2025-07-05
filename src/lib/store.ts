import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { combineReducers } from 'redux'

// Import reducers (we'll create these next)
import appReducer from './slices/appSlice'
import photosReducer from './slices/photosSlice'
import commentsReducer from './slices/commentsSlice'
import eventsReducer from './slices/eventsSlice'

const persistConfig = {
  key: 'photodropper',
  storage,
  whitelist: ['app', 'photos', 'comments', 'events'] // persist all slices
}

const rootReducer = combineReducers({
  app: appReducer,
  photos: photosReducer,
  comments: commentsReducer,
  events: eventsReducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 