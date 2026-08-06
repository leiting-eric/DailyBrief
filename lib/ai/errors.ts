/**
 * The provider returned a response, but it cannot be consumed as a complete
 * model output (for example, finish_reason=length or an empty content field).
 * Callers may retry or use a local fallback without hiding API/auth failures.
 */
export class LlmIncompleteResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmIncompleteResponseError";
  }
}
