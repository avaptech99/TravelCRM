# CRM Fix Porting Questionnaire
### From: CRM 3.0 → To: CRM Final

Answer the questions below as thoroughly as possible. The more detail you provide, the more accurately the fixes can be applied to CRM Final without manual guessing.

---

## SECTION 1 — File Structure

1. **What is the tech stack of both CRM versions?**
   - e.g., React, Vue, plain HTML/CSS/JS, PHP, etc.

2. **Are the two versions in separate folders/repos, or branches of the same repo?**
   - Path to CRM 3.0: `___`
   - Path to CRM Final: `___`

3. **Do both versions share the same file/folder structure, or has CRM Final been reorganized?**
   - If reorganized, list the key structural differences.

4. **Are there any shared components/stylesheets between the two versions, or are they fully independent codebases?**

---

## SECTION 2 — Visual Fixes (UI/Styling)

5. **List every visual change made to CRM 3.0.** For each change, specify:
   - What element was changed (e.g., button, table row, sidebar, modal)
   - What the change was (e.g., color, font size, border, spacing, shadow)
   - Which file and line number (if known)
   - Before value → After value (e.g., `color: #000` → `color: #1a73e8`)

   | # | Element | Change Type | File | Before | After |
   |---|---------|-------------|------|--------|-------|
   | 1 | | | | | |
   | 2 | | | | | |

6. **Were any CSS classes added, renamed, or removed?**
   - List class names and what they do.

7. **Were any global styles or CSS variables (`:root`) modified?**
   - List variable name and new value.

8. **Were any external libraries or fonts added for the visual fixes?**
   - e.g., new icon set, Google Font, animation library

9. **Are there any screenshots or before/after comparisons of the visual changes?**
   - Attach if available.

---

## SECTION 3 — Field Fixes

10. **List every field that was added, removed, renamed, or reordered in CRM 3.0.** For each:

    | # | Field Name | Action (Add/Remove/Rename/Reorder) | Section/Form it belongs to | Old value (if renamed) |
    |---|------------|------------------------------------|---------------------------|------------------------|
    | 1 | | | | |
    | 2 | | | | |

11. **Were any field types changed?** (e.g., text → dropdown, single → multi-select)
    - List field name and old type → new type.

12. **Were any field validations added or modified?**
    - e.g., required, min/max length, regex pattern

13. **Were any field default values changed?**
    - List field name and old default → new default.

14. **Were any fields hidden or shown conditionally based on logic?**
    - Describe the condition and which fields it affects.

15. **Do the field fixes involve database schema changes, or are they purely frontend?**
    - If DB changes: list table name, column name, data type.

---

## SECTION 4 — Logic / Functionality

16. **Were any business logic changes made alongside the visual/field fixes?**
    - e.g., filtering behavior, sorting, calculation formulas

17. **Were any API calls or data-fetching methods modified to support the field changes?**
    - List endpoint and what changed.

18. **Were any event handlers (onClick, onChange, onSubmit) added or changed?**
    - Describe what they do.

---

## SECTION 5 — CRM Final — Known Differences

19. **What do you know is already different in CRM Final compared to CRM 3.0?**
    - e.g., new sections, redesigned layout, additional modules

20. **Are there any fields or components in CRM Final that do NOT exist in CRM 3.0?**
    - This helps avoid accidentally overwriting new work.

21. **Are there any parts of CRM Final that should NOT be touched during this porting process?**
    - List sections/files that are off-limits.

22. **Has CRM Final already had some of these fixes partially applied?**
    - If yes, list which ones and how far they got.

---

## SECTION 6 — Files to Share

Please share the following files/snippets to allow direct comparison:

- [ ] The modified files from CRM 3.0 (or a diff/patch file if available)
- [ ] The corresponding original files from CRM Final
- [ ] Any global stylesheet (e.g., `styles.css`, `variables.css`, `tailwind.config.js`)
- [ ] The form/field config files (if fields are defined in a config rather than hardcoded)
- [ ] Screenshots of CRM 3.0 after fixes (for visual reference)

---

## SECTION 7 — Priority & Constraints

23. **Which fixes are highest priority if not everything can be ported at once?**

24. **Is there a deadline or a specific order the fixes need to be applied in?**

25. **Should the porting be done manually by you, or do you need a script/automated diff to apply changes?**

---

*Fill in as much as you can — even partial answers help. Attach files directly in the chat alongside this filled questionnaire.*
