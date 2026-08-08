import { Redis } from "@upstash/redis";

import { resolveRedisConfig } from "./env";

export const redis = new Redis(resolveRedisConfig());
