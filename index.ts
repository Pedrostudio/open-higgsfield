/* Seedance 2.5 text-to-video through the official Higgsfield SDK.

     pnpm example:seedance

   Reads HF_CREDENTIALS ("key-id:key-secret") from .env.local at runtime and
   never prints it. Makes one billable generation and prints the video URL,
   or says plainly why there is none. */

import { APIError, TimeoutError, ValidationError, config, higgsfield } from "@higgsfield/client/v2";

const MODEL = "bytedance/seedance-2.5/text-to-video";

try {
  process.loadEnvFile(".env.local");
} catch {
  fail("Could not read .env.local — create it with HF_CREDENTIALS=key-id:key-secret.");
}

const credentials = process.env.HF_CREDENTIALS?.trim();
if (!credentials) fail("HF_CREDENTIALS is not set in .env.local.");
const shapeProblem = credentialShapeProblem(credentials);
if (shapeProblem) fail(`HF_CREDENTIALS must be key-id:key-secret — ${shapeProblem}.`);

config({
  credentials,
  // The SDK retries a failed submit, and a submit that timed out on our side
  // may still have been accepted — a retry would bill a second generation.
  maxRetries: 0,
  pollInterval: 5_000,
  // The SDK's default gives up after 5 minutes; video can queue longer.
  maxPollTime: 20 * 60_000,
});

console.log(`Submitting ${MODEL} and waiting for the result…`);

try {
  const result = await higgsfield.subscribe(MODEL, {
    input: {
      prompt: "A cinematic scene at sunset",
      duration: 5,
      resolution: "720p",
      aspect_ratio: "16:9",
    },
    withPolling: true,
  });

  // Typed as the SDK's union, but the API also answers "canceled".
  const status: string = result.status;
  const videoUrl = result.video?.url;

  if (status === "completed" && videoUrl) {
    console.log(`Completed (request ${result.request_id})`);
    console.log(videoUrl);
  } else if (status === "completed") {
    fail(`Request ${result.request_id} completed without a video URL.`);
  } else if (status === "nsfw") {
    fail(`Request ${result.request_id} was blocked by moderation (nsfw). No video was produced.`);
  } else if (status === "canceled") {
    fail(`Request ${result.request_id} was canceled. No video was produced.`);
  } else if (status === "failed") {
    const reason = (result as { error?: unknown }).error;
    fail(`Request ${result.request_id} failed${reason ? `: ${describe(reason)}` : "."}`);
  } else {
    fail(`Request ${result.request_id} ended in unexpected status "${status}".`);
  }
} catch (error) {
  // Never print the raw error: axios errors carry the request headers,
  // Authorization included. Only the name, message and API detail go out.
  if (error instanceof TimeoutError) {
    fail(
      `${error.message}. The SDK only stops on completed, failed or nsfw, so a canceled ` +
        "request also ends here. No video URL was returned.",
    );
  }
  if (error instanceof ValidationError) {
    fail(`Rejected by the API (422): ${describe(error.details ?? error.message)}`);
  }
  if (error instanceof APIError) {
    const detail = error.responseData?.detail ?? error.responseData;
    fail(`${error.name} (${error.statusCode ?? "no status"}): ${detail ? describe(detail) : error.message}`);
  }
  if (error instanceof Error) fail(`${error.name}: ${error.message}`);
  fail("Unknown error while generating.");
}

/** What is wrong with the value's shape, described without echoing any of it. */
function credentialShapeProblem(value: string): string | null {
  const colons = value.split(":").length - 1;
  if (/\s/.test(value)) return "it contains spaces or line breaks (a pasted label or a 'Key ' prefix?)";
  if (/["'`]/.test(value)) return "it contains quote characters";
  if (colons === 0) return "it has no colon, so only one of the two parts is there (ID or secret)";
  if (colons > 1) return `it has ${colons} colons instead of one (a pasted label like "ID:"?)`;
  if (value.startsWith(":")) return "the key ID before the colon is empty";
  if (value.endsWith(":")) return "the secret after the colon is empty";
  return null;
}

function describe(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}
