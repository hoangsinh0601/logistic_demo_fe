import type { AxiosError } from "axios";
import type { TFunction } from "i18next";

interface ApiErrorResponse {
  message?: string;
  code?: string;
}

/**
 * Maps API errors to i18n-translated user-friendly messages.
 * Instead of showing raw API error messages, this returns a
 * context-appropriate translated string based on HTTP status.
 *
 * @param err - The caught error (unknown type from catch block)
 * @param t - i18next translation function
 * @param fallbackKey - Context-specific i18n key (e.g. 'errors.saveProductFailed')
 */
export const getApiErrorMessage = (
  err: unknown,
  t: TFunction,
  fallbackKey: string,
): string => {
  if (err instanceof Error && "response" in err) {
    const axiosError = err as AxiosError<ApiErrorResponse>;
    const status = axiosError.response?.status;

    if (status === 401) return t("errors.invalidCredentials");
    if (status === 403) return t("errors.forbidden");
    if (status === 409) return t("errors.conflict");
    if (status === 422) return t("errors.validationFailed");
    if (status === 429) return t("errors.tooManyRequests");
    if (status && status >= 500) return t("errors.serverError");

    // Network error (no response received)
    if (!axiosError.response) return t("errors.networkError");
  }

  return t(fallbackKey);
};
