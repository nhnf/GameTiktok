"use client";

import type { BattleGiftLogView, BattleSnapshot, ChatMessageView, GameStateHost } from "@tebak-kata/shared";
import type { AppConfig } from "@/lib/api";
import { useAppConfig } from "@/lib/useAppConfig";
import { useGameSocket, type ConnectionStatus } from "@/lib/useGameSocket";
import { HOST_GAMES } from "@/games/hostRegistry";
import { Button } from "@/components/ui/Button";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { LiveChatPanel } from "./LiveChatPanel";
import { LeaderboardCard } from "./LeaderboardCard";
import { SessionLiveCard } from "./SessionLiveCard";
import { SessionStartCard } from "./SessionStartCard";
import { SessionStatsBar } from "./SessionStatsBar";
import { QuickGiftTestCard } from "./QuickGiftTestCard";
import { ChampionsHostCard } from "./ChampionsHostCard";

/** Design System §23 / PLAN §9 — Host Dashboard. */
export function HostDashboard({ token, signOut }: { token: string; signOut?: () => void }) {
  const { status, hostState, chatLog, battleFrame, battleGiftLog } = useGameSocket("host", token);
  const { config, failed } = useAppConfig();

  return (
    <div className="h-screen">
      <HostDashboardView
        token={token}
        socketStatus={status}
        hostState={hostState}
        chatLog={chatLog}
        config={config}
        configFailed={failed}
        battleFrame={battleFrame}
        battleGiftLog={battleGiftLog}
        onSignOut={signOut}
      />
    </div>
  );
}

export interface HostDashboardViewProps {
  token: string;
  socketStatus: ConnectionStatus;
  hostState: GameStateHost | null;
  chatLog: ChatMessageView[];
  config: AppConfig | null;
  configFailed: boolean;
  battleFrame?: BattleSnapshot | null;
  battleGiftLog?: BattleGiftLogView[];
  onSignOut?: () => void;
}

export function HostDashboardView({
  token,
  socketStatus,
  hostState,
  chatLog,
  config,
  configFailed,
  battleFrame = null,
  battleGiftLog = [],
  onSignOut,
}: HostDashboardViewProps) {
  const sessionStatus = hostState?.status ?? "CREATED";
  const live = sessionStatus === "ACTIVE" || sessionStatus === "PAUSED";
  const game = HOST_GAMES[hostState?.activeGame ?? "TEBAK_KATA"];
  const gameProps = hostState ? { token, hostState, chatLog, battleFrame, battleGiftLog } : null;

  return (
    <div className="flex h-full flex-col bg-paper text-ink">
      <Topbar
        token={token}
        activeGame={hostState?.activeGame ?? "TEBAK_KATA"}
        status={sessionStatus}
        socketStatus={socketStatus}
        config={config}
        timer={hostState?.timer ?? null}
        liveSource={hostState?.liveSource ?? null}
        onSignOut={onSignOut}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar active="/host" />
        <main className="bg-dots flex min-h-0 min-w-0 flex-1 gap-5 overflow-hidden p-5">
          {socketStatus === "unauthorized" ? (
            <div className="m-auto max-w-md rounded-nb border-3 border-ink bg-white p-6 text-center shadow-nb-md">
              <p className="mb-4 font-bold">Host token ditolak server. Masukkan token yang benar (lihat HOST_TOKEN di apps/server/.env).</p>
              {onSignOut && <Button onClick={onSignOut}>Masukkan ulang token</Button>}
            </div>
          ) : !gameProps ? (
            <p className="m-auto text-sm font-bold text-muted">{socketStatus === "closed" ? "Server game tidak terhubung — menyambung ulang..." : "Memuat dashboard..."}</p>
          ) : (
            <>
              <div className="flex w-[460px] shrink-0 flex-col gap-5 overflow-y-auto pb-2 pr-2">
                {!live && <SessionStartCard token={token} hostState={hostState} config={config} configFailed={configFailed} />}
                <game.Main {...gameProps} />
                {live && hostState && <SessionLiveCard token={token} hostState={hostState} />}
                {live && <QuickGiftTestCard token={token} />}
              </div>
              <div className="flex min-h-0 min-w-[260px] flex-1 flex-col pb-2">
                {game.Middle ? <game.Middle {...gameProps} /> : <LiveChatPanel token={token} chatLog={chatLog} canSend={sessionStatus === "ACTIVE"} paused={sessionStatus === "PAUSED"} />}
              </div>
              <div className="flex min-h-0 w-[300px] shrink-0 flex-col gap-4 overflow-y-auto pb-2 pr-2">
                {game.Side ? <game.Side {...gameProps} /> : <LeaderboardCard entries={hostState?.leaderboard ?? []} />}
                <ChampionsHostCard token={token} champions={hostState?.champions} />
              </div>
            </>
          )}
        </main>
      </div>
      {hostState && <SessionStatsBar stats={hostState.stats} items={game.stats(hostState)} />}
    </div>
  );
}
