import { NextResponse } from 'next/server';
import { z } from 'zod';

export interface ApiErrorOptions {
  status?: number;
  exposeMessage?: boolean;
}

/**
 * Standardized API error response helper.
 * Logs server-side, returns consistent JSON shape to client.
 */
export function apiError(
  error: unknown,
  fallbackMessage = 'An error occurred',
  options: ApiErrorOptions = {}
): NextResponse {
  const { status = 500, exposeMessage = process.env.NODE_ENV === 'development' } = options;

  const message = error instanceof Error ? error.message : fallbackMessage;

  console.error(`API error (${status}):`, error instanceof Error ? error : message);

  const safeMessage =
    exposeMessage || (error instanceof Error && message.includes('BigQuery configuration'))
      ? message
      : fallbackMessage;

  return NextResponse.json(
    {
      success: false,
      error: status >= 500 ? fallbackMessage : safeMessage,
      ...(exposeMessage && { details: message }),
    },
    { status }
  );
}

/**
 * Handle Zod validation errors with 400 response.
 */
export function zodErrorResponse(error: z.ZodError): NextResponse {
  const firstIssue = error.issues[0];
  const message = firstIssue?.message ?? 'Validation error';
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}
