export interface ActionResult<T = void> {
  data: T | null;
  error: string | null;
}

export function ok<T>(data: T): ActionResult<T> {
  return { data, error: null };
}

export function fail(error: string): ActionResult<never> {
  return { data: null, error };
}
