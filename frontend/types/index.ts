export interface User {
  id: number;
  username: string;
  phone?: string | null;
  display_name: string;
  avatar_url?: string | null;
  is_online: boolean;
  last_seen?: string | null;
  created_at: string;
}

export interface Contact {
  id: number;
  user_id: number;
  contact_id: number;
  nickname?: string | null;
  created_at: string;
  contact_user: User;
}

export interface ConversationMember {
  id: number;
  conversation_id: number;
  user_id: number;
  role: "admin" | "member";
  joined_at: string;
  user: User;
}

export interface MessageRead {
  user_id: number;
  read_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id?: number | null;
  content: string;
  message_type: "text" | "image" | "system";
  status: "sending" | "sent" | "delivered" | "read";
  reply_to_id?: number | null;
  created_at: string;
  updated_at: string;
  sender?: User | null;
  reads?: MessageRead[];
  temp_id?: string;
}

export interface Conversation {
  id: number;
  type: "direct" | "group";
  name?: string | null;
  avatar_url?: string | null;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
  latest_message?: Message | null;
  unread_count: number;
  members: ConversationMember[];
}
