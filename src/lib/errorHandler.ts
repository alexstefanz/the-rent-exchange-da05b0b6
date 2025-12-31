// Secure error handler to prevent information leakage

export interface SafeError {
  message: string;
  code?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  '23505': 'This item already exists',
  '23503': 'Referenced item not found',
  '42501': 'Permission denied',
  'PGRST116': 'No data found',
  'invalid_credentials': 'Invalid email or password',
  'user_already_exists': 'An account with this email already exists',
  'email_not_confirmed': 'Please confirm your email address',
};

export const getSecureErrorMessage = (error: unknown): string => {
  if (!error) return 'An unexpected error occurred';
  
  const err = error as { code?: string; message?: string };
  
  // Check for known error codes
  if (err.code && ERROR_MESSAGES[err.code]) {
    return ERROR_MESSAGES[err.code];
  }
  
  // Check for auth-specific error messages
  if (err.message) {
    if (err.message.includes('Invalid login credentials')) {
      return 'Invalid email or password';
    }
    if (err.message.includes('User already registered')) {
      return 'An account with this email already exists';
    }
    if (err.message.includes('Email not confirmed')) {
      return 'Please confirm your email address';
    }
  }
  
  return 'An error occurred. Please try again.';
};

export const logSecureError = (context: string, error: unknown): void => {
  // Only log detailed errors in development
  if (import.meta.env.DEV) {
    console.error(`[DEV] ${context}:`, error);
  }
  // In production, we would send to an error monitoring service
  // e.g., Sentry, LogRocket, etc.
};

export const handleApiError = (context: string, error: unknown): never => {
  logSecureError(context, error);
  throw new Error(getSecureErrorMessage(error));
};
