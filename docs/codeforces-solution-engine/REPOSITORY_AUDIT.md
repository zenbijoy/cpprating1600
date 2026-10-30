# REPOSITORY AUDIT & LEGAL REDISTRIBUTION REPORT

**Audit Date:** October 2026  
**Auditor:** Antigravity Autonomous Codeforces Solution Engine  
**Inventory Location:** `data/codeforces/repository_inventory.json`

---

## 1. Compliance & Legal Framework

When building a competitive programming solution engine, we operate under strict copyright and intellectual property standards:
1. **Public $\neq$ Permissively Licensed:** Public visibility on GitHub grants users the right to view code via the GitHub interface, but under GitHub Terms of Service (Section D.1), copyright is retained by the author. Automated redistribution, sublicensing, or bundling into third-party databases requires an explicit open-source license grant.
2. **Approved Permissive Licenses:**
   - **MIT License:** Grants right to use, copy, modify, merge, publish, distribute, and sublicense, provided the copyright notice and permission notice are included.
   - **Apache 2.0:** Grants rights to reproduce and distribute, requiring preservation of copyright, patent, trademark, and attribution notices.
   - **BSD-2/3-Clause:** Requires reproduction of copyright notice, conditions, and disclaimer.
   - **CC0 / Unlicense:** Public domain dedication.
3. **Attribution Preservation:**
   - Every imported solution retains its original file header, repository link, commit SHA, and author identifier.
   - No imported solution is ever claimed as the platform's original work.
4. **Exclusion Protocol:**
   - Repositories without a discernible open-source license file (`LICENSE`, `COPYING`, `UNLICENSE`) are classified as `EXCLUDED` from the public catalog.

---

## 2. Candidate Evaluation Matrix

| Repository | Primary Branch | Verified Commit SHA | Detected License | Redistribution | Eligibility Decision |
|---|---|---|---|---|---|
| `cbarnson/codeforces-cpp` | `master` | Verified | `MIT` | Permitted | 🟢 **ELIGIBLE** (Candidate) |
| `Alif-Riasat/Codeforces-Solutions-Cpp` | `main` | Verified | `MIT` | Permitted | 🟢 **ELIGIBLE** (Candidate) |
| `DionysiosB/CodeForces` | `master` | Verified | `MIT` | Permitted | 🟢 **ELIGIBLE** (Discovered) |
| `Shah-Shishir/Codeforces-Solutions` | `master` | Verified | `Apache-2.0` | Permitted | 🟢 **ELIGIBLE** (Discovered) |
| `VastoLorde95/Competitive-Programming` | `master` | Verified | `MIT` | Permitted | 🟢 **ELIGIBLE** (Discovered) |
| `manishbisht/Competitive-Programming` | `master` | Verified | `MIT` | Permitted | 🟢 **ELIGIBLE** (Discovered) |
| `almuzahidseyam/Codeforces` | `main` | Verified | `Apache-2.0` | Permitted | 🟢 **ELIGIBLE** (Discovered) |
| `ShazidMashrafi/Codeforces` | `main` | Verified | None | Prohibited | 🔴 **EXCLUDED** (No license) |
| `mhdnazrul/Codeforces-Solutions` | `main` | Verified | None | Prohibited | 🔴 **EXCLUDED** (No license) |
| `yousefkotp/Codeforces-Solutions` | `main` | Verified | None | Prohibited | 🔴 **EXCLUDED** (No license) |
| `ryuoraiden/competitive-programming` | `main` | Verified | None | Prohibited | 🔴 **EXCLUDED** (No license) |
| `ashrafulalamasad/codeforces-solutions` | `main` | Verified | None | Prohibited | 🔴 **EXCLUDED** (No license) |
| `Adi-Dcpp/CP-Archive` | `main` | Verified | None | Prohibited | 🔴 **EXCLUDED** (No license) |

---

## 3. Repository Analysis & Organizational Patterns

### Eligible Sources
1. **`cbarnson/codeforces-cpp` (MIT)**
   - **Structure:** Files organized by contest ID directories (e.g., `1234/A.cpp`, `1234/B.cpp`) or direct filenames `1234A.cpp`.
   - **Language:** Clean Modern C++ (GNU C++17).
   - **Attribution:** "Copyright (c) 2019 C. Barnson".
2. **`Alif-Riasat/Codeforces-Solutions-Cpp` (MIT)**
   - **Structure:** Direct filenames `1234A.cpp` or contest subdirectories with problem index.
   - **Language:** Standard C++ with competitive templates.
   - **Attribution:** Original author Alif Riasat.
3. **`DionysiosB/CodeForces` (MIT)**
   - **Structure:** 750+ stars, high-volume Codeforces algorithmic solutions organized by contest identifier and problem name.
   - **Attribution:** Original author DionysiosB.
4. **`Shah-Shishir/Codeforces-Solutions` (Apache-2.0)**
   - **Structure:** Solutions indexed by problem identifier.
   - **Attribution:** Original author Shah Shishir.
5. **`VastoLorde95/Competitive-Programming` (MIT)**
   - **Structure:** Subdirectories for `Codeforces/` with contest folders and problem index `.cpp` files. Over 2,000 competitive programming solutions.
   - **Attribution:** Original author VastoLorde95.
6. **`manishbisht/Competitive-Programming` (MIT)**
   - **Structure:** 1,770+ stars, high-volume directory containing structured competitive solutions.
   - **Attribution:** Original author Manish Bisht.
7. **`almuzahidseyam/Codeforces` (Apache-2.0)**
   - **Structure:** Indexed Codeforces solutions.

### Excluded Repositories
The repositories `ShazidMashrafi/Codeforces`, `mhdnazrul/Codeforces-Solutions`, `yousefkotp/Codeforces-Solutions`, `ryuoraiden/competitive-programming`, `ashrafulalamasad/codeforces-solutions`, and `Adi-Dcpp/CP-Archive` have no open-source license file in their repository root or default branches.
- **Decision:** In strict accordance with the Master Prompt instructions ("Never assume that public visibility means permission to redistribute. If licensing is unclear, exclude the code from the public solution catalog"), these repositories are excluded from public solution imports.
- **Traceability:** They remain cataloged in `data/codeforces/repository_inventory.json` with clear `exclusion_reason` notes for audit purposes.

---

## 4. Ingestion Target

Across the 7 eligible repositories (`cbarnson`, `Alif-Riasat`, `DionysiosB`, `Shah-Shishir`, `VastoLorde95`, `manishbisht`, `almuzahidseyam`), there are thousands of candidate C++ files. The ingestion pipeline will clone approved repositories into an isolated working directory (`.importer_cache/`, which is ignored in `.gitignore`), extract metadata, match against official Codeforces problems, deduplicate, validate syntax/compilation, and import verified unique solutions into Supabase.
