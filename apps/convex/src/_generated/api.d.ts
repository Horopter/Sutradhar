/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions from "../actions.js";
import type * as actions_list from "../actions_list.js";
import type * as codeAssignments from "../codeAssignments.js";
import type * as codeSubmissions from "../codeSubmissions.js";
import type * as courses from "../courses.js";
import type * as escalations from "../escalations.js";
import type * as events from "../events.js";
import type * as images from "../images.js";
import type * as lessons from "../lessons.js";
import type * as logs from "../logs.js";
import type * as messages from "../messages.js";
import type * as quizzes from "../quizzes.js";
import type * as schedules from "../schedules.js";
import type * as sessions from "../sessions.js";
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
  actions: typeof actions;
  actions_list: typeof actions_list;
  codeAssignments: typeof codeAssignments;
  codeSubmissions: typeof codeSubmissions;
  courses: typeof courses;
  escalations: typeof escalations;
  events: typeof events;
  images: typeof images;
  lessons: typeof lessons;
  logs: typeof logs;
  messages: typeof messages;
  quizzes: typeof quizzes;
  schedules: typeof schedules;
  sessions: typeof sessions;
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
