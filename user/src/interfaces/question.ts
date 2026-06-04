export interface ITag {
  _id: string;
  name: string;
  slug: string;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IQuestion {
  _id: string;
  userId: IQuestionUser;
  title: string;
  content: string;
  type: string;
  isAnonymous: boolean;
  status: string;
  topicId: ITag | null;
  viewCount: number;
  answerCount: number;
  voteScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface IQuestionUser {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: string;
  avatarId?: string;
}

export interface IAnswer {
  _id: string;
  questionId: string;
  userId: IQuestionUser;
  content: string;
  isAccepted: boolean;
  isPinned: boolean;
  voteScore: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IComment {
  _id: string;
  answerId: string;
  userId: IQuestionUser;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface IVoteResult {
  vote: { _id: string; type: number } | null;
  voteScore: number;
}

export interface ICreateQuestionPayload {
  title: string;
  content: string;
  type?: string;
  isAnonymous?: boolean;
  topicId?: string;
  pollOptions?: string[];
}

export interface IUpdateQuestionPayload {
  title?: string;
  content?: string;
  isAnonymous?: boolean;
  topicId?: string;
  pollOptions?: string[];
}

export interface INotification {
  _id: string;
  userId: string;
  type: string;
  message: string;
  questionId?: { _id: string; title: string };
  actorId?: IQuestionUser;
  isRead: boolean;
  createdAt: string;
}

export interface IPollOption {
  _id: string;
  questionId: string;
  content: string;
  voteCount: number;
  createdAt: string;
}

export interface IPollVote {
  _id: string;
  userId: string;
  questionId: string;
  optionId: string;
}

export interface IPollResult {
  options: IPollOption[];
  totalVotes: number;
  myVote?: IPollVote | null;
}

export interface ICreateReportPayload {
  targetType: 'question' | 'answer' | 'comment';
  targetId: string;
  reason: string;
  description?: string;
}
