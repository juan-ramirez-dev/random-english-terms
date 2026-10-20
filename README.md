# Lexio

**Turn your readings and meeting transcripts into English vocabulary practice.**

A local-first desktop app for macOS and Windows.
Paste a text, and Lexio surfaces random terms from it. For each one you say
_I know this_ or _I want to learn it_ — with the arrow keys or on-screen buttons.
Your data lives in one file on your computer. No account, no server, no cloud.

## Features

- **Your own texts.** Paste a reading or a meeting transcript, or import a `.txt`.
- **Random review.** Lexio pulls words from the text and shows them one at a time.
- **Keyboard-first.** `←` _know_, `→` _learn_, `↑` / `Space` _skip_. On-screen buttons too.
- **Word lists.** See everything you're learning and everything you already know.
- **English or Spanish UI.** Picked from your system, changeable in Settings.

Later: an AI pass (same pattern as [lucka](https://github.com/juan-ramirez-dev/lucka))
that reads each text in context and surfaces phrasal verbs, idioms and expressions —
not just single words.

## Tech stack

| Layer   | Tech                                                            |
| ------- | --------------------------------------------------------------- |
| UI      | Next.js 16 (static export), React 19, TypeScript, CSS Modules   |
| Desktop | Tauri v2, Rust                                                  |
| Data    | SQLite via `tauri-plugin-sql`, SQL migrations                   |
| Quality | ESLint (with custom rules), Prettier, Jest, Husky, Clippy       |
| CI/CD   | GitHub Actions: checks, real cross-platform builds, auto-update |

## Development

Requirements:

- Node 20 and pnpm.
- Rust stable.
- macOS: Xcode Command Line Tools (`xcode-select --install`).
- Windows: Microsoft C++ Build Tools + WebView2.

```bash
pnpm install
pnpm desktop   # opens the app with live reload
```

| Script               | Does                                                    |
| -------------------- | ------------------------------------------------------- |
| `pnpm desktop`       | App in dev mode                                         |
| `pnpm desktop:build` | Local installer in `src-tauri/target/release/bundle/`   |
| `pnpm test`          | Unit tests                                              |
| `pnpm check`         | Lint + Prettier + types + tests + build + `cargo check` |

## Docs

- [`AGENTS.md`](AGENTS.md) → project rules for humans and AI agents.
- [`contributing.md`](contributing.md) → how to open a PR.

## License

MIT
