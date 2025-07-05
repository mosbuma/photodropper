import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Comment {
  id: string
  eventId: string
  photoId?: string
  index: number
  comment: string
  commenterName?: string
  visible: boolean
  createdAt: string
  updatedAt: string
}

interface CommentsState {
  comments: Comment[]
  isLoading: boolean
  error: string | null
}

const initialState: CommentsState = {
  comments: [],
  isLoading: false,
  error: null,
}

const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    setComments: (state, action: PayloadAction<Comment[]>) => {
      state.comments = action.payload
    },
    addComment: (state, action: PayloadAction<Comment>) => {
      state.comments.push(action.payload)
    },
    updateComment: (state, action: PayloadAction<Comment>) => {
      const index = state.comments.findIndex(comment => comment.id === action.payload.id)
      if (index !== -1) {
        state.comments[index] = action.payload
      }
    },
    deleteComment: (state, action: PayloadAction<string>) => {
      state.comments = state.comments.filter(comment => comment.id !== action.payload)
    },
    setCommentsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setCommentsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    clearComments: (state) => {
      state.comments = []
    },
  },
})

export const {
  setComments,
  addComment,
  updateComment,
  deleteComment,
  setCommentsLoading,
  setCommentsError,
  clearComments,
} = commentsSlice.actions

export default commentsSlice.reducer 