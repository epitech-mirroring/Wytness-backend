export type DiscordSnowflake = string;

export type DiscordAvatarDecoration = {
  asset: string;
  sku_id: DiscordSnowflake;
};

export type DiscordUser = {
  id: DiscordSnowflake;
  username: string;
  discriminator: string;
  global_name?: string;
  avatar?: string;
  bot?: boolean;
  system?: boolean;
  mfa_enabled?: boolean;
  banner?: string;
  accent_color?: number;
  locale?: string;
  verified?: boolean;
  email?: string;
  flags?: number;
  premium_type?: number;
  public_flags?: number;
  avatar_decoration_data?: DiscordAvatarDecoration;
};

export type DiscordGuildMember = {
  user?: DiscordUser;
  nick?: string;
  avatar?: string;
  banner?: string;
  roles: DiscordSnowflake[];
  joined_at: string;
  premium_since?: string;
  deaf: boolean;
  mute: boolean;
  flags?: number;
  pending?: boolean;
  permissions?: string;
  communication_disabled_until?: string;
  avatar_decoration_data?: DiscordAvatarDecoration;
};

export type DiscordRole = {};

export type DiscordChannelMention = {};

export type DiscordAttachment = {};

export type DiscordEmbed = {};

export type DiscordReaction = {};

export type DiscordMessageActivity = {};

export type DiscordApplication = {};

export type DiscordMessageReference = {};

export type DiscordMessageSnapshot = {};

export type DiscordMessageInteraction = {};

export type DiscordChannel = {};

export type DiscordMessageComponent = {};

export type DiscordMessageStickerItem = {};

export type DiscordSticker = {};

export type DiscordRoleSubscription = {};

export type DiscordResolved = {};

export type DiscordPoll = {};

export type DiscordMessageCall = {};

export type DiscordMessage = {
  id: DiscordSnowflake;
  channel_id: DiscordSnowflake;
  author: DiscordUser;
  content: string;
  timestamp: string;
  edited_timestamp: string;
  tts: boolean;
  mention_everyone: boolean;
  mentions: DiscordUser[];
  mention_roles: DiscordRole[];
  mention_channels: DiscordChannelMention[];
  attachments: DiscordAttachment[];
  embeds: DiscordEmbed[];
  reactions?: DiscordReaction[];
  nonce?: string;
  pinned: boolean;
  type: number;
  activity?: DiscordMessageActivity;
  application?: Partial<DiscordApplication>;
  application_id?: DiscordSnowflake;
  flags?: number;
  message_reference?: DiscordMessageReference;
  message_snapshots?: DiscordMessageSnapshot[];
  referenced_message?: DiscordMessage;
  interaction?: DiscordMessageInteraction;
  thread?: DiscordChannel;
  components?: DiscordMessageComponent[];
  sticker_items?: DiscordMessageStickerItem[];
  stickers?: DiscordSticker[];
  position?: number;
  role_subscription_data?: DiscordRoleSubscription;
  resolved?: DiscordResolved;
  poll?: DiscordPoll;
  call?: DiscordMessageCall;
};

export type DiscordMessageCreatedEvent = {
  guild_id?: string;
  member?: Partial<DiscordGuildMember>;
  mentions: (DiscordUser & Partial<DiscordGuildMember>)[];
} & DiscordMessage;
