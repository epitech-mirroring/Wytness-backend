export type DiscordSnowflake = string;

export type DiscordAvatarDecoration = {
  asset: string;
  sku_id: DiscordSnowflake;
};

export type DiscordThreadMetadata = {
  archived: boolean;
  auto_archive_duration: number;
  archive_timestamp: string;
  locked: boolean;
  invitable?: boolean;
  create_timestamp?: string;
};

export type DiscordThreadMember = {
  id?: DiscordSnowflake;
  user_id?: DiscordSnowflake;
  join_timestamp: string;
  flags: number;
  member?: DiscordGuildMember;
};

export type DiscordTag = {
  id: DiscordSnowflake;
  name: string;
  moderated: boolean;
  emoji_id: DiscordSnowflake;
  emoji_name: string;
};

export type DiscordDefaultReactionObject = {
  emoji_id: DiscordSnowflake;
  emoji_name: string;
};

export type DiscordEmbedFooter = {
  text: string;
  icon_url?: string;
  proxy_icon_url?: string;
};

export type DiscordEmbedImage = {
  url: string;
  proxy_url?: string;
  height?: number;
  width?: number;
};

export type DiscordEmbedThumbnail = {
  url: string;
  proxy_url?: string;
  height?: number;
  width?: number;
};

export type DiscordEmbedVideo = {
  url?: string;
  proxy_url?: string;
  height?: number;
  width?: number;
};

export type DiscordEmbedProvider = {
  name?: string;
  url?: string;
};

export type DiscordEmbedAuthor = {
  name: string;
  url?: string;
  icon_url?: string;
  proxy_icon_url?: string;
};

export type DiscordEmbedField = {
  name: string;
  value: string;
  inline?: boolean;
};

export type DiscordCountDetail = {
  burst: number;
  normal: number;
};

export type DiscordEmoji = {
  id: DiscordSnowflake;
  name?: string;
  roles?: DiscordSnowflake[];
  user?: DiscordUser;
  require_colons?: boolean;
  managed?: boolean;
  animated?: boolean;
  available?: boolean;
};

export type DiscordTeam = {
  icon: string;
  id: DiscordSnowflake;
  members: DiscordUser[];
  name: string;
  owner_user_id: DiscordSnowflake;
};

export type DiscordGuild = {
  id: DiscordSnowflake;
  name: string;
  icon: string;
  icon_hash?: string;
  splash: string;
  discovery_splash: string;
  owner?: boolean;
  owner_id: DiscordSnowflake;
  permissions?: string;
  region?: string;
  afk_channel_id: DiscordSnowflake;
  afk_timeout: number;
  widget_enabled?: boolean;
  widget_channel_id?: DiscordSnowflake;
  verification_level: number;
  default_message_notifications: number;
  explicit_content_filter: number;
  roles: DiscordRole[];
  emojis: DiscordEmoji[];
  features: string[];
  mfa_level: number;
  application_id?: DiscordSnowflake;
  system_channel_id: DiscordSnowflake;
  system_channel_flags: number;
  rules_channel_id: DiscordSnowflake;
  max_presences?: number;
  max_members: number;
  vanity_url_code: string;
  description: string;
  banner: string;
  premium_tier: number;
  premium_subscription_count?: number;
  preferred_locale: string;
  public_updates_channel_id: DiscordSnowflake;
  max_video_channel_users?: number;
  max_stage_video_channel_users?: number;
  approximate_member_count?: number;
  approximate_presence_count?: number;
  welcome_screen?: DiscordWelcomeScreen;
  nsfw_level: number;
  sticker?: DiscordSticker[];
  premium_progress_bar_enabled: boolean;
  safety_alert_channel_id: DiscordSnowflake;
};

export type DiscordWelcomeScreen = {
  description: string;
  welcome_channels: DiscordWelcomeScreenChannel[];
};

export type DiscordWelcomeScreenChannel = {
  channel_id: DiscordSnowflake;
  description: string;
  emoji_id?: DiscordSnowflake;
  emoji_name?: string;
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

export type DiscordChannelMention = {
  id: DiscordSnowflake;
  guild_id: DiscordSnowflake;
  type: number;
  name: string;
};

export type DiscordAttachment = {
  id: DiscordSnowflake;
  filename: string;
  title?: string;
  description?: string;
  content_type?: string;
  size: number;
  url: string;
  proxy_url: string;
  height?: number;
  width?: number;
  ephemeral?: boolean;
  duration_secs?: number;
  waveform?: string;
  flags?: number;
};

export type DiscordEmbed = {
  title?: string;
  type?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: DiscordEmbedFooter;
  image?: DiscordEmbedImage;
  thumbnail?: DiscordEmbedThumbnail;
  video?: DiscordEmbedVideo;
  provider?: DiscordEmbedProvider;
  author?: DiscordEmbedAuthor;
  fields?: DiscordEmbedField[];
};

export type DiscordReaction = {
  count: number;
  count_detail: DiscordCountDetail;
  me: boolean;
  me_burst: boolean;
  emoji: Partial<DiscordEmoji>;
};

export type DiscordMessageActivity = {
  type: number;
  party_id?: string;
};

export type DiscordApplication = {
  id: DiscordSnowflake;
  name: string;
  icon: string;
  description: string;
  rpc_origins?: string[];
  bot_public: boolean;
  bot_require_code_grant: boolean;
  bot?: Partial<DiscordUser>;
  terms_of_service_url?: string;
  privacy_policy_url?: string;
  owner?: Partial<DiscordUser>;
  summary: string;
  verify_key: string;
  team: Partial<DiscordTeam>;
  guild_id?: DiscordSnowflake;
  guild?: Partial<DiscordGuild>;
};

export type DiscordMessageReference = {};

export type DiscordMessageSnapshot = {};

export type DiscordMessageInteraction = {};

export type DiscordChannel = {
  id: DiscordSnowflake;
  type: number;
  guild_id?: DiscordSnowflake;
  position?: number;
  permission_overwrites?: any[];
  name?: string;
  topic?: string;
  nsfw?: boolean;
  last_message_id?: DiscordSnowflake;
  bitrate?: number;
  user_limit?: number;
  rate_limit_per_user?: number;
  recipients?: DiscordUser[];
  icon?: string;
  owner_id?: DiscordSnowflake;
  application_id?: DiscordSnowflake;
  managed?: boolean;
  parent_id?: DiscordSnowflake;
  last_pin_timestamp?: string; // ISO8601 timestamp
  rtc_region?: string;
  video_quality_mode?: number;
  message_count?: number;
  member_count?: number;
  thread_metadata?: DiscordThreadMetadata;
  member?: DiscordThreadMember;
  default_auto_archive_duration?: number;
  permissions?: string;
  flags?: number;
  total_message_send?: number;
  available_tags?: DiscordTag[];
  applied_tags?: DiscordSnowflake[];
  default_reactions_emoji?: DiscordDefaultReactionObject;
  default_thread_rate_limit_per_user?: number;
  default_sort_order?: number;
  default_forum_layout?: number;
};

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
  webhook_id?: DiscordSnowflake;
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
