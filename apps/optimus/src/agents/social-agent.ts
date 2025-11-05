/**
 * Social Agent - Optimus Layer
 * Manages study groups, forums, and peer interactions
 */

import { BaseAgent, AgentResult, AgentContext } from './base-agent';
import { SutradharClient } from '../client/sutradhar-client';

export interface StudyGroup {
  name: string;
  courseSlug: string;
  description: string;
  createdBy: string;
  memberIds: string[];
  isPublic: boolean;
}

export interface ForumPost {
  userId: string;
  lessonId: string;
  courseSlug: string;
  title: string;
  content: string;
  tags: string[];
}

export interface ForumReply {
  postId: string;
  userId: string;
  content: string;
}

export class SocialAgent extends BaseAgent {
  constructor(sutradharClient: SutradharClient) {
    super('SocialAgent', 'Manages study groups, forums, and peer interactions', sutradharClient);
  }

  /**
   * Create a study group
   */
  async createStudyGroup(
    name: string,
    courseSlug: string,
    description: string,
    createdBy: string,
    isPublic: boolean = true,
    context?: AgentContext
  ): Promise<AgentResult<StudyGroup>> {
    try {
      const group: StudyGroup = {
        name,
        courseSlug,
        description,
        createdBy,
        memberIds: [createdBy],
        isPublic
      };

      const groupId = await this.convexMutation('studyGroups:create', {
        ...group,
        createdAt: Date.now()
      }, context);

      // Add creator as admin member
      await this.convexMutation('studyGroupMembers:create', {
        groupId,
        userId: createdBy,
        role: 'admin',
        joinedAt: Date.now()
      }, context);

      return this.success({ ...group, id: groupId });
    } catch (error: any) {
      return this.error(error.message || 'Failed to create study group');
    }
  }

  /**
   * Join a study group
   */
  async joinStudyGroup(
    groupId: string,
    userId: string,
    context?: AgentContext
  ): Promise<AgentResult<{ joined: boolean }>> {
    try {
      const group = await this.convexQuery('studyGroups:get', { groupId }, context);
      
      if (!group) {
        return this.error('Study group not found');
      }

      // Check if already a member
      const existing = await this.convexQuery('studyGroupMembers:get', { groupId, userId }, context);
      if (existing) {
        return this.success({ joined: true });
      }

      // Add member
      await this.convexMutation('studyGroupMembers:create', {
        groupId,
        userId,
        role: 'member',
        joinedAt: Date.now()
      }, context);

      // Update group member list
      await this.convexMutation('studyGroups:addMember', {
        groupId,
        userId
      }, context);

      return this.success({ joined: true });
    } catch (error: any) {
      return this.error(error.message || 'Failed to join study group');
    }
  }

  /**
   * Get study groups for a course
   */
  async getStudyGroups(
    courseSlug: string,
    limit: number = 20,
    context?: AgentContext
  ): Promise<AgentResult<StudyGroup[]>> {
    try {
      const groups = await this.convexQuery('studyGroups:getByCourse', {
        courseSlug,
        limit
      }, context);

      return this.success(groups || []);
    } catch (error: any) {
      return this.error(error.message || 'Failed to get study groups');
    }
  }

  /**
   * Create a forum post
   */
  async createPost(
    userId: string,
    lessonId: string,
    courseSlug: string,
    title: string,
    content: string,
    tags: string[] = [],
    context?: AgentContext
  ): Promise<AgentResult<{ postId: string }>> {
    try {
      const post: ForumPost = {
        userId,
        lessonId,
        courseSlug,
        title,
        content,
        tags
      };

      const postId = await this.convexMutation('forumPosts:create', {
        ...post,
        upvotes: 0,
        answerCount: 0,
        isAnswered: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }, context);

      return this.success({ postId });
    } catch (error: any) {
      return this.error(error.message || 'Failed to create post');
    }
  }

  /**
   * Get forum posts for a lesson
   */
  async getPosts(
    lessonId: string,
    limit: number = 20,
    context?: AgentContext
  ): Promise<AgentResult<any[]>> {
    try {
      const posts = await this.convexQuery('forumPosts:getByLesson', {
        lessonId,
        limit
      }, context);

      return this.success(posts || []);
    } catch (error: any) {
      return this.error(error.message || 'Failed to get posts');
    }
  }

