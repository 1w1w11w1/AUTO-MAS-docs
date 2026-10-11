# Advanced Features

Once the basics are working, these features make life easier:

- [Emulator Management](./emulator) - register your emulator once and AUTO-MAS fills in the emulator settings for every script. Set this up first if you use an emulator.
- [Push Notifications](./notification) - sends a message to your email or phone when automation finishes.
- [Failure Replays](./failure-replay) - set up the OBS Replay Buffer and view videos from failed automatic runs in History.
- [Game Check-in](./game-sign) - takes care of the daily check-ins on each game's community site while it is at it.
- [MCP Service](./mcp) - lets an AI operate AUTO-MAS for you.

## Reference

### Common Date/Time Format Symbol Reference

You will need this when configuring [General Scheduling](/en/docs/script-guide/general): rewrite the date and time in your log using the symbols below.

| Symbol | Meaning | Example |
|--------|---------|---------|
| `%Y` | Four-digit year | 2025 |
| `%m` | Two-digit month | 07 |
| `%d` | Two-digit day | 16 |
| `%H` | Hour, 24-hour format | 14 |
| `%M` | Minute | 30 |
| `%S` | Second | 45 |
| `%f` | Milliseconds, 3 digits | 123 |
| `%f` | Microseconds, 6 digits | 123456 |
| `%A` | Full weekday name | Wednesday |
| `%a` | Abbreviated weekday name | Wed |
| `%B` | Full month name | July |
| `%b` | Abbreviated month name | Jul |
