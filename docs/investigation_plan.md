# Performance Investigation Plan & Implementation

## Objective
Investigate and resolve severe performance issues when the Next.js application is deployed to Vercel with Supabase.

## Findings from Codebase Analysis
1. **Severe N+1 Query Problem in `app/page.tsx`**:
   The homepage fetches the past 14 days of records. Inside the `for (const record of records)` loop, it makes 4 separate database queries for each day:
   - `getDailyTodoRecords(record.id)`
   - `supabase.from('goal_todos')...`
   - `supabase.from('goals')...`
   - `supabase.from('other_todos')...`
   This results in **56+ sequential database queries** just to render the homepage.

2. **Sequential Root-Level Fetches**:
   At the root of the page, multiple independent asynchronous calls (`getSuggestion`, `calculateStreakFromRecords`, `checkYesterdayRecord`, `getRecoveryModeStatus`, `getDailyRecordByDate`) are awaited sequentially instead of in parallel using `Promise.all()`. Furthermore, both `getSuggestion` and `calculateStreakFromRecords` call `getDailyRecords()` again internally, duplicating identical DB queries.

## Proposed Changes
### Components to Refactor
#### [MODIFY] app/page.tsx
- Refactor the loop to fetch all related data in bulk. Instead of fetching todos for each record inside the loop:
  1. Extract all `record.id`s.
  2. Fetch all `daily_todo_records` matching the extracted IDs in one query using `.in('daily_record_id', recordIds)`.
  3. Extract all `todo_id`s and fetch all `goal_todos`, `goals`, and `other_todos` in bulk.
  4. Map the fetched data back to the corresponding daily report cards in memory.
- Use `Promise.all()` to parallelize independent data fetches (`getRecoveryModeStatus`, `checkYesterdayRecord`, etc.).

#### [MODIFY] lib/db.ts
- Refactor `calculateStreakFromRecords` and `getSuggestion` to accept an optional pre-fetched `records` array parameter, avoiding redundant database calls.

## Verification Plan
### Automated Tests
- Run `npx playwright test` autonomously after fixes are implemented to ensure no features were broken by the refactoring. The test suite checks UI and functionality, which will cover the rendering of the homepage.

