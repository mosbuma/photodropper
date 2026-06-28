import type { CommentStreamItem } from '@/lib/slices/appSlice'

const DEV_TICKER_COMMENT_PREFIX = '__dev_ticker_test__'

const DEV_TICKER_COMMENT_TEXTS = [
  'dit is een test',
  'dit is nog een test',
  'dit is test drie',
]

function buildDevComments(photoId: string, eventId: string): CommentStreamItem[] {
  return DEV_TICKER_COMMENT_TEXTS.map((comment, index) => ({
    id: `${DEV_TICKER_COMMENT_PREFIX}-${photoId}-${index}`,
    eventId,
    photoId,
    index,
    comment,
    commenterName: null,
    visible: true,
    createdAt: null,
    updatedAt: null,
    scheduleCount: 0,
    showCount: 0,
  }))
}

export function withDevTickerComments(
  comments: CommentStreamItem[],
  photoId: string,
  eventId: string
): CommentStreamItem[] {
  if (process.env.SHOW_TEST_COMMENTS !== 'true' || !photoId) return comments

  const withoutDev = comments.filter(
    c => !c.id.startsWith(`${DEV_TICKER_COMMENT_PREFIX}-${photoId}-`)
  )
  return [...buildDevComments(photoId, eventId), ...withoutDev]
}
