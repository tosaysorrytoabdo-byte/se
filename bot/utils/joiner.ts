import axios from "axios";
import { config } from "../config";

export async function joinServerWithToken(discordId: string, accessToken: string, serverId: string) {
  try {
    const res = await axios.put(
      `https://discord.com/api/v10/guilds/${serverId}/members/${discordId}`,
      { access_token: accessToken },
      {
        headers: {
          Authorization: `Bot ${config.discordToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return { success: true, status: res.status };
  } catch (err: any) {
    return { 
      success: false, 
      error: err.response?.data?.message || err.message,
      status: err.response?.status,
    };
  }
}

export async function sendWelcomeDM(userId: string, message: string) {
  try {
    const res = await axios.post(
      `https://discord.com/api/v10/users/${userId}/channels`,
      { recipient_id: userId },
      {
        headers: { Authorization: `Bot ${config.discordToken}` },
      }
    );
    
    const channelId = res.data.id;
    
    await axios.post(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      { content: message },
      {
        headers: {
          Authorization: `Bot ${config.discordToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.message || err.message };
  }
}
