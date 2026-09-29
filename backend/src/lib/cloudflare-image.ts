export const FREE_IMAGE_MODELS = {
  flux: '@cf/black-forest-labs/flux-1-schnell',
  leonardo: '@cf/leonardo/phoenix-1.0',
} as const;

export type FreeImageMode = 'auto' | 'fast' | 'leonardo';

export type FreeImageCandidate = {
  model: string;
  width: number;
  height: number;
  steps: number;
  estimatedNeurons: number;
};

const TYPOGRAPHY_HINT = /\b(text|title|poster|logo|sign|lettering|typography|headline|word|label|packaging)\b/i;

export function dimensionsForAspect(aspectRatio: string) {
  switch (aspectRatio) {
    case '4:3': return { width: 1024, height: 768 };
    case '3:4': return { width: 768, height: 1024 };
    case '16:9': return { width: 1024, height: 576 };
    case '9:16': return { width: 576, height: 1024 };
    default: return { width: 1024, height: 1024 };
  }
}

function phoenixCandidate(aspectRatio: string): FreeImageCandidate {
  const { width, height } = dimensionsForAspect(aspectRatio);
  const tileCount = Math.ceil(width / 512) * Math.ceil(height / 512);
  const steps = 12;
  return {
    model: FREE_IMAGE_MODELS.leonardo,
    width,
    height,
    steps,
    estimatedNeurons: tileCount * 530 + steps * 10,
  };
}

function fluxCandidate(): FreeImageCandidate {
  const steps = 4;
  // FLUX.1 Schnell uses 4.8 neurons per 512x512 tile + 9.6 per step.
  // Its Cloudflare endpoint does not expose aspect controls in the documented schema.
  return {
    model: FREE_IMAGE_MODELS.flux,
    width: 1024,
    height: 1024,
    steps,
    estimatedNeurons: 4 * 4.8 + steps * 9.6,
  };
}

export function chooseFreeImageCandidates(mode: FreeImageMode, prompt: string, aspectRatio: string) {
  const flux = fluxCandidate();
  const phoenix = phoenixCandidate(aspectRatio);

  if (mode === 'fast') return [flux];
  if (mode === 'leonardo') return [phoenix, flux];

  // Auto spends the very small Flux quota for ordinary square art, and uses
  // Leonardo Phoenix where layout/text/aspect handling is materially useful.
  if (aspectRatio !== '1:1' || TYPOGRAPHY_HINT.test(prompt)) return [phoenix, flux];
  return [flux, phoenix];
}

function requireCloudflareFreeAccount() {
  if (process.env.QUOARAAI_CLOUDFLARE_FREE_ONLY !== 'true') throw new Error('Cloudflare image routing is not free-only.');
  if (process.env.QUOARAAI_CLOUDFLARE_FREE_PLAN_CONFIRMED !== 'true') throw new Error('Cloudflare Workers Free plan has not been owner-confirmed.');
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) throw new Error('Cloudflare Workers AI credentials are not configured.');
  return { accountId, apiToken };
}

function requestBody(candidate: FreeImageCandidate, prompt: string) {
  if (candidate.model === FREE_IMAGE_MODELS.leonardo) {
    return {
      prompt,
      width: candidate.width,
      height: candidate.height,
      num_steps: candidate.steps,
      guidance: 2.5,
    };
  }
  return { prompt, steps: candidate.steps };
}

type CloudflareEnvelope = {
  result?: { image?: unknown } | string | null;
  success?: boolean;
  errors?: unknown[];
};

export async function generateFreeCloudflareImage(prompt: string, candidates: FreeImageCandidate[]) {
  const { accountId, apiToken } = requireCloudflareFreeAccount();
  const failures: string[] = [];

  for (const candidate of candidates) {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${candidate.model}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody(candidate, prompt)),
          cache: 'no-store',
          signal: AbortSignal.timeout(60_000),
        },
      );

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        failures.push(`${candidate.model}: HTTP ${response.status}${detail ? ` ${detail.slice(0, 240)}` : ''}`);
        // Only move within the action's owner-approved free model pool.
        if ([403, 408, 429, 500, 502, 503, 504].includes(response.status)) continue;
        throw new Error(`Image provider failed with HTTP ${response.status}.`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.startsWith('image/')) {
        const bytes = Buffer.from(await response.arrayBuffer());
        return {
          dataUrl: `data:${contentType.split(';')[0]};base64,${bytes.toString('base64')}`,
          model: candidate.model,
          estimatedNeurons: candidate.estimatedNeurons,
        };
      }

      const envelope = await response.json().catch(() => null) as CloudflareEnvelope | null;
      const image = envelope && typeof envelope.result === 'object' && envelope.result && 'image' in envelope.result
        ? envelope.result.image
        : null;
      if (typeof image === 'string' && image) {
        return {
          dataUrl: `data:image/jpeg;base64,${image}`,
          model: candidate.model,
          estimatedNeurons: candidate.estimatedNeurons,
        };
      }

      failures.push(`${candidate.model}: provider returned no image`);
    } catch (error) {
      failures.push(`${candidate.model}: ${error instanceof Error ? error.message : 'request failed'}`);
    }
  }

  throw new Error(`All approved free image models were unavailable. ${failures.join(' | ')}`);
}
