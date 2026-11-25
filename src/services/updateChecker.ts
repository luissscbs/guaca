/**
 * Guaca Open Source Update Checker Service
 * Verifica de forma privada y segura si existen nuevas versiones de Guaca en GitHub Releases.
 * Repositorio oficial: luissscbs/guaca
 */

export interface UpdateCheckResult {
  status: 'up_to_date' | 'update_available' | 'no_releases' | 'error';
  currentVersion: string;
  latestVersion?: string;
  releaseUrl?: string;
  apkDownloadUrl?: string;
  releaseNotes?: string;
  publishedAt?: string;
  errorMessage?: string;
}

export interface UpdateCheckOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/**
 * Compara dos cadenas de versión semántica (ej: 'v1.0.1' y '1.0.0').
 * Retorna 1 si v1 > v2, -1 si v1 < v2, y 0 si son equivalentes.
 */
export function compareSemver(v1: string, v2: string): number {
  const clean1 = (v1 || '').replace(/^v/i, '').trim();
  const clean2 = (v2 || '').replace(/^v/i, '').trim();

  const core1 = clean1.split(/[-+]/)[0];
  const core2 = clean2.split(/[-+]/)[0];

  const parts1 = core1.split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = core2.split('.').map((p) => parseInt(p, 10) || 0);

  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] ?? 0;
    const num2 = parts2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  return 0;
}

/**
 * Consulta la API pública de GitHub para obtener el release más reciente del repositorio especificado.
 */
export async function checkForUpdates(
  currentVersion = '1.0.0',
  repo = 'luissscbs/guaca',
  options: UpdateCheckOptions = {}
): Promise<UpdateCheckResult> {
  const fetchFn = options.fetchImpl || fetch;
  const timeoutMs = options.timeoutMs ?? 8000;

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const url = `https://api.github.com/repos/${repo}/releases/latest`;
    const response = await fetchFn(url, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'guaca-app',
      },
      signal: controller?.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (response.status === 404) {
      return {
        status: 'no_releases',
        currentVersion,
        errorMessage: 'No hay versiones publicadas aún en GitHub.',
      };
    }

    if (!response.ok) {
      return {
        status: 'error',
        currentVersion,
        errorMessage: `Error del servidor de GitHub (${response.status}).`,
      };
    }

    const data = await response.json();
    const latestVersion = (data.tag_name || data.name || '').trim();

    // Buscar APK en los assets
    let apkDownloadUrl: string | undefined;
    if (Array.isArray(data.assets)) {
      const apkAsset = data.assets.find(
        (asset: { name?: string; browser_download_url?: string }) =>
          typeof asset?.name === 'string' && asset.name.toLowerCase().endsWith('.apk')
      );
      if (apkAsset?.browser_download_url) {
        apkDownloadUrl = apkAsset.browser_download_url;
      }
    }

    // Si no hay asset .apk, usar html_url del release como fallback
    if (!apkDownloadUrl && data.html_url) {
      apkDownloadUrl = data.html_url;
    }

    const hasNewerVersion = compareSemver(latestVersion, currentVersion) > 0;

    if (hasNewerVersion) {
      return {
        status: 'update_available',
        currentVersion,
        latestVersion,
        releaseUrl: data.html_url,
        apkDownloadUrl,
        releaseNotes: data.body || undefined,
        publishedAt: data.published_at || undefined,
      };
    }

    return {
      status: 'up_to_date',
      currentVersion,
      latestVersion: latestVersion || currentVersion,
      releaseUrl: data.html_url,
      releaseNotes: data.body || undefined,
      publishedAt: data.published_at || undefined,
    };
  } catch (error: any) {
    if (timeoutId) clearTimeout(timeoutId);

    if (error?.name === 'AbortError') {
      return {
        status: 'error',
        currentVersion,
        errorMessage: 'Tiempo de espera agotado al conectar con GitHub. Revisa tu conexión a internet.',
      };
    }

    return {
      status: 'error',
      currentVersion,
      errorMessage: 'No pudimos conectar con GitHub. Revisa tu conexión a internet.',
    };
  }
}
