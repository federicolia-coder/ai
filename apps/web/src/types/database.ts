export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          plan: "free" | "plus" | "pro";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          plan?: "free" | "plus" | "pro";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          plan?: "free" | "plus" | "pro";
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          archived?: boolean;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: "system" | "user" | "assistant" | "tool";
          content: string;
          token_count: number;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role: "system" | "user" | "assistant" | "tool";
          content: string;
          token_count?: number;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          content?: string;
          metadata?: Json | null;
        };
      };
      usage: {
        Row: {
          id: string;
          user_id: string;
          period_start: string;
          period_end: string;
          tokens_used: number;
          token_limit: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          period_start: string;
          period_end: string;
          tokens_used?: number;
          token_limit?: number;
          created_at?: string;
        };
        Update: {
          tokens_used?: number;
          token_limit?: number;
          period_start?: string;
          period_end?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan: "free" | "plus" | "pro";
          status: string;
          current_period_start: string | null;
          current_period_end: string | null;
          token_limit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: "free" | "plus" | "pro";
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          token_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: "free" | "plus" | "pro";
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          token_limit?: number;
          updated_at?: string;
        };
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          last_used_at: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          last_used_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          last_used_at?: string | null;
        };
      };
      plugins: {
        Row: {
          id: string;
          name: string;
          description: string;
          version: string;
          permissions: string[];
          tools: string[];
          enabled_by_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          version: string;
          permissions?: string[];
          tools?: string[];
          enabled_by_default?: boolean;
          created_at?: string;
        };
        Update: {
          description?: string;
          version?: string;
          permissions?: string[];
          tools?: string[];
          enabled_by_default?: boolean;
        };
      };
      user_plugins: {
        Row: {
          id: string;
          user_id: string;
          plugin_id: string;
          enabled: boolean;
          config: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plugin_id: string;
          enabled?: boolean;
          config?: Json | null;
          created_at?: string;
        };
        Update: {
          enabled?: boolean;
          config?: Json | null;
        };
      };
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Usage = Database["public"]["Tables"]["usage"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type ApiKey = Database["public"]["Tables"]["api_keys"]["Row"];
export type Plugin = Database["public"]["Tables"]["plugins"]["Row"];
export type UserPlugin = Database["public"]["Tables"]["user_plugins"]["Row"];

export interface Attachment {
  id: string;
  user_id: string;
  message_id: string | null;
  conversation_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
}

export interface ConnectorField {
  name: string;
  type: "password" | "url" | "text";
  label: string;
  required?: boolean;
  help?: string;
}

export interface Connector {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  auth_type: string;
  config_schema: { fields?: ConnectorField[] };
  tools: string[];
  available: boolean;
  enabled: boolean;
  created_at: string;
}

// Credentials (config) are write-only from the browser and never selected here.
export interface UserConnector {
  id: string;
  user_id: string;
  connector_id: string;
  enabled: boolean;
  configured: boolean;
  created_at: string;
  updated_at: string;
}
