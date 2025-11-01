import { Request, Response } from "express";
import { AccessToken } from "livekit-server-sdk";
import { env } from "../env";

const url  = env.LIVEKIT_URL;
const key  = env.LIVEKIT_API_KEY;
const secret = env.LIVEKIT_API_SECRET;

export async function tokenRoute(req: Request, res: Response) {
  try {
    if (!url || !key || !secret) return res.status(428).json({ ok:false, error:"LIVEKIT_* env missing" });

    const room = String(req.query.room || "sutradhar");
    const identity = "user-" + Math.random().toString(36).slice(2,8);

    // Use LiveKit AccessToken SDK for proper token generation
    const token = new AccessToken(key, secret, {
      identity: identity,
      name: identity,
    });

    // Add grant with proper permissions
    token.addGrant({
      room: room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    // Generate JWT token
    const jwtToken = await token.toJwt();
    
    res.json({ ok:true, url, token: jwtToken, room, identity });
  } catch (e:any) {
    res.status(500).json({ ok:false, error: e?.message || String(e) });
  }
}

