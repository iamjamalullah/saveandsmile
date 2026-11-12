# QADRI GADGETS — PERMANENT CHANGE ISOLATION, REGRESSION PREVENTION & PRODUCTION STABILITY POLICY

You are working on an existing production e-commerce application (Qadri Gadgets: https://saveandsmile.vercel.app).
Your highest priority is to preserve existing functionality, visual consistency, data integrity, and production stability while implementing requested changes.

## 1. STRICT CHANGE ISOLATION
Before modifying any file:
1. Understand the existing architecture and relevant component dependencies.
2. Identify the exact files and functions required for the requested change.
3. Identify shared components, global CSS selectors, database dependencies, and API dependencies.
4. Explain the potential impact on other pages and modules.
5. Avoid modifying unrelated files.
Never perform broad refactoring when a targeted fix is sufficient.

## 2. CSS ISOLATION
- Avoid global CSS selectors for component-specific styling.
- Scope CSS under unique component or page parent classes.
- Do not modify shared typography, buttons, product cards, spacing, or layout rules unless explicitly required.
- Avoid unnecessary !important declarations.
- Never duplicate conflicting CSS definitions.
- Preserve existing responsive breakpoints.
- Use existing design tokens and component variants where possible.

## 3. COMPONENT ISOLATION
- Before changing a shared component, inspect every location where it is used.
- If a change is required only on the homepage, implement a homepage-specific variant or modifier rather than changing every instance.
- Preserve existing props and backward compatibility.

## 4. DATABASE & API SAFETY
- Never reset or recreate production tables for ordinary feature changes.
- Never overwrite valid existing records with null, empty, or default values.
- Use backward-compatible migrations.
- Preserve existing data and relationships.
- Validate API request and response schemas.
- Keep draft and published data separate.
- Back up affected data before risky changes.

## 5. BASELINE & REGRESSION TESTING
Before implementation, capture the current state of:
- Homepage
- Product listing pages
- Product detail pages
- Cart
- Checkout
- Customer account
- Admin dashboard
- Homepage Editor
- Mobile and tablet layouts

After implementation, compare affected and unrelated pages against the baseline.
A change must not be considered successful if it breaks an unrelated page, even if the target feature works.

## 6. MANDATORY TESTING
Run:
- Relevant unit tests.
- Integration tests (`npm run test:all`).
- Production build (`npm run build`).
- API verification.
- Database integrity checks.
- Browser-based desktop testing.
- Mobile and tablet testing.
- Regression tests on at least two unrelated pages.
For shared components, test every important usage context.

## 7. PRODUCTION DEPLOYMENT CONTROL
Never assume a successful local build means production is correct.
Before deployment:
- Confirm the intended branch and commit.
- Confirm database compatibility.
- Confirm environment variables and API configuration.
- Verify the build.
After deployment:
- Verify the actual production URL.
- Verify the deployed commit.
- Verify the public API.
- Verify the affected feature.
- Verify unrelated critical pages.
- Check browser console and network errors.
- Confirm database data remains intact.
Do not claim production verification unless actual production checks were performed.

## 8. CHANGE REPORT
For every task, provide:
1. Exact files modified.
2. Why each file needed modification.
3. Components and modules affected.
4. Components and modules deliberately left untouched.
5. Tests executed and actual results.
6. Before/after screenshots where applicable.
7. Production deployment status.
8. Any remaining risks.

## 9. STOP CONDITIONS
Stop and request approval before proceeding if:
- A requested change requires a major architecture redesign.
- Existing production data may be overwritten.
- A shared component must be changed in a way that affects unrelated pages.
- A destructive database migration is proposed.
- The requested change conflicts with existing functionality.
- The exact source of a production issue is not established.

## 10. PRODUCTION AUTHORIZATION, ROLLBACK & VERIFICATION SAFEGUARDS

### A. Explicit Deployment Authorization
- Never push to `origin main` or trigger production deployment without explicit user approval.
- Complete local implementation, testing and review before requesting deployment approval.
- Never assume that a successful build authorizes production deployment.

### B. Mandatory Rollback Readiness
- Record the last known stable Git commit before significant changes.
- Preserve affected database records before modifications.
- Document the exact rollback procedure.
- Verify that the previous stable application version can be restored.
- Never perform destructive rollback operations on production data without explicit authorization.

### C. Test Integrity
- Verify that each required test file exists before execution.
- Report actual test results, including skipped, unavailable or failed tests.
- Never claim 100% test coverage based only on passing test suites.
- Never fabricate screenshots, deployment status, API responses or production verification.

### D. Production and Local Environment Separation
- Clearly distinguish local, staging and production environments.
- Never assume local database records match production.
- Never use local environment variables or database credentials in production.
- Verify the deployed commit and production API independently.

### E. Mandatory Approval Before High-Risk Actions
Obtain explicit user approval before:
- Production deployment.
- Destructive database operations.
- Database schema changes with potential data loss.
- Changes to shared components affecting multiple routes.
- Replacing or removing existing production content.
- Major architectural refactoring.

## FINAL RULE & PRINCIPLE
Implement the smallest safe change that completely solves the requested problem.
Do not improve, redesign, optimize, refactor, or modify unrelated features without explicit approval.
Existing working functionality is protected and must remain working after every change.
Protect the last known stable production state. A new feature is not successful if it compromises existing functionality, data integrity, or unrelated user experiences.
