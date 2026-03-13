import { Plus } from "lucide-react";
import { Agent } from "./OfficeFloorTypes";
import { PixelCharacter } from "./PixelCharacter";

// デスク（座席）コンポーネント
export const Desk = ({
  hasAgent,
  agent,
  isActive,
  isOnCall,
  onClick,
  onAddAgent,
  folderId
}: {
  hasAgent: boolean;
  agent?: Agent;
  isActive: boolean;
  isOnCall: boolean;
  onClick?: () => void;
  onAddAgent?: () => void;
  folderId?: string;
}) => {
  return <div className="relative flex flex-col items-center">
      {/* エージェントキャラクター */}
      <div className="h-14 flex items-end justify-center">
        {hasAgent && agent ? <PixelCharacter agent={agent} isActive={isActive} isOnCall={isOnCall} onClick={onClick!} /> : <button onClick={onAddAgent} className="w-8 h-10 sm:w-10 sm:h-12 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity rounded border-2 border-dashed border-muted-foreground/50 hover:border-primary">
            <Plus className="w-4 h-4 text-muted-foreground" />
          </button>}
      </div>

      {/* デスク */}
      <div className="mt-2" style={{
      imageRendering: 'pixelated' as const
    }}>
        <svg viewBox="0 0 40 20" className="w-12 h-6 sm:w-14 sm:h-7">
          {/* デスク天板 */}
          <rect x="2" y="0" width="36" height="8" fill="#8B7355" />
          <rect x="4" y="2" width="32" height="4" fill="#A08060" />
          {/* モニター - 通話中はより明るく */}
          <rect x="12" y="-6" width="16" height="10" fill="#333" />
          <rect x="14" y="-4" width="12" height="6" fill={hasAgent && isOnCall ? "#86efac" : hasAgent && isActive ? "#a8e6cf" : "#555"} className={hasAgent && isOnCall ? "animate-[screen-flicker_0.5s_ease-in-out_infinite]" : hasAgent && isActive ? "animate-screen-flicker" : ""} />
          {/* モニター内のテキスト/タイピングアニメーション - 通話中はより速い */}
          {hasAgent && isActive && <g className={isOnCall ? "animate-[typing_0.1s_ease-in-out_infinite]" : "animate-typing"}>
              <rect x="15" y="-3" width="2" height="0.8" fill="#333" />
              <rect x="18" y="-3" width="3" height="0.8" fill="#333" />
              <rect x="22" y="-3" width="1" height="0.8" fill="#333" />
              <rect x="15" y="-1.5" width="4" height="0.8" fill="#333" />
              <rect x="20" y="-1.5" width="2" height="0.8" fill="#333" />
            </g>}
          <rect x="17" y="4" width="6" height="2" fill="#333" />
          {/* キーボード - 通話中はより速くキーが光る */}
          <rect x="14" y="3" width="12" height="3" fill="#444" />
          {hasAgent && isActive && <g>
              <rect x="15" y="3.5" width="1.5" height="1" fill={isOnCall ? "#888" : "#666"} className={isOnCall ? "animate-[typing_0.1s_ease-in-out_infinite]" : "animate-[typing_0.2s_ease-in-out_infinite]"} />
              <rect x="17.5" y="3.5" width="1.5" height="1" fill={isOnCall ? "#888" : "#666"} className={isOnCall ? "animate-[typing_0.1s_ease-in-out_0.05s_infinite]" : "animate-[typing_0.2s_ease-in-out_0.1s_infinite]"} />
              <rect x="20" y="3.5" width="1.5" height="1" fill={isOnCall ? "#888" : "#666"} className={isOnCall ? "animate-[typing_0.1s_ease-in-out_0.1s_infinite]" : "animate-[typing_0.2s_ease-in-out_0.2s_infinite]"} />
              <rect x="22.5" y="3.5" width="1.5" height="1" fill={isOnCall ? "#888" : "#666"} className={isOnCall ? "animate-[typing_0.1s_ease-in-out_0.075s_infinite]" : "animate-[typing_0.2s_ease-in-out_0.15s_infinite]"} />
            </g>}
          {/* デスク脚 */}
          <rect x="4" y="8" width="4" height="10" fill="#6B5344" />
          <rect x="32" y="8" width="4" height="10" fill="#6B5344" />
        </svg>
      </div>
    </div>;
};
