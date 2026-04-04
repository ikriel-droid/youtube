export type Category =
  | "finance"
  | "ai"
  | "vision"
  | "baseball"
  | "football"
  | "creator"
  | "sleep";

export type PublishState = "draft" | "published";

export interface CommentRecord {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface ChannelProfile {
  slug: string;
  name: string;
  category: Category;
  tagline: string;
  about: string;
  avatarText: string;
  accentColor: string;
}

export interface VideoRecord {
  id: string;
  title: string;
  description: string;
  channelSlug: string;
  channelName: string;
  category: Category;
  views: number;
  likes: number;
  duration: string;
  publishedAt: string;
  videoUrl: string;
  thumbnailUrl?: string;
  tags: string[];
  status: PublishState;
  comments: CommentRecord[];
}

export interface LibraryRecord {
  videos: VideoRecord[];
  channels: ChannelProfile[];
}
