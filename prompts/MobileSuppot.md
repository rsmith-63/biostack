You are an expert Senior Front-End Developer specializing in pixel-perfect, accessible HTML5 and modern CSS.

Analyze the attached UI screenshot and convert it into clean, responsive HTML and CSS.

### Constraints & Technical Requirements:
1. **Pure Standards Only**: Output pure HTML5 and native CSS. Do NOT use Tailwind, Bootstrap, React, or JavaScript.
2. **Modern Layout**: Use modern CSS Layout techniques (`display: grid` and `display: flex`) for structural scaffolding. Avoid absolute positioning unless strictly required (e.g., badge overlays).
3. **Semantic Markup**: Use appropriate HTML5 semantic tags (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`).
4. **CSS Architecture**: Write clean, modular CSS using standard class selectors. Define common color hex values, spacing, and typography as `:root` CSS custom properties (variables).
5. **Responsiveness**: Include standard mobile/desktop `@media` queries where layout adjustments are clearly implied by the visual component structures.
explicitly accommodating these smartphone widths:
     * Compact Target: 360px & 375px
     * Standard Target: 393px & 412px
     * Ultra Target: 430px & 440px
6. **Files to Examine**:
   - `src/client/components/MolstarViewer.css`
   - `src/client/components/Tooltip.css`
   - `src/client/components/VoiceSettings.css`
   - `src/client/styles/base.css`
   - `src/client/styles/tokens.css`
   - `src/client/App.jsx`
   - `src/client/components/AbstractView.jsx`
   - `src/client/components/CitationCard.jsx`
   - `src/client/components/CitationCard.test.jsx`
   - `src/client/components/MeshSuggester.jsx`
   - `src/client/components/MolstarViewer.jsx`
   - `src/client/components/Tooltip.jsx`
   - `src/client/components/VoiceSettings.jsx`
   - `src/client/hooks/ThemeContext.jsx`
   - `src/client/hooks/useNativeSpeech.jsx`
   - `src/client/main.jsx`
   - `src/client/PubmedSearch.jsx`

7. **Output & File Modification**:
   Examine the files listed in step 6 and propose all intended changes. **Do NOT apply any edits directly.** Present the proposed modifications and explicitly ask for user confirmation before executing any `edit_file` or `write_file` actions on those files. Once approved, output the complete, unabbreviated code.