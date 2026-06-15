"use client";

import { useEffect, useState } from "react";
import MuxPlayer from "@mux/mux-player-react";

interface Props {
  videoId: string;
  initialPlaybackId: string | null;
  initialVideoUrl: string | null;
  posterUrl: string | null;
}

interface PlaybackStatus {
  muxPlaybackId: string | null;
  posterUrl: string | null;
}

export function VideoPlayer({
  videoId,
  initialPlaybackId,
  initialVideoUrl,
  posterUrl: initialPosterUrl,
}: Props) {
  const [playbackId, setPlaybackId] = useState<string | null>(initialPlaybackId);
  const [posterUrl, setPosterUrl] = useState<string | null>(initialPosterUrl);

  useEffect(() => {
    if (playbackId) return;

    let active = true;
    const poll = async () => {
      try {
        const res = await fetch(`/api/videos/${videoId}/playback`);
        if (!res.ok || !active) return;
        const data = (await res.json()) as PlaybackStatus;
        if (data.muxPlaybackId) {
          setPlaybackId(data.muxPlaybackId);
          if (data.posterUrl) setPosterUrl(data.posterUrl);
        }
      } catch {
        // silent — keep polling
      }
    };

    void poll();
    const iv = setInterval(poll, 3000);
    return () => {
      active = false;
      clearInterval(iv);
    };
  }, [videoId, playbackId]);

  if (playbackId) {
    return (
      <MuxPlayer
        playbackId={playbackId}
        poster={posterUrl ?? undefined}
        className="aspect-video w-full rounded-xl"
        accentColor="#6366f1"
      />
    );
  }

  if (initialVideoUrl) {
    return (
      <video
        src={initialVideoUrl}
        controls
        poster={posterUrl ?? undefined}
        className="aspect-video w-full rounded-xl bg-muted"
      />
    );
  }

  // Transcoding in progress — show poster with animated indicator.
  return (
    <div
      className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-muted"
      style={
        posterUrl
          ? { backgroundImage: `url(${posterUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
          : undefined
      }
    >
      <div className="flex flex-col items-center gap-3 rounded-xl bg-black/60 px-6 py-4 text-white">
        <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        <span className="text-sm font-medium">Transcoding — ready shortly</span>
      </div>
    </div>
  );
}
