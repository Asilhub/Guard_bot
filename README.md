# GuardianBot V1

Professional Telegram Group Management Bot

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Bot Framework**: [Grammy](https://grammy.dev/)
- **Database**: PostgreSQL + [Prisma ORM](https://www.prisma.io/)
- **Cache / Rate Limiting**: Redis (ioredis)
- **Logging**: Winston
- **Containerization**: Docker + Docker Compose

## Features

| Module | Description |
|--------|-------------|
| 🧹 Cleaner | Auto-delete service messages (join, leave, photo change, pinned, title) |
| 🔑 Keyword Blocker | Pattern/regex keyword filtering with configurable actions |
| 🛡 Antispam | Flood, repeat, emoji spam, mention spam, link spam, forward spam detection |
| 🚫 Protection | Auto-detect and block porn/scam/fake-crypto accounts |
| ⚠️ Warn System | Warn users with auto-punishment on limit reached |
| 📋 Auto Moderation | Invite link filter, new user restriction |
| 📊 Logging | Full audit log with optional dedicated log group |
| 👥 Role System | Owner → Admin → Moderator → Member hierarchy |
| 🔌 Plugin System | Welcome message, Group rules, Math captcha |
| 🛡 Anti-Raid | Auto-detect and block raid attacks |

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/Asilhub/Guard_bot.git
cd Guard_bot
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:
- `BOT_TOKEN` — from [@BotFather](https://t.me/BotFather)
- `OWNER_ID` — your Telegram user ID
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string

### 3. Database Setup

```bash
npm run db:generate
npm run db:migrate:dev
```

### 4. Run

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## Docker

```bash
cp .env.example .env
# Edit .env

docker-compose up -d
```

## Commands

### Settings
| Command | Description |
|---------|-------------|
| `/settings` | Main settings panel (inline buttons) |
| `/cleaner_on` / `/cleaner_off` | Toggle cleaner |
| `/antispam_on` / `/antispam_off` | Toggle antispam |
| `/protection_on` / `/protection_off` | Toggle porn/scam protection |
| `/silent_on` / `/silent_off` | Toggle silent mode |

### Keyword Blocker
| Command | Description |
|---------|-------------|
| `/addkeyword <word> [--regex] [--action mute\|ban\|kick\|delete]` | Add keyword |
| `/removekeyword <word>` | Remove keyword |
| `/keywords` | List all keywords |

### Moderation
| Command | Description |
|---------|-------------|
| `/warn [reason]` | Warn user (reply) |
| `/unwarn` | Remove latest warning (reply) |
| `/warns` | Show warnings (reply) |
| `/ban [reason]` | Ban user (reply) |
| `/unban` | Unban user (reply) |
| `/kick` | Kick user (reply) |
| `/mute [duration]` | Mute user (e.g. `/mute 30m`) |
| `/unmute` | Unmute user (reply) |

### Roles
| Command | Description |
|---------|-------------|
| `/promote` | Set user as Moderator (reply) |
| `/demote` | Set user as Member (reply) |
| `/blacklist` | Blacklist user (reply) |
| `/whitelist` | Whitelist user (reply) |

### Logging
| Command | Description |
|---------|-------------|
| `/setlogchat` | Set current chat as log channel |
| `/logs` | Show last 10 log entries |

### Plugins
| Command | Description |
|---------|-------------|
| `/setwelcome <text>` | Set welcome message |
| `/welcome_off` | Disable welcome |
| `/setrules <text>` | Set group rules |
| `/rules` | Show rules |

## Architecture

```
src/
├── configs/        # Environment config (Zod validated)
├── database/       # Prisma client + Redis
├── middleware/     # Auth, rate limit, group context, logging
├── modules/        # Feature modules
│   ├── cleaner/
│   ├── keyword-blocker/
│   ├── antispam/
│   ├── protection/
│   ├── admin/
│   ├── warns/
│   ├── moderation/
│   └── logging/
├── plugins/        # Plugin system (welcome, rules, captcha)
├── services/       # Business logic layer
├── types/          # TypeScript types
├── utils/          # Helpers, logger, permissions, keyboards
├── bot.ts          # Bot assembly
└── index.ts        # Entry point
```

## Security

- All database queries use Prisma (parameterized, no SQL injection)
- Rate limiting on all incoming messages
- Permission validation on all admin commands
- Whitelist/blacklist system
- Environment variables validated with Zod on startup
