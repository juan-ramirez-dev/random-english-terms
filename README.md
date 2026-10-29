# Lexio

**Learn the English you already read, one phrase at a time.**

A desktop app for macOS and Windows.
Paste a reading or a meeting transcript. Lexio finds the phrasal verbs, idioms and expressions in it and turns the ones you pick into lessons and exercises.
Local-first: your data lives in one file on your computer. No account, no server, no cloud.

[![How it works: paste a text, Lexio finds the phrases, you swipe, you practice](docs/media/demo-en.gif)](docs/media/demo-en.mp4)

_How it works in four steps. [Full-quality MP4](docs/media/demo-en.mp4) (1080p, 22 s) · [En español](docs/media/demo-es.mp4)._

## Download

[juan-ramirez-dev.github.io/lexio-landing](https://juan-ramirez-dev.github.io/lexio-landing/)

- Builds are not signed by Apple or Microsoft, so the OS warns on first launch. The landing page explains how to open it.
- The app updates itself.

## Features

- **Your own texts.** Paste a reading or a transcript, or import a `.txt`.
- **Phrases, not single words.** Phrasal verbs, idioms, collocations and expressions, each with its own color.
- **Swipe to pick.** `←` _I know it_, `→` _learn it_, `↑` / `Space` _skip_. On-screen buttons too.
- **A lesson first.** Meaning, when to use it, Spanish translation, examples and a short dialog.
- **Six kinds of exercises.** Meaning, fill the gap, which one fits, which one uses it right, match the pairs, word order.
- **Progress and streak.** Every phrase goes from _new_ to _learning_ to _mastered_.
- **Your AI, your choice.**
  - On your machine (Qwen via llama.cpp), 100% offline.
  - Your own OpenAI / Anthropic / Gemini key.
  - Or no key at all: copy the prompt into Claude and paste the answer back.
- **English or Spanish UI.** Picked from your system, changeable in Settings.

## Tech stack

| Layer    | Tech                                                                    |
| -------- | ----------------------------------------------------------------------- |
| UI       | Next.js 16 (static export), React 19, TypeScript (strict), CSS Modules  |
| Desktop  | Tauri v2, Rust                                                          |
| Data     | SQLite via `tauri-plugin-sql`, SQL migrations                           |
| AI       | llama.cpp (Metal on macOS), OpenAI / Anthropic / Gemini APIs            |
| Security | OS keychain for API keys, strict CSP, least-privilege Tauri permissions |
| Quality  | ESLint (with custom rules), Prettier, Jest, Husky, Clippy               |
| CI/CD    | GitHub Actions: checks, real cross-platform builds, signed auto-updates |
| Dev      | Claude Code with project rules (`AGENTS.md`)                            |

## Engineering highlights

- **Works without AI.** A built-in list of ~1,800 phrases is matched against the text in pure, tested TypeScript, conjugations and irregular verbs included.
- **Untrusted AI output.** Every lesson and exercise is validated in `src/lib/exercises/parse.ts` before it reaches the database or the screen. It also accepts Claude answers pasted with code fences or curly quotes.
- **One prompt, four backends.** The same request goes to a local LLM or to OpenAI / Anthropic / Gemini, all from Rust.
- **The webview has no network.** The CSP only allows Tauri's IPC. Online AI calls go through Rust, with the key read from the OS keychain.
- **Verified model downloads.** Multi-GB models stream to disk with pinned SHA-256 hashes. A model another app already downloaded can be reused.
- **Exercises built locally.** Match and word-order exercises come from the lesson's own data, so they always have a valid answer.
- **Guardrails in three layers.** Custom ESLint rules (no literal colors, kebab-case files), git hooks and CI enforce the same conventions for humans and agents.
- **Release automation.** Merge with a new version → CI → parallel macOS/Windows builds → publish → installed apps auto-update.

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
