/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as artifacts from "../artifacts.js";
import type * as assets from "../assets.js";
import type * as exhibitions from "../exhibitions.js";
import type * as lookup from "../lookup.js";
import type * as migrate from "../migrate.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

const fullApi: ApiFromModules<{
  artifacts: typeof artifacts;
  assets: typeof assets;
  exhibitions: typeof exhibitions;
  lookup: typeof lookup;
  migrate: typeof migrate;
}> = anyApi as any;

import { anyApi } from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
> = anyApi as any;
export const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
> = anyApi as any;
