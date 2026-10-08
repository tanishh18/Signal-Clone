import { getStoredToken, removeStoredToken } from "./auth";
import {
  User,
  Conversation,
  Message,
  Contact,
} from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

interface RequestOptions extends RequestInit {
  token?: string | null;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = options.token !== undefined ? options.token : getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    throw new ApiError(0, `Cannot connect to server: ${message}`);
  }

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errData = await response.json();
      if (typeof errData.detail === "string") {
        errorDetail = errData.detail;
      } else if (Array.isArray(errData.detail)) {
        errorDetail = errData.detail.map((d: { msg?: string }) => d.msg || "").join(", ");
      } else if (errData.message) {
        errorDetail = errData.message;
      }
    } catch {
      // response was not JSON
    }

    if (response.status === 401) {
      removeStoredToken();
    }

    throw new ApiError(response.status, errorDetail);
  }

  return response.json() as Promise<T>;
}

// --- Authentication APIs ---

export interface OTPResponse {
  identifier: string;
  otp: string;
  message: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterPayload {
  username: string;
  display_name: string;
  phone?: string;
  avatar_url?: string;
  otp: string;
}

export async function requestOtp(identifier: string): Promise<OTPResponse> {
  return apiRequest<OTPResponse>("/auth/request-otp", {
    method: "POST",
    body: JSON.stringify({ identifier }),
  });
}

export async function loginWithOtp(
  identifier: string,
  otp: string
): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, otp }),
  });
}

export async function registerUser(
  payload: RegisterPayload
): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logoutUser(token?: string | null): Promise<void> {
  try {
    await apiRequest<{ message: string }>("/auth/logout", {
      method: "POST",
      token,
    });
  } catch {
    // Ignore logout failure and proceed to clear local credentials
  } finally {
    removeStoredToken();
  }
}

export async function getCurrentUser(token?: string | null): Promise<User> {
  return apiRequest<User>("/users/me", {
    method: "GET",
    token,
  });
}

// --- Conversations & Messages APIs ---

export async function getConversations(): Promise<Conversation[]> {
  return apiRequest<Conversation[]>("/conversations", {
    method: "GET",
  });
}

export async function getConversationDetails(
  conversationId: number
): Promise<Conversation> {
  return apiRequest<Conversation>(`/conversations/${conversationId}`, {
    method: "GET",
  });
}

export async function createOrGetDirectConversation(
  participantId: number
): Promise<Conversation> {
  return apiRequest<Conversation>("/conversations", {
    method: "POST",
    body: JSON.stringify({ participant_id: participantId }),
  });
}

export async function getConversationMessages(
  conversationId: number,
  limit: number = 50,
  offset: number = 0
): Promise<Message[]> {
  return apiRequest<Message[]>(
    `/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`,
    {
      method: "GET",
    }
  );
}

export async function sendRestMessage(
  conversationId: number,
  content: string,
  replyToId?: number | null
): Promise<Message> {
  return apiRequest<Message>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      content,
      reply_to_id: replyToId || null,
      message_type: "text",
    }),
  });
}

// --- Users & Contacts APIs ---

export async function searchUsers(query: string): Promise<User[]> {
  if (!query.trim()) return [];
  return apiRequest<User[]>(`/users/search?q=${encodeURIComponent(query.trim())}`, {
    method: "GET",
  });
}

export async function getContacts(): Promise<Contact[]> {
  return apiRequest<Contact[]>("/contacts", {
    method: "GET",
  });
}
