"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCcw, Video, VideoOff, Mic, MicOff, PhoneOff, Headphones, HeadphoneOff } from "lucide-react";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  useConnectionState,
  useParticipants,
  LayoutContextProvider,
  useRoomContext,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import { cn } from "@/lib/utils";
import { useSocket } from "@/components/providers/socket-provider";
import { UserAvatar } from "@/components/user-avatar";

interface MediaRoomProps {
  chatId: string;
  userId: string;
  username: string;
  userImageUrl?: string;
  video: boolean;
  audio: boolean;
}

const TOKEN_REFRESH_MS = 4 * 60 * 60 * 1000; // refresh before 6h expiry

async function fetchLiveKitToken(room: string, username: string) {
  const url = `/api/livekit?room=${encodeURIComponent(room)}&username=${encodeURIComponent(username)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to get token");
  const data = await response.json();
  return data.token as string;
}

export const MediaRoom = ({
  chatId,
  userId,
  username,
  userImageUrl,
  video,
  audio,
}: MediaRoomProps) => {
  const [token, setToken] = useState("");
  const [connect, setConnect] = useState(false);
  const [micEnabled, setMicEnabled] = useState(Boolean(audio));
  const [camEnabled, setCamEnabled] = useState(Boolean(video));
  const [error, setError] = useState<string | null>(null);
  const liveKitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  const refreshToken = useCallback(async () => {
    if (!liveKitUrl) return;
    try {
      const newToken = await fetchLiveKitToken(chatId, username);
      setToken(newToken);
      setError(null);
    } catch (error) {
      console.error("[MEDIA_ROOM]", error);
      setError("Failed to connect to LiveKit. Check server configuration.");
    }
  }, [chatId, username, liveKitUrl]);

  useEffect(() => {
    refreshToken();
  }, [refreshToken]);

  useEffect(() => {
    if (!liveKitUrl || !token) return;

    const interval = setInterval(refreshToken, TOKEN_REFRESH_MS);
    return () => clearInterval(interval);
  }, [liveKitUrl, token, refreshToken]);

  if (!liveKitUrl) {
    return (
      <div className="flex flex-col flex-1 justify-center items-center bg-[#313338]">
        <div className="text-center space-y-4 px-4">
          <h3 className="text-xl font-semibold text-zinc-200">
            {video ? "Video" : "Voice"} Channel
          </h3>
          <p className="text-zinc-400 text-sm max-w-sm">
            Add NEXT_PUBLIC_LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET
            to your .env file.
          </p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
        <p className="text-xs text-zinc-400">
          Connecting to {video ? "video" : "voice"} room...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <LiveKitRoom
        key={`${chatId}-${userId}`}
        data-lk-theme="default"
        serverUrl={liveKitUrl}
        token={token}
        connect={connect}
        video={camEnabled}
        audio={micEnabled}
        options={{
          disconnectOnPageLeave: false,
          adaptiveStream: true,
          dynacast: true,
        }}
        onDisconnected={() => setConnect(false)}
        className="flex flex-col flex-1 min-h-0"
      >
        {!connect ? (
          <PreJoin
            title={video ? "Video Channel" : "Voice Channel"}
            micEnabled={micEnabled}
            camEnabled={camEnabled}
            setMicEnabled={setMicEnabled}
            setCamEnabled={setCamEnabled}
            onJoin={() => setConnect(true)}
            error={error}
            onRetry={refreshToken}
            showCameraToggle={video}
          />
        ) : (
          <MediaConference
            kind={video ? "video" : "audio"}
            onReconnect={refreshToken}
            channelId={chatId}
            userId={userId}
            username={username}
            userImageUrl={userImageUrl}
            onLeave={() => setConnect(false)}
          />
        )}
      </LiveKitRoom>
    </div>
  );
};

function PreJoin({
  title,
  micEnabled,
  camEnabled,
  setMicEnabled,
  setCamEnabled,
  onJoin,
  error,
  onRetry,
  showCameraToggle,
}: {
  title: string;
  micEnabled: boolean;
  camEnabled: boolean;
  setMicEnabled: (v: boolean) => void;
  setCamEnabled: (v: boolean) => void;
  onJoin: () => void;
  error: string | null;
  onRetry: () => void;
  showCameraToggle: boolean;
}) {
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center bg-[#313338]">
      <div className="w-full max-w-md rounded-lg border border-zinc-700 bg-[#1f2125] p-6 shadow-xl">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-zinc-100">{title}</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Choose your devices and join when ready.
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
            <button
              type="button"
              onClick={onRetry}
              className="ml-2 inline-flex items-center gap-1 text-rose-100 underline"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        ) : null}

        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => setMicEnabled(!micEnabled)}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition",
              micEnabled
                ? "border-zinc-700 bg-zinc-900/40 text-zinc-100 hover:bg-zinc-900/60"
                : "border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15"
            )}
          >
            {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            {micEnabled ? "Mic on" : "Mic off"}
          </button>

          {showCameraToggle ? (
            <button
              type="button"
              onClick={() => setCamEnabled(!camEnabled)}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition",
                camEnabled
                  ? "border-zinc-700 bg-zinc-900/40 text-zinc-100 hover:bg-zinc-900/60"
                  : "border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15"
              )}
            >
              {camEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              {camEnabled ? "Camera on" : "Camera off"}
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onJoin}
          className="w-full inline-flex items-center justify-center rounded-md bg-indigo-500 hover:bg-indigo-600 transition text-white px-4 py-2 font-semibold"
        >
          Join
        </button>
      </div>
    </div>
  );
}

const MediaConference = ({
  kind,
  onReconnect,
  channelId,
  userId,
  username,
  userImageUrl,
  onLeave,
}: {
  kind: "audio" | "video";
  onReconnect: () => void;
  channelId: string;
  userId: string;
  username: string;
  userImageUrl?: string;
  onLeave: () => void;
}) => {
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const room = useRoomContext();
  const { socket, voiceByChannelId } = useSocket();
  const [deafened, setDeafened] = useState(false);

  const localMicMuted = !room.localParticipant.isMicrophoneEnabled;
  const voiceUsers = voiceByChannelId[channelId] || [];

  // Keep deafen applied when participants change.
  useEffect(() => {
    if (!deafened) return;
    for (const [, participant] of room.remoteParticipants) {
      participant.setVolume(0);
    }
  }, [deafened, room.remoteParticipants]);

  useEffect(() => {
    if (!socket) return;
    socket.emit("voice:join", {
      channelId,
      userId,
      name: username,
      imageUrl: userImageUrl || "",
      micMuted: localMicMuted,
      deafened,
    });
    return () => {
      socket.emit("voice:leave", { channelId, userId });
    };
  }, [socket, channelId, userId, username, userImageUrl, localMicMuted, deafened]);

  useEffect(() => {
    if (!socket) return;
    socket.emit("voice:update", { channelId, userId, micMuted: localMicMuted, deafened });
  }, [socket, channelId, userId, localMicMuted, deafened]);

  const toggleDeafen = async () => {
    const next = !deafened;
    setDeafened(next);
    try {
      // livekit-client doesn't expose a Room-wide playback toggle consistently across versions.
      // Implement "deafen" by setting all remote participants' audio volume to 0.
      // When undeafening, restore to 1.
      for (const [, participant] of room.remoteParticipants) {
        participant.setVolume(next ? 0 : 1);
      }
    } catch (e) {
      console.error("[VOICE_DEAFEN]", e);
    }
  };

  const leave = async () => {
    try {
      socket?.emit("voice:leave", { channelId, userId });
      await room.disconnect();
    } finally {
      onLeave();
    }
  };

  const tracks = useTracks(
    [
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Camera, withPlaceholder: kind === "video" },
      { source: Track.Source.Microphone, withPlaceholder: kind === "video" },
    ],
    { onlySubscribed: false }
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[#313338]">
      <div className="h-12 px-3 flex items-center border-b border-zinc-800/80 surface-chat">
        <p className="text-sm font-semibold text-zinc-200">
          {kind === "video" ? "Video" : "Voice"} • {participants.length}
        </p>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-zinc-500">{connectionState}</span>
          <button
            type="button"
            onClick={onReconnect}
            className="h-8 w-8 rounded-md hover:bg-zinc-800/60 transition flex items-center justify-center"
            title="Reconnect"
          >
            <RefreshCcw className="h-4 w-4 text-zinc-400" />
          </button>
        </div>
      </div>

      {kind === "video" ? (
        <div className="flex-1 min-h-0 p-3">
          <GridLayout tracks={tracks} className="h-full">
            <ParticipantTile />
          </GridLayout>
        </div>
      ) : (
        <div className="flex-1 min-h-0 p-3">
          <div className="h-full rounded-lg border border-zinc-800 bg-[#1f2125] overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Voice connected
              </p>
              <p className="ml-auto text-xs text-zinc-500">{voiceUsers.length} online</p>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100%-44px)]">
              <div
                className={cn(
                  "grid gap-4",
                  voiceUsers.length <= 2
                    ? "grid-cols-2"
                    : voiceUsers.length <= 4
                      ? "grid-cols-2 md:grid-cols-3"
                      : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                )}
              >
                {voiceUsers.map((u) => (
                  <div
                    key={u.userId}
                    className="relative rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 flex flex-col items-center justify-center min-h-40"
                  >
                    <div className="relative">
                      <div className="rounded-xl border border-zinc-700 bg-zinc-950/20 p-2">
                        <UserAvatar
                          src={u.imageUrl || ""}
                          name={u.name}
                          className="h-16 w-16"
                        />
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border border-zinc-800 bg-[#1f2125] px-2 py-1">
                        {u.micMuted ? (
                          <MicOff className="h-3.5 w-3.5 text-rose-300" />
                        ) : (
                          <Mic className="h-3.5 w-3.5 text-zinc-400" />
                        )}
                        {u.deafened ? (
                          <Headphones className="h-3.5 w-3.5 text-rose-300" />
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-zinc-200 truncate max-w-full">
                      {u.name}
                    </p>
                  </div>
                ))}
              </div>
              {voiceUsers.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-10">
                  No one is in the call yet.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <RoomAudioRenderer />
      <div className="border-t border-zinc-800/80 bg-[#2b2d31]">
        <div className="flex items-center gap-2 px-2 py-2">
          <LayoutContextProvider>
            <ControlBar
              variation="minimal"
              controls={{
                camera: kind === "video",
                microphone: true,
                screenShare: kind === "video",
                chat: false,
                settings: true,
                leave: false,
              }}
            />
          </LayoutContextProvider>
          <button
            type="button"
            onClick={toggleDeafen}
            className={cn(
              "ml-auto h-10 w-10 rounded-md border flex items-center justify-center transition",
              deafened
                ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                : "border-zinc-700 bg-zinc-900/40 text-zinc-200 hover:bg-zinc-900/60"
            )}
            title={deafened ? "Undeafen" : "Deafen"}
          >
            {deafened ? <HeadphoneOff className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={leave}
            className="h-10 px-3 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-200 hover:bg-rose-500/25 transition inline-flex items-center gap-2"
            title="Leave"
          >
            <PhoneOff className="h-4 w-4" />
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};
