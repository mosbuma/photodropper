import { store } from '@/lib/store'
import { setCurrentPlaylist, setCurrentPlaylistHash } from '@/lib/slices/appSlice'
import type { PlaylistResponse } from '@/app/api/playlist/route'

class PlaylistManager {
  private static instance: PlaylistManager
  private timeoutId: number | null = null
  private currentEventId: string | null = null
  private currentHash: string = ''
  private isInitialized: boolean = false

  private constructor() {}

  static getInstance(): PlaylistManager {
    if (!PlaylistManager.instance) {
      PlaylistManager.instance = new PlaylistManager()
    }
    return PlaylistManager.instance
  }

  startPolling(eventId: string, hash: string = '') {
    // Update current event and hash
    this.currentEventId = eventId
    this.currentHash = hash

    // Start polling if not already initialized
    if (!this.isInitialized) {
      this.isInitialized = true
      this.scheduleNextPoll()
    }
  }

  stopPolling() {
    // Don't actually stop polling, just clear the current event
    this.currentEventId = null
    this.currentHash = ''
  }

  private scheduleNextPoll() {
    if (!this.isInitialized) return

    // Get polling interval from environment variable, default to 5000ms (5 seconds)
    const pollIntervalMs = parseInt(process.env.NEXT_PUBLIC_PLAYLIST_POLL_INTERVAL_MS || '5000')

    this.timeoutId = window.setTimeout(() => {
      this.pollPlaylist()
    }, pollIntervalMs)
  }

  private async pollPlaylist() {
    // Only make API call if there's an active event
    if (this.currentEventId) {
      try {
        const url = `/api/playlist?eventId=${this.currentEventId}&hash=${this.currentHash}`
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json() as PlaylistResponse
          
          if (data.unchanged) {
            // No changes, just update the hash
            this.currentHash = data.hash
          } else if (data.playlist) {
            // Changes detected, update Redux store
            store.dispatch(setCurrentPlaylist(data.playlist))
            store.dispatch(setCurrentPlaylistHash(data.hash)) // Store hash as version
            this.currentHash = data.hash
          }
        }
      } catch (error) {
        console.error('[PlaylistManager] Error polling playlist:', error)
      }
    }

    // Always schedule the next poll
    this.scheduleNextPoll()
  }

  updateHash(hash: string) {
    this.currentHash = hash
  }

  isActive(): boolean {
    return this.currentEventId !== null
  }

  getCurrentEventId(): string | null {
    return this.currentEventId
  }

  getCurrentHash(): string {
    return this.currentHash
  }
}

// Export singleton instance
export const playlistManager = PlaylistManager.getInstance() 