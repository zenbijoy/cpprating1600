import fs from 'fs';
import path from 'path';
import { Request, Response, Express } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseBulkImporter } from '../../tools/codeforces_importer/import_to_supabase';

export interface ServerSolutionItem {
  id: string;
  problem_id: string | null;
  contest_id: number | null;
  problem_index: string | null;
  problem_name: string | null;
  language: string;
  compiler_standard: string;
  source_code?: string;
  source_sha256: string;
  normalized_sha256: string;
  validation_status: string;
  validation_notes?: string;
  mapping_confidence: string;
  source_repository: string;
  source_repository_url: string;
  source_file_path: string;
  source_commit: string;
  original_author: string;
  license_spdx: string;
  license_verified: boolean;
  is_public: boolean;
  provenance: any[];
  // Enriched fields from official catalog
  rating?: number | null;
  tags?: string[];
  statement_url?: string;
}

export class SolutionEngineServer {
  private solutionsMap: Map<string, ServerSolutionItem> = new Map();
  private solutionsList: ServerSolutionItem[] = [];
  private officialProblemsMap: Map<string, any> = new Map();
  private supabase: SupabaseClient | null = null;
  private dataDir: string;

  constructor() {
    this.dataDir = path.resolve(process.cwd(), 'data/codeforces');

    let supabaseUrl = (process.env.SUPABASE_URL || 'https://ptwrscbantaseijldwgt.supabase.co').trim();
    if (supabaseUrl.includes('dashboard/project/')) {
      const match = supabaseUrl.match(/project\/([a-zA-Z0-9]+)/);
      if (match) {
        supabaseUrl = `https://${match[1]}.supabase.co`;
      }
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceRoleKey) {
      try {
        this.supabase = createClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false },
        });
      } catch (e) {
        console.warn('[SolutionEngineServer] Supabase client init error:', e);
      }
    }

    this.loadData();
  }

  public loadData() {
    // 1. Load official problems dictionary
    const officialPath = path.join(this.dataDir, 'official_problems.json');
    if (fs.existsSync(officialPath)) {
      try {
        const raw = fs.readFileSync(officialPath, 'utf-8');
        const list = JSON.parse(raw);
        for (const p of list) {
          const key = `${p.contestId}${p.index.toUpperCase()}`;
          this.officialProblemsMap.set(key, p);
        }
        console.log(`[SolutionEngineServer] Loaded ${this.officialProblemsMap.size} official problems.`);
      } catch (e: any) {
        console.warn('[SolutionEngineServer] Failed to load official problems:', e.message);
      }
    }

    // 2. Load solutions store (or fallback to manifest.json)
    const storePath = path.join(this.dataDir, 'solutions_store.json');
    const manifestPath = path.join(this.dataDir, 'manifest.json');

    let rawData: Record<string, ServerSolutionItem> | ServerSolutionItem[] | null = null;

    if (fs.existsSync(storePath)) {
      try {
        rawData = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
      } catch (e: any) {
        console.warn('[SolutionEngineServer] Failed to load solutions_store.json:', e.message);
      }
    } else if (fs.existsSync(manifestPath)) {
      try {
        rawData = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      } catch (e: any) {
        console.warn('[SolutionEngineServer] Failed to load manifest.json:', e.message);
      }
    }

    if (rawData) {
      this.solutionsMap.clear();
      this.solutionsList = [];

      const items = Array.isArray(rawData) ? rawData : Object.values(rawData);

      for (const item of items) {
        // Enrich with official metadata if available
        if (item.problem_id) {
          const official = this.officialProblemsMap.get(item.problem_id.toUpperCase());
          if (official) {
            item.rating = official.rating || null;
            item.tags = official.tags || [];
            item.problem_name = official.name;
            item.statement_url = `https://codeforces.com/problemset/problem/${official.contestId}/${official.index}`;
          }
        }
        this.solutionsMap.set(item.id, item);
        this.solutionsList.push(item);
      }
      console.log(`[SolutionEngineServer] Indexed ${this.solutionsList.length} verified solutions.`);
    }
  }

  public registerRoutes(app: Express) {
    // 1. Search & Filter Solutions (Lightweight metadata projection)
    app.get('/api/solutions', (req: Request, res: Response) => {
      const search = String(req.query.search || '').trim().toLowerCase();
      const tag = req.query.tag ? String(req.query.tag).toLowerCase() : undefined;
      const minRating = req.query.minRating ? parseInt(String(req.query.minRating), 10) : undefined;
      const maxRating = req.query.maxRating ? parseInt(String(req.query.maxRating), 10) : undefined;
      const contestId = req.query.contestId ? parseInt(String(req.query.contestId), 10) : undefined;
      const status = req.query.status ? String(req.query.status) : undefined;
      const repo = req.query.repo ? String(req.query.repo).toLowerCase() : undefined;
      const sortBy = req.query.sortBy ? String(req.query.sortBy) : 'rating-asc';
      const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
      const pageSize = Math.min(100, Math.max(10, parseInt(String(req.query.pageSize || '20'), 10)));

      let filtered = this.solutionsList;

      if (search) {
        filtered = filtered.filter(
          (s) =>
            (s.problem_id && s.problem_id.toLowerCase().includes(search)) ||
            (s.problem_name && s.problem_name.toLowerCase().includes(search)) ||
            (s.original_author && s.original_author.toLowerCase().includes(search)) ||
            (s.tags && s.tags.some((t) => t.toLowerCase().includes(search)))
        );
      }

      if (tag) {
        filtered = filtered.filter((s) => s.tags && s.tags.some((t) => t.toLowerCase() === tag));
      }

      if (minRating !== undefined) {
        filtered = filtered.filter((s) => s.rating !== null && s.rating !== undefined && s.rating >= minRating);
      }

      if (maxRating !== undefined) {
        filtered = filtered.filter((s) => s.rating !== null && s.rating !== undefined && s.rating <= maxRating);
      }

      if (contestId !== undefined) {
        filtered = filtered.filter((s) => s.contest_id === contestId);
      }

      if (status) {
        filtered = filtered.filter((s) => s.validation_status === status);
      }

      if (repo) {
        filtered = filtered.filter((s) => s.source_repository.toLowerCase().includes(repo));
      }

      // Sorting
      filtered.sort((a, b) => {
        if (sortBy === 'rating-desc') {
          return (b.rating || 0) - (a.rating || 0);
        }
        if (sortBy === 'rating-asc') {
          return (a.rating || 9999) - (b.rating || 9999);
        }
        if (sortBy === 'contest-desc') {
          return (b.contest_id || 0) - (a.contest_id || 0);
        }
        if (sortBy === 'contest-asc') {
          return (a.contest_id || 0) - (b.contest_id || 0);
        }
        return (a.problem_id || '').localeCompare(b.problem_id || '');
      });

      const total = filtered.length;
      const totalPages = Math.ceil(total / pageSize);
      const offset = (page - 1) * pageSize;
      const paged = filtered.slice(offset, offset + pageSize);

      // Return lightweight projection without heavy source_code
      const results = paged.map((s) => ({
        id: s.id,
        problem_id: s.problem_id,
        contest_id: s.contest_id,
        problem_index: s.problem_index,
        problem_name: s.problem_name,
        rating: s.rating,
        tags: s.tags,
        language: s.language,
        compiler_standard: s.compiler_standard,
        validation_status: s.validation_status,
        mapping_confidence: s.mapping_confidence,
        source_repository: s.source_repository,
        source_file_path: s.source_file_path,
        original_author: s.original_author,
        license_spdx: s.license_spdx,
        statement_url: s.statement_url,
      }));

      res.json({
        success: true,
        total,
        page,
        pageSize,
        totalPages,
        results,
      });
    });

    // 2. Get Single Solution by ID (includes full source code)
    app.get('/api/solutions/:id', (req: Request, res: Response) => {
      const { id } = req.params;
      const solution = this.solutionsMap.get(id);
      if (!solution) {
        return res.status(404).json({ success: false, error: 'Solution not found' });
      }
      res.json({ success: true, solution });
    });

    // 3. Get all solutions for a specific Problem ID (e.g. "1000A")
    app.get('/api/solutions/problem/:problemId', (req: Request, res: Response) => {
      const problemId = String(req.params.problemId || '').toUpperCase();
      const solutions = this.solutionsList.filter(
        (s) => s.problem_id && s.problem_id.toUpperCase() === problemId
      );

      res.json({
        success: true,
        problemId,
        count: solutions.length,
        solutions,
      });
    });

    // 4. Side-by-side Solution Comparison
    app.get('/api/solutions/compare', (req: Request, res: Response) => {
      const id1 = String(req.query.id1 || '');
      const id2 = String(req.query.id2 || '');

      const sol1 = this.solutionsMap.get(id1);
      const sol2 = this.solutionsMap.get(id2);

      if (!sol1 || !sol2) {
        return res.status(404).json({ success: false, error: 'One or both solutions could not be found' });
      }

      const lines1 = (sol1.source_code || '').split('\n');
      const lines2 = (sol2.source_code || '').split('\n');

      res.json({
        success: true,
        solution1: sol1,
        solution2: sol2,
        metrics: {
          solution1: {
            lines: lines1.length,
            chars: sol1.source_code?.length || 0,
            author: sol1.original_author,
            repo: sol1.source_repository,
            standard: sol1.compiler_standard,
          },
          solution2: {
            lines: lines2.length,
            chars: sol2.source_code?.length || 0,
            author: sol2.original_author,
            repo: sol2.source_repository,
            standard: sol2.compiler_standard,
          },
          identical_normalized: sol1.normalized_sha256 === sol2.normalized_sha256,
        },
      });
    });

    // 5. Admin Dashboard Statistics & Audit Summary
    app.get('/api/admin/importer/status', (_req: Request, res: Response) => {
      let summary: any = null;
      let dupReport: any = null;

      try {
        const sumPath = path.join(this.dataDir, 'import_summary.json');
        if (fs.existsSync(sumPath)) {
          summary = JSON.parse(fs.readFileSync(sumPath, 'utf-8'));
        }
      } catch {}

      try {
        const dupPath = path.join(this.dataDir, 'duplicate_report.json');
        if (fs.existsSync(dupPath)) {
          dupReport = JSON.parse(fs.readFileSync(dupPath, 'utf-8'));
        }
      } catch {}

      // Repository breakdown
      const repoCounts: Record<string, number> = {};
      for (const s of this.solutionsList) {
        repoCounts[s.source_repository] = (repoCounts[s.source_repository] || 0) + 1;
      }

      res.json({
        success: true,
        status: 'online',
        summary,
        total_in_memory: this.solutionsList.length,
        official_problems_indexed: this.officialProblemsMap.size,
        duplicate_stats: dupReport,
        repository_breakdown: repoCounts,
        supabase_connected: !!this.supabase,
        timestamp: new Date().toISOString(),
      });
    });

    // 6. Admin Review Queue
    app.get('/api/admin/importer/review-queue', (_req: Request, res: Response) => {
      try {
        const queuePath = path.join(this.dataDir, 'unmatched_problems.json');
        const queue = fs.existsSync(queuePath) ? JSON.parse(fs.readFileSync(queuePath, 'utf-8')) : [];
        res.json({ success: true, count: queue.length, items: queue });
      } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // 7. Admin License Exclusions
    app.get('/api/admin/importer/exclusions', (_req: Request, res: Response) => {
      try {
        const excPath = path.join(this.dataDir, 'license_exclusions.json');
        const exclusions = fs.existsSync(excPath) ? JSON.parse(fs.readFileSync(excPath, 'utf-8')) : [];
        res.json({ success: true, count: exclusions.length, exclusions });
      } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // 8. Admin Repository Inventory
    app.get('/api/admin/importer/inventory', (_req: Request, res: Response) => {
      try {
        const invPath = path.join(this.dataDir, 'repository_inventory.json');
        const inventory = fs.existsSync(invPath) ? JSON.parse(fs.readFileSync(invPath, 'utf-8')) : [];
        res.json({ success: true, count: inventory.length, inventory });
      } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // 9. Admin Validation Report
    app.get('/api/admin/importer/validation-report', (_req: Request, res: Response) => {
      try {
        const valPath = path.join(this.dataDir, 'validation_report.json');
        const valReport = fs.existsSync(valPath) ? JSON.parse(fs.readFileSync(valPath, 'utf-8')) : null;
        res.json({ success: true, report: valReport });
      } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // 10. Admin Trigger Bulk Import
    app.post('/api/admin/importer/run', async (req: Request, res: Response) => {
      try {
        const dryRun = req.body.dryRun ?? true;
        const maxRecords = req.body.maxRecords ? parseInt(String(req.body.maxRecords), 10) : undefined;
        const batchSize = req.body.batchSize ? parseInt(String(req.body.batchSize), 10) : 100;

        const importer = new SupabaseBulkImporter();
        const result = await importer.runImport({ dryRun, maxRecords, batchSize });

        res.json({ success: true, result });
      } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // 11. Admin Refresh / Reload
    app.post('/api/admin/importer/reload', (_req: Request, res: Response) => {
      this.loadData();
      res.json({
        success: true,
        message: `Reloaded data store. Total active solutions: ${this.solutionsList.length}`,
      });
    });
  }
}
