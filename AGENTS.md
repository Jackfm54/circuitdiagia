# Independent deployment rules
- Deploy the static React app and authenticated Vercel API separately from the original application to preserve its services.
- Keep OpenAI keys only in server environment variables; verify user tokens against the configured external auth service before invoking OpenAI.
- Store profiles, reports and schematics with user-scoped RLS; storage paths start with the authenticated user ID.
- Keep trained YOLO resources under public/models for independent hosting; preserve exact detection coordinates.
- Preserve the classic Nano voltage-only firmware and require multimeter verification before physical wiring.
- Pure diagnostic and schematic normalization stays in server modules so tests do not need AI access.

- Use extensionless relative imports in Vercel server handlers so the deployment compiler can emit JavaScript without TS5097 errors.
