import { Phone } from "lucide-react";
import { Agent, getAgentColor } from "./OfficeFloorTypes";
import { CallRingAnimation, SpeechBubble } from "./OfficeFloorAnimations";

// ピクセルアート風キャラクター
export const PixelCharacter = ({
  agent,
  isActive,
  isOnCall,
  onClick
}: {
  agent: Agent;
  isActive: boolean;
  isOnCall: boolean;
  onClick: () => void;
}) => {
  const color = agent.icon_color || getAgentColor(agent.id);

  // アニメーション遅延用のシード
  const animDelay = agent.id.charCodeAt(0) % 5 * 0.2;

  // アイドル状態でも breathing アニメーションを適用（active より遅いレート）
  // active: animate-breathing (4s), idle: animate-[breathing_4s_ease-in-out_infinite] (同レートだが常時適用)
  const bodyAnimClass = isOnCall
    ? 'animate-breathing'
    : isActive
    ? 'animate-breathing'
    : 'animate-[breathing_4s_ease-in-out_infinite]';

  return <button onClick={onClick} className="relative group cursor-pointer focus:outline-none hover:scale-105 transition-transform duration-200" title={agent.name}>
      {/* 通話中リングアニメーション */}
      {isOnCall && <CallRingAnimation />}

      {/* 会話中吹き出し */}
      <SpeechBubble isActive={isActive} isOnCall={isOnCall} />

      {/* キャラクター本体 */}
      <div className={`relative ${bodyAnimClass} ${isOnCall ? 'z-10' : ''}`} style={{
        imageRendering: 'pixelated' as const,
        animationDelay: `${animDelay}s`
      }}>
        <svg viewBox="0 0 24 32" className="w-8 h-10 sm:w-10 sm:h-12 drop-shadow-md">
          {/* 頭 */}
          <rect x="6" y="2" width="12" height="10" fill={color} />
          {/* 目 - 稼働中は瞬きアニメーション、通話中はより速い */}
          <rect x="8" y="4" width="3" height="3" fill="white" />
          <rect x="13" y="4" width="3" height="3" fill="white" />
          <rect x="9" y="5" width="1" height="1" fill="black" className={isOnCall ? "animate-[typing_0.5s_ease-in-out_infinite]" : isActive ? "animate-[typing_2s_ease-in-out_infinite]" : ""} />
          <rect x="14" y="5" width="1" height="1" fill="black" className={isOnCall ? "animate-[typing_0.5s_ease-in-out_infinite]" : isActive ? "animate-[typing_2s_ease-in-out_infinite]" : ""} />
          {/* 口 - 通話中は激しく会話アニメーション */}
          <rect x="9" y="9" width="6" height="1" fill={isActive ? "#22c55e" : "#666"} className={isOnCall ? "animate-[typing_0.15s_ease-in-out_infinite]" : isActive ? "animate-[typing_0.3s_ease-in-out_infinite]" : ""} />
          {/* アンテナ */}
          <rect x="11" y="0" width="2" height="2" fill={color} />
          <rect x="11.5" y="-1" width="1" height="1" fill={isActive ? "#22c55e" : "#666"} className={isOnCall ? "animate-[headset-glow_0.5s_ease-in-out_infinite]" : isActive ? "animate-headset-glow" : ""} />
          {/* 体 */}
          <rect x="7" y="12" width="10" height="8" fill={color} opacity="0.85" />
          <rect x="8" y="14" width="3" height="2" fill="white" opacity="0.3" />
          <rect x="13" y="14" width="3" height="2" fill="white" opacity="0.3" />
          {/* 腕 - 通話中はより活発にタイピング */}
          <g className={isOnCall ? "animate-[arm-typing_0.15s_ease-in-out_infinite]" : isActive ? "animate-arm-typing" : ""}>
            <rect x="4" y="13" width="3" height="6" fill={color} opacity="0.7" />
          </g>
          <g className={isOnCall ? "animate-[arm-typing_0.15s_ease-in-out_infinite]" : isActive ? "animate-arm-typing" : ""} style={{
            animationDelay: '0.075s'
          }}>
            <rect x="17" y="13" width="3" height="6" fill={color} opacity="0.7" />
          </g>
          {/* 脚 */}
          <rect x="8" y="20" width="3" height="4" fill={color} opacity="0.7" />
          <rect x="13" y="20" width="3" height="4" fill={color} opacity="0.7" />
          {/* ヘッドセット - 通話中は強く光る */}
          <rect x="5" y="5" width="2" height="4" fill="#333" />
          <rect x="17" y="5" width="2" height="4" fill="#333" />
          <rect x="4" y="7" width="2" height="3" fill={isOnCall ? "#4ade80" : isActive ? "#22c55e" : "#666"} className={isOnCall ? "animate-[headset-glow_0.3s_ease-in-out_infinite]" : isActive ? "animate-headset-glow" : ""} />
        </svg>

        {/* 通話中/稼働中インジケーター */}
        {isOnCall ? (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-glow-pulse border-2 border-background flex items-center justify-center">
            <Phone className="w-2 h-2 text-white animate-phone-bounce" />
          </div>
        ) : isActive && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-background" />
        )}
      </div>

      {/* 名前タグ */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shadow-md border backdrop-blur-sm ${
          isOnCall ? 'bg-green-500 border-green-400 text-white animate-pulse' :
          isActive ? 'bg-green-500/90 border-green-400 text-white' :
          'bg-background border-border text-foreground'
        }`}>
          {isOnCall ? '📞 通話中' : agent.name.length > 6 ? agent.name.slice(0, 6) + '...' : agent.name}
        </span>
      </div>
    </button>;
};
