import {
  checkForUpdates,
  compareSemver,
  UpdateCheckResult,
} from '../updateChecker';

describe('updateChecker service (TDD)', () => {
  const currentVersion = '1.0.0';
  const repo = 'luissscbs/guaca';

  describe('compareSemver', () => {
    it('compara versiones semánticas correctamente ignorando el prefijo "v"', () => {
      expect(compareSemver('v1.0.1', '1.0.0')).toBe(1);
      expect(compareSemver('1.0.0', 'v1.0.1')).toBe(-1);
      expect(compareSemver('v1.0.0', '1.0.0')).toBe(0);
      expect(compareSemver('1.0.10', '1.0.2')).toBe(1);
      expect(compareSemver('2.0.0', '1.9.9')).toBe(1);
      expect(compareSemver('1.0.0-beta', '1.0.0')).toBe(0);
    });
  });

  describe('checkForUpdates', () => {
    it('retorna "up_to_date" cuando la versión en GitHub es igual a la actual', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          tag_name: 'v1.0.0',
          html_url: 'https://github.com/luissscbs/guaca/releases/tag/v1.0.0',
          body: 'Notas de la versión 1.0.0',
          published_at: '2026-11-20T10:00:00Z',
          assets: [],
        }),
      });

      const result: UpdateCheckResult = await checkForUpdates(currentVersion, repo, {
        fetchImpl: mockFetch as unknown as typeof fetch,
      });

      expect(result.status).toBe('up_to_date');
      expect(result.currentVersion).toBe('1.0.0');
      expect(result.latestVersion).toBe('v1.0.0');
      expect(result.releaseUrl).toBe('https://github.com/luissscbs/guaca/releases/tag/v1.0.0');
    });

    it('retorna "up_to_date" cuando la versión actual es mayor a la de GitHub', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          tag_name: 'v0.9.5',
          html_url: 'https://github.com/luissscbs/guaca/releases/tag/v0.9.5',
          assets: [],
        }),
      });

      const result = await checkForUpdates('1.0.0', repo, {
        fetchImpl: mockFetch as unknown as typeof fetch,
      });

      expect(result.status).toBe('up_to_date');
      expect(result.latestVersion).toBe('v0.9.5');
    });

    it('retorna "update_available" con APK cuando hay una versión superior y asset .apk', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          tag_name: 'v1.0.1',
          html_url: 'https://github.com/luissscbs/guaca/releases/tag/v1.0.1',
          body: 'Corrección de errores y mejoras en el coach.',
          published_at: '2026-11-25T12:00:00Z',
          assets: [
            {
              name: 'guaca-v1.0.1.apk',
              browser_download_url: 'https://github.com/luissscbs/guaca/releases/download/v1.0.1/guaca-v1.0.1.apk',
            },
            {
              name: 'source.zip',
              browser_download_url: 'https://github.com/luissscbs/guaca/releases/download/v1.0.1/source.zip',
            },
          ],
        }),
      });

      const result = await checkForUpdates('1.0.0', repo, {
        fetchImpl: mockFetch as unknown as typeof fetch,
      });

      expect(result.status).toBe('update_available');
      expect(result.currentVersion).toBe('1.0.0');
      expect(result.latestVersion).toBe('v1.0.1');
      expect(result.apkDownloadUrl).toBe(
        'https://github.com/luissscbs/guaca/releases/download/v1.0.1/guaca-v1.0.1.apk'
      );
      expect(result.releaseUrl).toBe('https://github.com/luissscbs/guaca/releases/tag/v1.0.1');
      expect(result.releaseNotes).toBe('Corrección de errores y mejoras en el coach.');
      expect(result.publishedAt).toBe('2026-11-25T12:00:00Z');
    });

    it('retorna "update_available" usando html_url como fallback si no hay asset .apk', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          tag_name: 'v1.1.0',
          html_url: 'https://github.com/luissscbs/guaca/releases/tag/v1.1.0',
          body: 'Nueva función de metas.',
          published_at: '2026-11-25T14:00:00Z',
          assets: [
            {
              name: 'source.tar.gz',
              browser_download_url: 'https://github.com/luissscbs/guaca/releases/download/v1.1.0/source.tar.gz',
            },
          ],
        }),
      });

      const result = await checkForUpdates('1.0.0', repo, {
        fetchImpl: mockFetch as unknown as typeof fetch,
      });

      expect(result.status).toBe('update_available');
      expect(result.apkDownloadUrl).toBe('https://github.com/luissscbs/guaca/releases/tag/v1.1.0');
    });

    it('retorna "no_releases" cuando GitHub devuelve 404 (repositorio sin releases)', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not Found' }),
      });

      const result = await checkForUpdates('1.0.0', repo, {
        fetchImpl: mockFetch as unknown as typeof fetch,
      });

      expect(result.status).toBe('no_releases');
      expect(result.currentVersion).toBe('1.0.0');
      expect(result.errorMessage).toMatch(/no hay versiones publicadas/i);
    });

    it('retorna "error" cuando ocurre una falla de red o rechazo de fetch', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network request failed'));

      const result = await checkForUpdates('1.0.0', repo, {
        fetchImpl: mockFetch as unknown as typeof fetch,
      });

      expect(result.status).toBe('error');
      expect(result.currentVersion).toBe('1.0.0');
      expect(result.errorMessage).toMatch(/conexión/i);
    });

    it('retorna "error" cuando el servidor responde con error 500', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await checkForUpdates('1.0.0', repo, {
        fetchImpl: mockFetch as unknown as typeof fetch,
      });

      expect(result.status).toBe('error');
      expect(result.errorMessage).toBeDefined();
    });

    it('maneja el timeout correctamente', async () => {
      const mockFetch = jest.fn().mockImplementation((_url, options) => {
        return new Promise((_, reject) => {
          if (options?.signal) {
            options.signal.addEventListener('abort', () => {
              const err = new Error('The operation was aborted');
              err.name = 'AbortError';
              reject(err);
            });
          }
        });
      });

      const result = await checkForUpdates('1.0.0', repo, {
        fetchImpl: mockFetch as unknown as typeof fetch,
        timeoutMs: 50,
      });

      expect(result.status).toBe('error');
      expect(result.errorMessage).toMatch(/conexión|tiempo de espera/i);
    });
  });
});
