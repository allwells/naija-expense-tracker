import { createServiceClient } from "@/lib/supabase";

/**
 * Typed query helper — always use this on the server side.
 * Returns the Supabase service client for database operations.
 */
export function getDb() {
  return createServiceClient();
}

/**
 * Execute a paginated query with limit and offset.
 */
export function paginate(limit: number, page: number) {
  const offset = (page - 1) * limit;
  return { offset, limit };
}
