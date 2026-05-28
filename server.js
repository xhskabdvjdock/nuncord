const { createServer } = require("node:http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  // In-memory voice presence per channel (dev-friendly).
  // channelId -> Map(userId -> { userId,name,imageUrl,micMuted,deafened })
  const voiceState = new Map();

  function emitVoiceState(channelId) {
    const usersMap = voiceState.get(channelId);
    const users = usersMap ? Array.from(usersMap.values()) : [];
    io.emit("voice:state", { channelId, users });
  }

  io.on("connection", (socket) => {
    console.log(`[SOCKET] Client connected: ${socket.id}`);
    const joinedVoiceChannels = new Set();

    // Join a channel room
    socket.on("join-channel", (channelId) => {
      socket.join(`channel:${channelId}`);
      console.log(`[SOCKET] ${socket.id} joined channel:${channelId}`);
    });

    // Leave a channel room
    socket.on("leave-channel", (channelId) => {
      socket.leave(`channel:${channelId}`);
    });

    // Join a conversation room (DM)
    socket.on("join-conversation", (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    // Leave a conversation room (DM)
    socket.on("leave-conversation", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Join server room for unread badges
    socket.on("join-server", (serverId) => {
      if (serverId) socket.join(`server:${serverId}`);
    });

    socket.on("leave-server", (serverId) => {
      if (serverId) socket.leave(`server:${serverId}`);
    });

    socket.on("join-user", (userId) => {
      if (userId) socket.join(`user:${userId}`);
    });

    socket.on("leave-user", (userId) => {
      if (userId) socket.leave(`user:${userId}`);
    });

    // Handle new message in channel
    socket.on("chat:message:send", (data) => {
      const { channelId, message, serverId, fromUserId, mentionUserIds } = data;
      io.to(`channel:${channelId}`).emit(
        `chat:${channelId}:messages`,
        message
      );
      if (serverId) {
        socket.to(`server:${serverId}`).emit("unread:channel", {
          channelId,
          fromUserId,
          mentionUserIds: Array.isArray(mentionUserIds) ? mentionUserIds : [],
        });
      }
    });

    // Handle message update
    socket.on("chat:message:update", (data) => {
      const { channelId, message } = data;
      io.to(`channel:${channelId}`).emit(
        `chat:${channelId}:messages:update`,
        message
      );
    });

    // Handle new DM
    socket.on("chat:dm:send", (data) => {
      const {
        conversationId,
        message,
        fromUserId,
        targetUserId,
        targetMemberId,
        mention,
      } = data;
      io.to(`conversation:${conversationId}`).emit(
        `chat:${conversationId}:messages`,
        message
      );
      if (targetUserId) {
        const preview =
          typeof message?.content === "string" && message.content.trim()
            ? message.content.trim().slice(0, 80)
            : message?.fileUrl
              ? "Sent an attachment"
              : null;
        io.to(`user:${targetUserId}`).emit("unread:dm", {
          memberId: targetMemberId,
          conversationId,
          fromUserId,
          mention: !!mention,
          preview,
          imageUrl: message?.user?.imageUrl || "",
          userName: message?.user?.name || "User",
        });
      }
    });

    // Handle DM update
    socket.on("chat:dm:update", (data) => {
      const { conversationId, message } = data;
      io.to(`conversation:${conversationId}`).emit(
        `chat:${conversationId}:messages:update`,
        message
      );
    });

    // Handle typing indicator
    socket.on("typing:start", (data) => {
      const { channelId, conversationId, user } = data;
      if (channelId) {
        socket.to(`channel:${channelId}`).emit("typing:start", { user });
      }
      if (conversationId) {
        socket
          .to(`conversation:${conversationId}`)
          .emit("typing:start", { user });
      }
    });

    socket.on("typing:stop", (data) => {
      const { channelId, conversationId, user } = data;
      if (channelId) {
        socket.to(`channel:${channelId}`).emit("typing:stop", { user });
      }
      if (conversationId) {
        socket
          .to(`conversation:${conversationId}`)
          .emit("typing:stop", { user });
      }
    });

    socket.on("disconnect", () => {
      console.log(`[SOCKET] Client disconnected: ${socket.id}`);
      for (const channelId of joinedVoiceChannels) {
        const usersMap = voiceState.get(channelId);
        if (usersMap) {
          // remove any entries that were bound to this socket id
          for (const [uid, u] of usersMap.entries()) {
            if (u.socketId === socket.id) usersMap.delete(uid);
          }
          if (usersMap.size === 0) voiceState.delete(channelId);
        }
        emitVoiceState(channelId);
      }
    });

    // Lightweight latency probe
    socket.on("client:ping", (ack) => {
      if (typeof ack === "function") {
        ack({ ok: true, ts: Date.now() });
      }
    });

    // Voice presence (sidebar + mic/deafen state)
    socket.on("voice:join", (payload) => {
      const { channelId, userId, name, imageUrl, micMuted, deafened } = payload || {};
      if (!channelId || !userId) return;
      joinedVoiceChannels.add(channelId);
      if (!voiceState.has(channelId)) voiceState.set(channelId, new Map());
      voiceState.get(channelId).set(userId, {
        socketId: socket.id,
        userId,
        name: name || "User",
        imageUrl: imageUrl || "",
        micMuted: !!micMuted,
        deafened: !!deafened,
      });
      emitVoiceState(channelId);
    });

    socket.on("voice:update", (payload) => {
      const { channelId, userId, micMuted, deafened } = payload || {};
      if (!channelId || !userId) return;
      const usersMap = voiceState.get(channelId);
      if (!usersMap) return;
      const existing = usersMap.get(userId);
      if (!existing) return;
      usersMap.set(userId, { ...existing, micMuted: !!micMuted, deafened: !!deafened });
      emitVoiceState(channelId);
    });

    socket.on("voice:leave", (payload) => {
      const { channelId, userId } = payload || {};
      if (!channelId || !userId) return;
      joinedVoiceChannels.delete(channelId);
      const usersMap = voiceState.get(channelId);
      if (!usersMap) return;
      usersMap.delete(userId);
      if (usersMap.size === 0) voiceState.delete(channelId);
      emitVoiceState(channelId);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
