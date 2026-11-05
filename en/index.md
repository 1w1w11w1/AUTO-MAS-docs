---
layout: home

hero:
  name: "AUTO-MAS"
  text: "Multi-account game script management and automation"
  tagline: "Run all your accounts without babysitting them"
  image:
    src: /icons/AUTO-MAS.ico
    alt: "AUTO-MAS Logo"
  actions:
    - theme: brand
      text: Get Started
      link: /en/docs/user-guide
    - theme: alt
      text: Managed Script Configuration
      link: /en/docs/script-guide/
    - theme: alt
      text: Task Scheduler
      link: /en/docs/task-scheduler
    - theme: alt
      text: Advanced Features
      link: /en/docs/advanced-features/
    - theme: alt
      text: FAQ
      link: /en/docs/FAQ

features:
  - title: One window for every account
    details: Configs for all your managed scripts and their accounts live in one place. No more juggling a dozen windows.
  - title: It handles the hangs for you
    details: It watches script logs the whole time and retries when a script errors out or freezes. Runs fine while you are away from the computer.
  - title: You decide when it runs
    details: Put managed scripts in a scheduling queue, then run them on app startup or at set times.
  - title: You can tell what went wrong
    details: Every run keeps its result and the key log lines, so you can see which account failed at which step.
---

## Why AUTO-MAS?

If you run several accounts, you know how this goes: editing script configs one by one, a script hanging halfway with nobody watching, and finding out the next day that one account got skipped without knowing why.

**AUTO-MAS** takes that work off your hands. It does not replace MAA, M9A, or any other script. It drives them: swaps configs for you, launches them in order, watches their logs to tell a finished run from a hang, retries what failed, and records the results.

- **Reliable**: it watches logs and handles errors as they happen, so tasks actually finish instead of only looking finished.
- **Less work**: no hand-editing config files. A few clicks in the interface covers it.
- **Works with almost anything**: any automation script fits, as long as it starts running on launch and writes logs.

## Special Notice

Free code signing provided by [SignPath.io](https://signpath.io/), certificate by [SignPath Foundation](https://signpath.org/).

Developer AI API credits are sponsored by <a href="https://www.packyapi.ai/register?aff=zKkA"><img src="https://camo.githubusercontent.com/c6e2cac1447e67d9f6c882b2faf234aed2e4d8a14fdc5bc1071d335cb6b5a32c/68747470733a2f2f7777772e7061636b796170692e61692f6c6f676f2d66756c6c2e737667" alt="PackyCode" style="display:inline-block;width:120px;height:auto;vertical-align:middle;"></a>. PackyCode is a stable, high-performance API relay provider offering relay services for Claude Code, Codex, Gemini, and more, with automatic failover, smart routing, and unlimited concurrency. [Register for free on PackyCode](https://www.packyapi.ai/register?aff=zKkA).
