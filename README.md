# kimi-chat-cli

A personal terminal-based chat client for Kimi AI, built with React and Ink.

## Overview

A personal project I built for my own use — because I don't want to frequently open a browser or switch tabs for trivial questions, as my slow computer handles that poorly. It provides a terminal UI with streaming responses, chat history management, and some customization options.

## Features

- **Real-time Streaming**: Messages stream in real-time with a typing effect
- **Chat History**: View, search, and manage your previous conversations
- **Model select**:
  - `Ctrl+p` - Open selector
  - `↑/↓` or `j/k` - Navigate in the list
  - `Enter` - Select model
- **Toggle Modes**:
  - Web Search: `Ctrl+w`
  - Long Thinking: `Ctrl+l`
- **Commands**: `/history`, `/new`, `/clear`, `/exit`, `/help`...(some not yet implemented)
- **Keyboard Navigation**:
  - `Enter` - Send message / Load selected chat from history
  - `Esc` - Cancel / Return to chat
  - `Space` - Expand chat preview in history
  - `M` - Load more history items
  - `D` - Delete chat from history
  - `↑/↓` or `j/k` - Navigate in history list
  - `Ctrl+C` - Exit application

## Installation

### Install from npm

```bash
# Install globally
npm i -g @lyqluis/kimi-chat-cli

# Run the CLI
kimi-chat
```

### Build from Source

```bash
# Clone the repository
git clone https://github.com/lyqluis/kimi-chat-cli.git
cd kimi-chat-cli

# Install dependencies
pnpm install

# Build the project
pnpm build

# Run the CLI
node dist/cli.js

# Or link for CLI
pnpm link
```

## Configuration

Before using, you need to configure your web Kimi AI token.

1. Get your token from browser:

   - Open [kimi.ai](https://kimi.ai) in your browser
   - Open DevTools (F12) → Application/Storage → Cookies
   - Copy the value of `kimi-auth` or similar auth token

2. Create config file:

```bash
mkdir -p ~/.kimi-chat-cli
echo 'APP_TOKEN="YOUR_TOKEN_HERE"' > ~/.kimi-chat-cli/chatclirc
```

## Usage

```bash
# Run the CLI
kimi-chat

# Check Version
kimi-chat --version
```

## Development

```bash
# Watch mode with auto-restart
pnpm dev

# Watch with nodemon
pnpm dev-nodemon

# Run tests
pnpm test
```

## Tech Stack

- [React](https://react.dev/) - UI library
- [Ink](https://github.com/vadimdemedes/ink) - React for terminals
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vitest](https://vitest.dev/) - Testing framework

## License

MIT
