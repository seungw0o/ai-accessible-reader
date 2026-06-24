# Accessible Term Explanation Plan

## Requirements Summary

Improve the term explanation feature so it satisfies the requirement: difficult terms in the article can be explained in simple language, while remaining usable for blind and keyboard-only users. The current UI captures browser text selection via `onMouseUp`/`onKeyUp` in `ReaderPage.tsx:86` and then requires a button in the term panel at `ReaderPage.tsx:336`. The backend explanation endpoint already exists at `server/index.ts:489`.

## Recommended Interaction Model

Do not rely on mouse clicking or dragging as the primary interaction. Use a three-path model:

1. **Recommended terms list**: Generate a short list of likely difficult terms from the current article and show them as real buttons. Each button is keyboard focusable and screen-reader labeled.
2. **Manual term input**: Let users type or paste a word/phrase into the term panel and press Enter or the explain button.
3. **Selection shortcut fallback**: Keep selected-text support, but add a clear keyboard shortcut such as `Option/Alt + Shift + E` to explain the current selected term.

This model works for sighted mouse users, blind screen-reader users, and keyboard-only users.

## Acceptance Criteria

- A user can request a term explanation without using a mouse.
- The term panel contains a labeled input with Enter-to-explain behavior.
- Suggested terms are rendered as `<button>`/Mantine `Button`, not plain clickable text.
- When an explanation starts, completes, or fails, the existing `aria-live` announcement system reports it.
- The current backend `/api/explain` contract remains compatible.
- Existing mouse text selection still works as an optional shortcut.
- `npm run build` passes.

## Implementation Steps

1. Add term input state in `App.tsx` near the current term states at `App.tsx:268`.
2. Add a helper to extract 6-10 candidate terms from `articleData.textContent`. Prefer long Korean/English noun-like tokens, dedupe, and exclude common boilerplate words.
3. Extend `ReaderPage` and `TermPanel` props to accept `termInput`, `setTermInput`, `suggestedTerms`, and `onExplainWord(word)`.
4. Update `TermPanel` in `ReaderPage.tsx:303`:
   - Add a labeled text input.
   - Add suggested term buttons.
   - Keep selected word display.
   - Make explanation results focus/announce friendly.
5. Add shortcut `Option/Alt + Shift + E` in the global listener around `App.tsx:325`.
6. Update `src/i18n.ts` with Korean/English labels for manual input, suggested terms, shortcut copy, and empty states.
7. Build and manually verify keyboard flow: Tab to term input, type word, press Enter, hear/read explanation.

## Risks and Mitigations

- **Bad suggested terms**: Keep suggestions optional and editable through manual input.
- **Screen-reader overload**: Limit suggestions to 6-10 terms and avoid auto-reading all suggestions.
- **AI cost**: Only call `/api/explain` after explicit user action.
- **Selection API inconsistency**: Treat text selection as convenience only, not the primary path.

## Verification Steps

- Run `npm run build`.
- Analyze a real news URL, go to Reader, Tab to the term panel, type a term, press Enter.
- Use suggested term buttons with keyboard only.
- Test `Option/Alt + Shift + E` after selecting text.
- Confirm Korean and English UI labels render correctly.
