# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2024-04-10
### Added
- **Thimbly CP1 Integration**: Migrated the Thimbly needlecraft SaaS suite into the Quiltcraft repository.
- **Frontend Engine**: High-performance Canvas-based `GridEngine` with pan/zoom and 60fps rendering.
- **Worker Infrastructure**: Cloudflare Worker (Hono) for auth, credit balance, and export validation.
- **Database Foundation**: Supabase SQL schema with strict RLS and atomic credit handling.
- **E2E Testing**: Playwright test suite for Auth, Credits, and RLS security.
- **State Management**: Zustand-powered grid state with undo/redo support.

### Changed
- Refactored `Thimbly` to operate as a sub-project within `quiltcraft/Thimbly/`.
- Updated environment configuration structure for unified repository management.
