/**
 * Twilio Signature Validation Utility
 *
 * Validates incoming Twilio webhook requests using HMAC-SHA1 signature verification.
 * This prevents unauthorized parties from sending fake webhook requests to our endpoints.
 *
 * Reference: https://www.twilio.com/docs/usage/security#validating-requests
 */

/**
 * Convert an ArrayBuffer to a base64 string.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Compute HMAC-SHA1 signature using the Web Crypto API (available in Deno).
 */
async function hmacSha1(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const msgData = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  return arrayBufferToBase64(signature);
}

/**
 * Build the validation string from the URL and POST body parameters.
 * Per Twilio's spec:
 *   1. Start with the full request URL (including scheme, host, port, path, and query string)
 *   2. If the request is a POST with application/x-www-form-urlencoded body,
 *      sort the POST parameters alphabetically by key name and append
 *      each key-value pair (key + value, no separator) to the URL.
 */
function buildSignatureBaseString(url: string, params: Record<string, string>): string {
  let baseString = url;

  // Sort parameters alphabetically by key and append key+value
  const sortedKeys = Object.keys(params).sort();
  for (const key of sortedKeys) {
    baseString += key + params[key];
  }

  return baseString;
}

/**
 * Validate a Twilio webhook request signature.
 *
 * @param authToken - The Twilio Auth Token (used as the HMAC key)
 * @param twilioSignature - The X-Twilio-Signature header value
 * @param url - The full URL of the request (as Twilio sees it)
 * @param params - The POST body parameters as key-value pairs
 * @returns true if the signature is valid
 */
export async function validateTwilioSignature(
  authToken: string,
  twilioSignature: string,
  url: string,
  params: Record<string, string>
): Promise<boolean> {
  const baseString = buildSignatureBaseString(url, params);
  const expectedSignature = await hmacSha1(authToken, baseString);

  // Use constant-time comparison to prevent timing attacks
  if (expectedSignature.length !== twilioSignature.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < expectedSignature.length; i++) {
    result |= expectedSignature.charCodeAt(i) ^ twilioSignature.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Check if the request URL indicates a development/local environment.
 * In development, we skip Twilio signature validation since Twilio
 * cannot sign requests to localhost.
 */
function isDevelopment(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '0.0.0.0' ||
      parsed.hostname.endsWith('.local')
    );
  } catch {
    return false;
  }
}

/**
 * Extract form data parameters as a plain key-value Record.
 * Used to rebuild the signature base string.
 */
export function formDataToRecord(formData: FormData): Record<string, string> {
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = value.toString();
  });
  return params;
}

/**
 * Middleware-style function to validate an incoming Twilio webhook request.
 *
 * Returns null if validation passes (or is skipped in development).
 * Returns a 403 Response if validation fails.
 *
 * Usage in an Edge Function:
 * ```ts
 * const validationError = await validateTwilioRequest(req, formDataParams);
 * if (validationError) return validationError;
 * ```
 *
 * @param req - The incoming Request object
 * @param params - The parsed POST body parameters (from formData)
 * @returns null if valid, or a 403 Response if invalid
 */
export async function validateTwilioRequest(
  req: Request,
  params: Record<string, string> = {}
): Promise<Response | null> {
  const requestUrl = req.url;

  // Skip validation in development environments
  if (isDevelopment(requestUrl)) {
    console.log('[twilio-validation] Skipping signature validation in development mode');
    return null;
  }

  const twilioSignature = req.headers.get('X-Twilio-Signature');
  if (!twilioSignature) {
    console.error('[twilio-validation] Missing X-Twilio-Signature header');
    return new Response('Forbidden: Missing Twilio signature', { status: 403 });
  }

  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  if (!authToken) {
    console.error('[twilio-validation] TWILIO_AUTH_TOKEN not set in environment');
    // In production without auth token, we cannot validate - reject the request
    return new Response('Forbidden: Server misconfiguration', { status: 403 });
  }

  const isValid = await validateTwilioSignature(authToken, twilioSignature, requestUrl, params);

  if (!isValid) {
    console.error('[twilio-validation] Invalid Twilio signature');
    return new Response('Forbidden: Invalid Twilio signature', { status: 403 });
  }

  console.log('[twilio-validation] Twilio signature validated successfully');
  return null;
}
