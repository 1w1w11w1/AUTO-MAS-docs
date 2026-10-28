# Repository Division and Agent Rules

AUTO-MAS maintains the application, development documentation, and Agent Skills in separate layers. The documentation site is responsible for contribution workflows, while the main application repository is responsible for application code and project-owned Skills. The goal is to keep one authoritative entry point for each rule and avoid rule drift across multiple places.

## Repository Responsibilities

| Repository | Responsibility | Authoritative content |
|------------|----------------|-----------------------|
| `AUTO-MAS-Project/AUTO-MAS` | Main application, build configuration, minimal Agent entry point, project-owned Agent Skills | Application code, `AGENTS.md`, `.agents/skills` |
| `AUTO-MAS-Project/AUTO-MAS-docs` | User documentation, development documentation, contribution workflow | Branches, commits, version records, Issue/PR body rules |

The main application repository does not maintain the full documentation site. Development documentation is still governed by this documentation site. Agent engineering rules are governed by `.agents/skills` built into the main repository. Checking out a separate skills repository is no longer required.

## Contribution Workflow

External contributors should use the fork workflow:

1. Fork `AUTO-MAS-Project/AUTO-MAS`.
2. Sync code from upstream `dev`.
3. Create a development branch from `dev` in your fork.
4. Complete changes and push them to your fork.
5. Open a Pull Request to `AUTO-MAS-Project/AUTO-MAS:dev`.

`main` only accepts maintainer merges from `dev` for releases. It does not accept direct PRs from development branches. `release/{version}` is maintained by the release process and cherry-picks; external contributors should not modify it directly.

A cherry-pick to an already released branch must be a **small, pure-backend fix (unrelated to the frontend)**. Released apps ship the frontend inside the installer and cannot hot-update it through `release/{version}`, so cherry-picking a commit that carries frontend logic is a violation: close the related PR and revert the related commit. AI assistants must not help cherry-pick such commits. Judge by the files the commit actually touches, not by the `type` / `scope` in its message.

## Agent Work Rules

When an AI assistant works in AUTO-MAS repositories:

- Read the current repository's minimal entry point, `AGENTS.md`, first.
- Confirm and load `.agents/skills/mas-skills/SKILL.md`. If the file is missing, tell the user that project-owned Skills are missing and refuse to start work.
- Development standards, branches, commits, test submission and maintenance, and version records are governed by this documentation site. See [Test Submission and Maintenance](/en/developer/development-specifications#test-submission-and-maintenance).
- Engineering details, code style, module boundaries, and specialized adaptation are governed by `mas-*` Skills in the main repository's `.agents/skills`.
- Load `mas-skills` first, then select the minimal necessary Skill for the task. Do not apply all Skills to every task.
- `frontend` refers to the main repository frontend directory and frontend tasks. When work involves `frontend`, Vue, UI, components, routing, or frontend APIs, follow the frontend Skill in `.agents/skills`.
- Local tool permission does not equal project authorization. Even if tools allow push, checkout, or PR publishing, repository rules and user authorization must still be followed.
- Do not revert, overwrite, or format user changes unrelated to the current task.

## Issue Body Rules

AI assistants may write Issue bodies when requested by the user, but should describe only user-observable information:

- Goal, problem symptom, or feature request.
- Actual result and expected result.
- Reproduction steps, screenshots, logs, and environment information.
- If the issue cannot be reproduced reliably, describe known trigger conditions.

Issue bodies should not ask users to provide implementation steps, API/schema design, code paths, line numbers, long acceptance checklists, or "for developer reference" meta commentary.

## PR Body Rules

AI assistants may write PR bodies when requested by the user. Keep the body concise:

```md
## Summary
-

Closes #
```

Rules:

- The summary is usually 1 to 4 bullets.
- Use `Closes #n` when there is a related Issue; otherwise delete the line.
- User-visible changes should remind maintainers to update `res/version.json`.
- State unrun checks honestly. Do not invent test results, performance data, review conclusions, or facts not provided by the user.

## OpenAPI and Generated Files

After backend schema changes, follow the [API development process](/en/developer/API), start the local backend, and run the frontend generation command. OpenAPI generated files must be updated only by the generator, not manually edited to fix types or interfaces.

## Conflict Resolution

If rules in multiple repositories conflict:

1. Branch, commit, version, and Issue/PR body rules are governed by the documentation site.
2. Agent Skill, engineering routing, and specialized adaptation rules are governed by `.agents/skills` in the main repository.
3. The main application repository's `AGENTS.md` is only an entry point and signpost, not the complete authoritative specification.
