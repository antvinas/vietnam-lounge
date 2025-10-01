import { votePost } from "@/api/community";
import { useState } from "react";

export default function VoteBar({
  postId,
  upVotes,
  downVotes,
  onChange,
}: {
  postId: string;
  upVotes: number;
  downVotes: number;
  onChange?: (next: { upVotes: number; downVotes: number }) => void;
}) {
  const [busy, setBusy] = useState(false);

  const act = async (v: 1 | -1) => {
    if (busy) return;
    setBusy(true);
    try {
      await votePost(postId, "anonymous", v);
      const next =
        v === 1
          ? { upVotes: upVotes + 1, downVotes }
          : { upVotes, downVotes: downVotes + 1 };
      onChange?.(next);
    } catch (e: any) {
      alert(e.message ?? "투표 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3 text-sm">
      <button
        className="px-3 py-1 rounded bg-gray-100 hover:bg-blue-100"
        onClick={() => act(1)}
        disabled={busy}
      >
        ▲ {upVotes}
      </button>
      <button
        className="px-3 py-1 rounded bg-gray-100 hover:bg-red-100"
        onClick={() => act(-1)}
        disabled={busy}
      >
        ▼ {downVotes}
      </button>
    </div>
  );
}
