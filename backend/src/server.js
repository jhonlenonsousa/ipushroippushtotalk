const db = require("./database");
const { createClient } = require("redis");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { AccessToken } = require("livekit-server-sdk");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const redis = createClient({
  url: process.env.REDIS_URL || "redis://ptt_redis:6379"
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

redis.connect().then(() => {
  console.log("Redis conectado com sucesso");
});

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "PTT Backend",
    message: "Backend PTT rodando com sucesso"
  });
});

app.post("/livekit/token", async (req, res) => {
  try {
    const { identity, room, name } = req.body;

    if (!identity || !room) {
      return res.status(400).json({
        error: "identity e room são obrigatórios"
      });
    }

    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity,
        name: name || identity
      }
    );

    token.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true
    });

    const jwt = await token.toJwt();

    return res.json({
      token: jwt,
      url: process.env.LIVEKIT_URL,
      room,
      identity
    });
  } catch (error) {
    console.error("Erro ao gerar token:", error);
    return res.status(500).json({
      error: "Erro interno ao gerar token LiveKit"
    });
  }
});

app.post("/ptt/request", async (req, res) => {
  try {
    const { channel, identity } = req.body;

    if (!channel || !identity) {
      return res.status(400).json({
        allowed: false,
        error: "channel e identity são obrigatórios"
      });
    }

    const key = `ptt:channel:${channel}:speaker`;

    const result = await redis.set(key, identity, {
      NX: true,
      EX: 15
    });

    if (result === "OK") {
      return res.json({
        allowed: true,
        channel,
        speaker: identity,
        message: "Canal liberado para falar"
      });
    }

    const currentSpeaker = await redis.get(key);

    return res.status(409).json({
      allowed: false,
      channel,
      speaker: currentSpeaker,
      message: "Canal ocupado"
    });
  } catch (error) {
    console.error("Erro em /ptt/request:", error);
    return res.status(500).json({
      allowed: false,
      error: "Erro interno ao solicitar PTT"
    });
  }
});

app.post("/ptt/release", async (req, res) => {
  try {
    const { channel, identity } = req.body;

    if (!channel || !identity) {
      return res.status(400).json({
        released: false,
        error: "channel e identity são obrigatórios"
      });
    }

    const key = `ptt:channel:${channel}:speaker`;
    const currentSpeaker = await redis.get(key);

    if (currentSpeaker !== identity) {
      return res.status(403).json({
        released: false,
        channel,
        speaker: currentSpeaker,
        message: "Este usuário não é o dono atual da fala"
      });
    }

    await redis.del(key);

    return res.json({
      released: true,
      channel,
      speaker: identity,
      message: "Canal liberado"
    });
  } catch (error) {
    console.error("Erro em /ptt/release:", error);
    return res.status(500).json({
      released: false,
      error: "Erro interno ao liberar PTT"
    });
  }
});

app.get("/ptt/status/:channel", async (req, res) => {
  try {
    const { channel } = req.params;
    const key = `ptt:channel:${channel}:speaker`;
    const speaker = await redis.get(key);

    return res.json({
      channel,
      busy: !!speaker,
      speaker: speaker || null
    });
  } catch (error) {
    console.error("Erro em /ptt/status:", error);
    return res.status(500).json({
      error: "Erro interno ao consultar status PTT"
    });
  }
});

app.post("/ptt/heartbeat", async (req, res) => {
  try {
    const { channel, identity } = req.body;

    if (!channel || !identity) {
      return res.status(400).json({
        renewed: false,
        error: "channel e identity são obrigatórios"
      });
    }

    const key = `ptt:channel:${channel}:speaker`;
    const currentSpeaker = await redis.get(key);

    if (currentSpeaker !== identity) {
      return res.status(403).json({
        renewed: false,
        channel,
        speaker: currentSpeaker,
        message: "Este usuário não é o dono atual da fala"
      });
    }

    await redis.expire(key, 15);

    return res.json({
      renewed: true,
      channel,
      speaker: identity,
      ttl: 15,
      message: "PTT renovado com sucesso"
    });
  } catch (error) {
    console.error("Erro em /ptt/heartbeat:", error);
    return res.status(500).json({
      renewed: false,
      error: "Erro interno ao renovar PTT"
    });
  }
});

app.get("/db/test", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW()");

    res.json({
      status: "ok",
      database: "connected",
      server_time: result.rows[0].now,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "error",
      message: "Falha ao conectar no PostgreSQL",
    });
  }
});

app.post('/presence/heartbeat', async (req, res) => {

    try {

        const {
            user_id,
            username,
            channel
        } = req.body;

        await db.query(`
            INSERT INTO user_presence (
                user_id,
                username,
                channel,
                last_seen
            )
            VALUES ($1, $2, $3, NOW())
        `, [
            user_id,
            username,
            channel
        ]);

        res.json({
            status: 'online'
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'presence_error'
        });

    }

});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`PTT Backend rodando na porta ${PORT}`);
});
