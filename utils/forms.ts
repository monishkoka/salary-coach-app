/**
 * Form helpers bridging Zod validation into react-hook-form's error surface.
 *
 * The auth/goal forms validate with Zod but rely on react-hook-form to render
 * field-level errors. Without a resolver, invalid input would silently fail
 * with no feedback — this helper pushes each Zod issue onto the right field so
 * the bound inputs show their error messages.
 */

import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { ZodError } from 'zod';

export function applyZodErrors<T extends FieldValues>(
  error: ZodError,
  setError: UseFormSetError<T>,
): void {
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string') {
      setError(field as Path<T>, { type: 'validation', message: issue.message });
    }
  }
}
