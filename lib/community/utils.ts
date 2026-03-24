import { formatDistanceToNow } from 'date-fns'
import type { CommunityPost } from '@/lib/api/communityApi'

export const rankFromPoints = (totalPoints: number) => {
  if (totalPoints >= 2000) return 'Campus Champion'
  if (totalPoints >= 1000) return 'Top Scholar'
  if (totalPoints >= 500) return 'Serious Scholar'
  if (totalPoints >= 200) return 'Active Learner'
  return 'Beginner'
}

export const timeAgo = (dateString: string) => formatDistanceToNow(new Date(dateString), { addSuffix: true })

export const trendingScore = (post: CommunityPost) => post.likesCount + post.commentsCount * 2

export const pollVotesTotal = (post: CommunityPost) =>
  post.poll?.options?.reduce((sum, o) => sum + (o.votes?.length || 0), 0) || 0

export const initials = (name: string) =>
  name
    .split(' ')
    .map((x) => x[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