  /**
   * Reply to a forum post
   */
  async replyToPost(
    postId: string,
    userId: string,
    content: string,
    context?: AgentContext
  ): Promise<AgentResult<{ replyId: string }>> {
    try {
      const reply: ForumReply = {
        postId,
        userId,
        content
      };

      const replyId = await this.convexMutation('forumReplies:create', {
        ...reply,
        upvotes: 0,
        isAccepted: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }, context);

      // Update post answer count
      await this.convexMutation('forumPosts:incrementAnswerCount', { postId }, context);

      return this.success({ replyId });
    } catch (error: any) {
      return this.error(error.message || 'Failed to reply to post');
    }
  }

  /**
   * Get replies for a post
   */
  async getReplies(
    postId: string,
    limit: number = 50,
    context?: AgentContext
  ): Promise<AgentResult<any[]>> {
    try {
      const replies = await this.convexQuery('forumReplies:getByPost', {
        postId,
        limit
      }, context);

      return this.success(replies || []);
    } catch (error: any) {
      return this.error(error.message || 'Failed to get replies');
    }
  }

  /**
   * Upvote a post or reply
   */
  async upvote(
    itemType: 'post' | 'reply',
    itemId: string,
    userId: string,
    context?: AgentContext
  ): Promise<AgentResult<{ upvotes: number }>> {
    try {
      if (itemType === 'post') {
        await this.convexMutation('forumPosts:upvote', { postId: itemId }, context);
        const post = await this.convexQuery('forumPosts:get', { postId: itemId }, context);
        return this.success({ upvotes: post?.upvotes || 0 });
      } else {
        await this.convexMutation('forumReplies:upvote', { replyId: itemId }, context);
        const reply = await this.convexQuery('forumReplies:get', { replyId: itemId }, context);
        return this.success({ upvotes: reply?.upvotes || 0 });
      }
    } catch (error: any) {
      return this.error(error.message || 'Failed to upvote');
    }
  }

  /**
   * Mark a reply as accepted answer
   */
  async acceptAnswer(
    postId: string,
    replyId: string,
    userId: string,
    context?: AgentContext
  ): Promise<AgentResult<{ accepted: boolean }>> {
    try {
      // Verify user owns the post
      const post = await this.convexQuery('forumPosts:get', { postId }, context);
      if (post?.userId !== userId) {
        return this.error('Only post author can accept answers');
      }

      // Mark reply as accepted
      await this.convexMutation('forumReplies:accept', { replyId }, context);
      
      // Mark post as answered
      await this.convexMutation('forumPosts:markAnswered', { postId }, context);

      return this.success({ accepted: true });
    } catch (error: any) {
      return this.error(error.message || 'Failed to accept answer');
    }
  }

  /**
   * Create a live session
   */
  async createLiveSession(
    title: string,
    hostId: string,
    courseSlug: string,
    type: 'office_hours' | 'study_group' | 'tutoring',
    scheduledAt?: number,
    context?: AgentContext
  ): Promise<AgentResult<{ roomId: string }>> {
    try {
      const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await this.convexMutation('liveSessions:create', {
        roomId,
        title,
        hostId,
        participantIds: [hostId],
        courseSlug,
        scheduledAt: scheduledAt || Date.now(),
        type
      }, context);

      return this.success({ roomId });
    } catch (error: any) {
      return this.error(error.message || 'Failed to create live session');
    }
  }

  /**
   * Get live sessions for a course
   */
  async getLiveSessions(
    courseSlug: string,
    context?: AgentContext
  ): Promise<AgentResult<any[]>> {
    try {
      const sessions = await this.convexQuery('liveSessions:getByCourse', {
        courseSlug
      }, context);

      return this.success(sessions || []);
    } catch (error: any) {
      return this.error(error.message || 'Failed to get live sessions');
    }
  }

  /**
   * Search forum posts
   */
  async searchPosts(
    query: string,
    courseSlug?: string,
    tags?: string[],
    limit: number = 20,
    context?: AgentContext
  ): Promise<AgentResult<any[]>> {
    try {
      // Use retrieval agent for semantic search
      const searchResult = await this.executeViaSutradhar(
        'retrieval-agent',
        'search',
        {
          query,
          maxResults: limit,
          filters: {
            courseSlug,
            tags
          }
        },
        context
      );

      if (!searchResult.success) {
        // Fallback to simple query
        const posts = await this.convexQuery('forumPosts:search', {
          query,
          courseSlug,
          tags,
          limit
        }, context);
        return this.success(posts || []);
      }

      // Extract post IDs from search results and fetch full posts
      const postIds = searchResult.data?.snippets?.map((s: any) => s.id) || [];
      const posts = await this.convexQuery('forumPosts:getByIds', { postIds }, context);

      return this.success(posts || []);
    } catch (error: any) {
      return this.error(error.message || 'Failed to search posts');
    }
  }
}

