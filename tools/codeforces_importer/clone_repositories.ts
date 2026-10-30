import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CloneResult {
  repository: string;
  target_dir: string;
  commit_sha: string;
  status: 'cloned' | 'cached' | 'failed';
  error?: string;
}

export async function cloneRepositories(configPath?: string): Promise<CloneResult[]> {
  const configFile = configPath || path.resolve(__dirname, 'config.json');
  const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
  const cacheDir = path.resolve(process.cwd(), config.cache_directory || '.importer_cache/repos');

  fs.mkdirSync(cacheDir, { recursive: true });

  const results: CloneResult[] = [];
  const eligibleRepos = config.repositories.filter((r: any) => r.redistribution_permitted);

  console.log(`[Clone] Found ${eligibleRepos.length} eligible repositories out of ${config.repositories.length} total.`);

  for (const repo of eligibleRepos) {
    const safeRepoName = repo.full_name.replace(/[\/\\]/g, '_');
    const targetDir = path.join(cacheDir, safeRepoName);

    console.log(`[Clone] Processing ${repo.full_name}...`);

    let commitSha = 'UNKNOWN';
    let status: 'cloned' | 'cached' | 'failed' = 'failed';
    let errorMessage: string | undefined;

    if (fs.existsSync(path.join(targetDir, '.git'))) {
      try {
        commitSha = execSync('git rev-parse HEAD', { cwd: targetDir, encoding: 'utf-8' }).trim();
        console.log(`[Clone] Reusing cached clone for ${repo.full_name} at SHA: ${commitSha.slice(0, 8)}`);
        status = 'cached';
      } catch (err: any) {
        console.warn(`[Clone] Could not read commit SHA from existing cache for ${repo.full_name}. Re-cloning.`);
        fs.rmSync(targetDir, { recursive: true, force: true });
      }
    }

    if (status !== 'cached') {
      let attempts = 0;
      const maxAttempts = 3;
      let success = false;

      while (attempts < maxAttempts && !success) {
        attempts++;
        try {
          const cloneCmd = `git clone --depth 1 --branch ${repo.default_branch} ${repo.clone_url} "${targetDir}"`;
          execSync(cloneCmd, { stdio: 'pipe' });
          commitSha = execSync('git rev-parse HEAD', { cwd: targetDir, encoding: 'utf-8' }).trim();
          status = 'cloned';
          success = true;
          console.log(`[Clone] Successfully cloned ${repo.full_name} (attempt ${attempts}, SHA: ${commitSha.slice(0, 8)})`);
        } catch (err: any) {
          errorMessage = err.message;
          console.warn(`[Clone] Attempt ${attempts} failed for ${repo.full_name}: ${err.message}`);
          if (attempts < maxAttempts) {
            const backoffMs = Math.pow(2, attempts) * 1000;
            console.log(`[Clone] Waiting ${backoffMs}ms before retry...`);
            await new Promise((r) => setTimeout(r, backoffMs));
          }
        }
      }

      if (!success) {
        status = 'failed';
      }
    }

    results.push({
      repository: repo.full_name,
      target_dir: targetDir,
      commit_sha: commitSha,
      status,
      error: errorMessage,
    });
  }

  return results;
}

// Direct CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  cloneRepositories()
    .then((results) => {
      console.log('[Clone] Completed. Results summary:');
      console.table(results.map((r) => ({ repo: r.repository, status: r.status, sha: r.commit_sha.slice(0, 8) })));
    })
    .catch((err) => {
      console.error('[Clone] Fatal error:', err);
      process.exit(1);
    });
}
