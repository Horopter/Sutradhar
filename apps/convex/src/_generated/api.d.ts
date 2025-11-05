/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as achievements from "../achievements.js";
import type * as actions from "../actions.js";
import type * as actions_list from "../actions_list.js";
import type * as codeAssignments from "../codeAssignments.js";
import type * as codeReviews from "../codeReviews.js";
import type * as codeSubmissions from "../codeSubmissions.js";
import type * as courses from "../courses.js";
import type * as dynamicQuizzes from "../dynamicQuizzes.js";
import type * as escalations from "../escalations.js";
import type * as events from "../events.js";
import type * as forumPosts from "../forumPosts.js";
import type * as forumReplies from "../forumReplies.js";
import type * as generatedContent from "../generatedContent.js";
import type * as images from "../images.js";
import type * as leaderboards from "../leaderboards.js";
import type * as learningAnalytics from "../learningAnalytics.js";
import type * as learningPaths from "../learningPaths.js";
import type * as learningPreferences from "../learningPreferences.js";
import type * as learningSessions from "../learningSessions.js";
import type * as lessons from "../lessons.js";
import type * as liveSessions from "../liveSessions.js";
import type * as logs from "../logs.js";
import type * as messages from "../messages.js";
import type * as points from "../points.js";
import type * as quizAttempts from "../quizAttempts.js";
import type * as quizzes from "../quizzes.js";
import type * as recommendations from "../recommendations.js";
import type * as schedules from "../schedules.js";
import type * as sessions from "../sessions.js";
import type * as skillAssessments from "../skillAssessments.js";
import type * as studyGroupMembers from "../studyGroupMembers.js";
import type * as studyGroups from "../studyGroups.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  achievements: typeof achievements;
  actions: typeof actions;
  actions_list: typeof actions_list;
  codeAssignments: typeof codeAssignments;
  codeReviews: typeof codeReviews;
  codeSubmissions: typeof codeSubmissions;
  courses: typeof courses;
  dynamicQuizzes: typeof dynamicQuizzes;
  escalations: typeof escalations;
  events: typeof events;
  forumPosts: typeof forumPosts;
  forumReplies: typeof forumReplies;
  generatedContent: typeof generatedContent;
  images: typeof images;
  leaderboards: typeof leaderboards;
  learningAnalytics: typeof learningAnalytics;
  learningPaths: typeof learningPaths;
  learningPreferences: typeof learningPreferences;
  learningSessions: typeof learningSessions;
  lessons: typeof lessons;
  liveSessions: typeof liveSessions;
  logs: typeof logs;
  messages: typeof messages;
  points: typeof points;
  quizAttempts: typeof quizAttempts;
  quizzes: typeof quizzes;
  recommendations: typeof recommendations;
  schedules: typeof schedules;
  sessions: typeof sessions;
  skillAssessments: typeof skillAssessments;
  studyGroupMembers: typeof studyGroupMembers;
  studyGroups: typeof studyGroups;
  users: typeof users;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
