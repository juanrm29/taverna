-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CampaignRole" AS ENUM ('DM', 'PLAYER', 'SPECTATOR');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'DICE', 'WHISPER', 'SYSTEM', 'NARRATION', 'EMOTE', 'OOC', 'COMBAT');

-- CreateEnum
CREATE TYPE "ChatChannel" AS ENUM ('GENERAL', 'COMBAT', 'LORE', 'OFF_TOPIC', 'WHISPERS');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('LOBBY', 'LIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "JournalType" AS ENUM ('JOURNAL', 'HANDOUT', 'SECRET');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "displayName" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "setting" TEXT NOT NULL DEFAULT '',
    "ruleSet" TEXT NOT NULL DEFAULT 'D&D 5e',
    "status" "CampaignStatus" NOT NULL DEFAULT 'ACTIVE',
    "imageUrl" TEXT,
    "inviteCode" TEXT NOT NULL,
    "maxPlayers" INTEGER NOT NULL DEFAULT 6,
    "sessionCount" INTEGER NOT NULL DEFAULT 0,
    "dmId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastPlayedAt" TIMESTAMP(3),

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "role" "CampaignRole" NOT NULL DEFAULT 'PLAYER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "race" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "alignment" TEXT NOT NULL DEFAULT 'True Neutral',
    "background" TEXT NOT NULL DEFAULT '',
    "abilityScores" JSONB NOT NULL,
    "hp" JSONB NOT NULL,
    "armorClass" INTEGER NOT NULL DEFAULT 10,
    "initiative" INTEGER NOT NULL DEFAULT 0,
    "speed" INTEGER NOT NULL DEFAULT 30,
    "proficiencyBonus" INTEGER NOT NULL DEFAULT 2,
    "savingThrows" JSONB NOT NULL DEFAULT '{}',
    "skills" JSONB NOT NULL DEFAULT '[]',
    "spellSlots" JSONB NOT NULL DEFAULT '[]',
    "inventory" JSONB NOT NULL DEFAULT '[]',
    "deathSaves" JSONB NOT NULL DEFAULT '{"successes":0,"failures":0}',
    "traits" TEXT NOT NULL DEFAULT '',
    "ideals" TEXT NOT NULL DEFAULT '',
    "bonds" TEXT NOT NULL DEFAULT '',
    "flaws" TEXT NOT NULL DEFAULT '',
    "backstory" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "avatarUrl" TEXT,
    "currency" JSONB,
    "knownSpells" JSONB,
    "classLevels" JSONB,
    "feats" JSONB,
    "hitDiceRemaining" INTEGER,
    "inspirationPoints" INTEGER DEFAULT 0,
    "experiencePoints" INTEGER DEFAULT 0,
    "concentratingOn" TEXT,
    "temporaryEffects" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "npcs" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "race" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "personality" TEXT NOT NULL DEFAULT '',
    "motivation" TEXT NOT NULL DEFAULT '',
    "stats" JSONB,
    "hp" INTEGER,
    "armorClass" INTEGER,
    "isAlive" BOOLEAN NOT NULL DEFAULT true,
    "location" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,

    CONSTRAINT "npcs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "type" "MessageType" NOT NULL,
    "content" TEXT NOT NULL,
    "channel" "ChatChannel" NOT NULL DEFAULT 'GENERAL',
    "diceResult" JSONB,
    "combatResult" JSONB,
    "whisperTo" TEXT,
    "whisperToName" TEXT,
    "characterName" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "reactions" JSONB,
    "replyToId" TEXT,
    "replyToPreview" TEXT,
    "replyToSender" TEXT,
    "mentions" JSONB,
    "mentionEveryone" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_sessions" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'LOBBY',
    "dmId" TEXT NOT NULL,
    "connectedPlayers" JSONB NOT NULL DEFAULT '[]',
    "currentRound" INTEGER NOT NULL DEFAULT 0,
    "activeSceneId" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "initiative_entries" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "initiative" INTEGER NOT NULL,
    "isNPC" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "hp" JSONB,
    "armorClass" INTEGER,
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "concentratingOn" TEXT,
    "tokenId" TEXT,
    "characterId" TEXT,

    CONSTRAINT "initiative_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combat_log_entries" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "turn" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "combat_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "map_scenes" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gridType" TEXT NOT NULL DEFAULT 'square',
    "gridSize" INTEGER NOT NULL DEFAULT 40,
    "width" INTEGER NOT NULL DEFAULT 30,
    "height" INTEGER NOT NULL DEFAULT 20,
    "backgroundImage" TEXT,
    "backgroundColor" TEXT NOT NULL DEFAULT '#1a1a2e',
    "fogRevealed" JSONB NOT NULL DEFAULT '[]',
    "ambientTrackId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "map_scenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "map_tokens" (
    "id" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "x" INTEGER NOT NULL DEFAULT 0,
    "y" INTEGER NOT NULL DEFAULT 0,
    "size" INTEGER NOT NULL DEFAULT 1,
    "color" TEXT NOT NULL DEFAULT '#c9a96e',
    "label" TEXT NOT NULL DEFAULT '',
    "isPC" BOOLEAN NOT NULL DEFAULT false,
    "characterId" TEXT,
    "initiativeEntryId" TEXT,
    "hp" JSONB,
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "vision" INTEGER NOT NULL DEFAULT 6,
    "darkvision" INTEGER NOT NULL DEFAULT 0,
    "lightRadius" INTEGER NOT NULL DEFAULT 0,
    "dimLightRadius" INTEGER NOT NULL DEFAULT 0,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,

    CONSTRAINT "map_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "walls" (
    "id" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "x1" DOUBLE PRECISION NOT NULL,
    "y1" DOUBLE PRECISION NOT NULL,
    "x2" DOUBLE PRECISION NOT NULL,
    "y2" DOUBLE PRECISION NOT NULL,
    "blocksMovement" BOOLEAN NOT NULL DEFAULT true,
    "blocksVision" BOOLEAN NOT NULL DEFAULT true,
    "isDoor" BOOLEAN NOT NULL DEFAULT false,
    "isOpen" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "walls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "light_sources" (
    "id" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "brightRadius" INTEGER NOT NULL DEFAULT 4,
    "dimRadius" INTEGER NOT NULL DEFAULT 8,
    "color" TEXT NOT NULL DEFAULT '#ffcc44',
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "light_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "map_drawings" (
    "id" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "points" JSONB NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#ffffff',
    "fillColor" TEXT,
    "lineWidth" INTEGER NOT NULL DEFAULT 2,
    "text" TEXT,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "radius" DOUBLE PRECISION,
    "angle" DOUBLE PRECISION,
    "length" DOUBLE PRECISION,
    "visible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "map_drawings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "type" "JournalType" NOT NULL DEFAULT 'JOURNAL',
    "imageUrl" TEXT,
    "visibleTo" JSONB NOT NULL DEFAULT '[]',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dice_macros" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "label" TEXT,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "dice_macros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rollable_tables" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entries" JSONB NOT NULL,
    "diceFormula" TEXT NOT NULL DEFAULT '1d100',
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "rollable_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audio_tracks" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ambient',
    "volume" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "loop" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT NOT NULL DEFAULT 'general',

    CONSTRAINT "audio_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "inGameDate" TEXT,
    "realDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionNumber" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT NOT NULL DEFAULT 'story',
    "icon" TEXT,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '⭐',
    "type" TEXT NOT NULL DEFAULT 'milestone',
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" TEXT,
    "playerId" TEXT,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_relationships" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "fromCharacterId" TEXT NOT NULL,
    "fromCharacterName" TEXT NOT NULL,
    "toCharacterId" TEXT NOT NULL,
    "toCharacterName" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'neutral',
    "description" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "character_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encounter_templates" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monsters" JSONB NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "xpTotal" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "encounter_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_notes" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "dmPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_inviteCode_key" ON "campaigns"("inviteCode");

-- CreateIndex
CREATE INDEX "campaigns_dmId_idx" ON "campaigns"("dmId");

-- CreateIndex
CREATE INDEX "campaigns_inviteCode_idx" ON "campaigns"("inviteCode");

-- CreateIndex
CREATE INDEX "campaign_members_campaignId_idx" ON "campaign_members"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_members_userId_campaignId_key" ON "campaign_members"("userId", "campaignId");

-- CreateIndex
CREATE INDEX "characters_campaignId_idx" ON "characters"("campaignId");

-- CreateIndex
CREATE INDEX "characters_playerId_idx" ON "characters"("playerId");

-- CreateIndex
CREATE INDEX "npcs_campaignId_idx" ON "npcs"("campaignId");

-- CreateIndex
CREATE INDEX "chat_messages_campaignId_channel_idx" ON "chat_messages"("campaignId", "channel");

-- CreateIndex
CREATE INDEX "chat_messages_campaignId_createdAt_idx" ON "chat_messages"("campaignId", "createdAt");

-- CreateIndex
CREATE INDEX "chat_messages_senderId_idx" ON "chat_messages"("senderId");

-- CreateIndex
CREATE INDEX "game_sessions_campaignId_idx" ON "game_sessions"("campaignId");

-- CreateIndex
CREATE INDEX "game_sessions_campaignId_status_idx" ON "game_sessions"("campaignId", "status");

-- CreateIndex
CREATE INDEX "initiative_entries_sessionId_idx" ON "initiative_entries"("sessionId");

-- CreateIndex
CREATE INDEX "combat_log_entries_sessionId_idx" ON "combat_log_entries"("sessionId");

-- CreateIndex
CREATE INDEX "map_scenes_campaignId_idx" ON "map_scenes"("campaignId");

-- CreateIndex
CREATE INDEX "map_tokens_sceneId_idx" ON "map_tokens"("sceneId");

-- CreateIndex
CREATE INDEX "walls_sceneId_idx" ON "walls"("sceneId");

-- CreateIndex
CREATE INDEX "light_sources_sceneId_idx" ON "light_sources"("sceneId");

-- CreateIndex
CREATE INDEX "map_drawings_sceneId_idx" ON "map_drawings"("sceneId");

-- CreateIndex
CREATE INDEX "journal_entries_campaignId_idx" ON "journal_entries"("campaignId");

-- CreateIndex
CREATE INDEX "dice_macros_campaignId_idx" ON "dice_macros"("campaignId");

-- CreateIndex
CREATE INDEX "rollable_tables_campaignId_idx" ON "rollable_tables"("campaignId");

-- CreateIndex
CREATE INDEX "audio_tracks_campaignId_idx" ON "audio_tracks"("campaignId");

-- CreateIndex
CREATE INDEX "timeline_events_campaignId_idx" ON "timeline_events"("campaignId");

-- CreateIndex
CREATE INDEX "achievements_playerId_idx" ON "achievements"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_name_playerId_key" ON "achievements"("name", "playerId");

-- CreateIndex
CREATE INDEX "character_relationships_campaignId_idx" ON "character_relationships"("campaignId");

-- CreateIndex
CREATE INDEX "encounter_templates_campaignId_idx" ON "encounter_templates"("campaignId");

-- CreateIndex
CREATE INDEX "session_notes_campaignId_idx" ON "session_notes"("campaignId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_dmId_fkey" FOREIGN KEY ("dmId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "npcs" ADD CONSTRAINT "npcs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_dmId_fkey" FOREIGN KEY ("dmId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "initiative_entries" ADD CONSTRAINT "initiative_entries_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "initiative_entries" ADD CONSTRAINT "initiative_entries_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combat_log_entries" ADD CONSTRAINT "combat_log_entries_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_scenes" ADD CONSTRAINT "map_scenes_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_tokens" ADD CONSTRAINT "map_tokens_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "map_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_tokens" ADD CONSTRAINT "map_tokens_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "walls" ADD CONSTRAINT "walls_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "map_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "light_sources" ADD CONSTRAINT "light_sources_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "map_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_drawings" ADD CONSTRAINT "map_drawings_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "map_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dice_macros" ADD CONSTRAINT "dice_macros_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dice_macros" ADD CONSTRAINT "dice_macros_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rollable_tables" ADD CONSTRAINT "rollable_tables_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rollable_tables" ADD CONSTRAINT "rollable_tables_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_tracks" ADD CONSTRAINT "audio_tracks_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_relationships" ADD CONSTRAINT "character_relationships_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounter_templates" ADD CONSTRAINT "encounter_templates_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_notes" ADD CONSTRAINT "session_notes_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
