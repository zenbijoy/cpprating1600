import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

export interface ScannedFile {
  repo: string;
  repo_url: string;
  commit_sha: string;
  file_path: string;
  abs_path: string;
  file_size: number;
  sha256: string;
  extension: string;
}

const IGNORED_DIRS = new Set([
  '.git',
  '.vscode',
  '.idea',
  'bin',
  'obj',
  'build',
  'dist',
  'node_modules',
  '__pycache__',
]);

const ALLOWED_EXTENSIONS = new Set(['.cpp', '.cc', '.cxx', '.C']);

export function scanRepository(
  repoFullName: string,
  repoUrl: string,
  commitSha: string,
  repoDir: string
): ScannedFile[] {
  const scanned: ScannedFile[] = [];

  function traverse(currentDir: string) {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (e) {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          traverse(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ALLOWED_EXTENSIONS.has(ext)) {
          try {
            const stat = fs.statSync(fullPath);
            // Skip empty files or files > 1MB
            if (stat.size > 0 && stat.size <= 1024 * 1024) {
              const fileBuffer = fs.readFileSync(fullPath);
              const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
              const relPath = path.relative(repoDir, fullPath).replace(/\\/g, '/');

              scanned.push({
                repo: repoFullName,
                repo_url: repoUrl,
                commit_sha: commitSha,
                file_path: relPath,
                abs_path: fullPath,
                file_size: stat.size,
                sha256,
                extension: ext,
              });
            }
          } catch (e) {
            // Skip unreadable files
          }
        }
      }
    }
  }

  traverse(repoDir);
  return scanned;
}

// Direct CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const configFile = path.resolve(process.cwd(), 'tools/codeforces_importer/config.json');
  const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
  const cacheDir = path.resolve(process.cwd(), config.cache_directory || '.importer_cache/repos');

  let total = 0;
  for (const repo of config.repositories.filter((r: any) => r.redistribution_permitted)) {
    const safeRepoName = repo.full_name.replace(/[\/\\]/g, '_');
    const targetDir = path.join(cacheDir, safeRepoName);
    if (fs.existsSync(targetDir)) {
      const files = scanRepository(repo.full_name, repo.clone_url, 'cached', targetDir);
      total += files.length;
      console.log(`[Scan] ${repo.full_name}: found ${files.length} candidate C++ files.`);
    }
  }
  console.log(`[Scan] Total candidate files discovered: ${total}`);
}
