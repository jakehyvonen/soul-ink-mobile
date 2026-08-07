/**
 * Descriptor: Optional Supabase browser authentication for remote PBM deployments.
 * Usage: App creates this service only when runtime-config.json selects Supabase auth.
 */
import { createClient } from "@supabase/supabase-js";

/**
 * Provide Google sign-in and short-lived access tokens without exposing Supabase secrets.
 * Usage: pass runtime configuration, then give getAccessToken to SigmundClient.
 */
export class PbmAuth {
  constructor(config) {
    this.client = createClient(config.supabaseUrl, config.supabasePublishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }

  /** Return the current browser session, if any. Usage: render login or operator controls. */
  async getSession() {
    const { data, error } = await this.client.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  /** Start Google OAuth with the current PBM URL as callback. Usage: remote sign-in button. */
  async signInWithGoogle() {
    const { error } = await this.client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: globalThis.location.href },
    });
    if (error) throw error;
  }

  /** Clear the browser session. Usage: remote sign-out button. */
  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  /** Read the token sent in the relay's first WebSocket frame. Usage: SigmundClient connect. */
  async getAccessToken() {
    return (await this.getSession())?.access_token || "";
  }
}
