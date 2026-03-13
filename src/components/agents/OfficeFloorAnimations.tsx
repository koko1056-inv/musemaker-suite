import { Phone } from "lucide-react";

// 通話中リングアニメーション
export const CallRingAnimation = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    <div className="absolute w-12 h-12 rounded-full border-2 border-green-500 animate-call-ring" />
    <div className="absolute w-12 h-12 rounded-full border-2 border-green-500 animate-call-ring" style={{ animationDelay: '0.5s' }} />
    <div className="absolute w-12 h-12 rounded-full border-2 border-green-500 animate-call-ring" style={{ animationDelay: '1s' }} />
  </div>
);

// 音波アニメーション
export const SoundWaveAnimation = () => (
  <div className="flex items-end gap-0.5 h-4">
    {[0, 1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="w-1 bg-green-500 rounded-full animate-sound-wave"
        style={{
          animationDelay: `${i * 0.1}s`,
          height: '100%'
        }}
      />
    ))}
  </div>
);

// 通話中電話アイコン
export const CallingPhoneIcon = () => (
  <div className="animate-phone-bounce">
    <Phone className="w-3 h-3 text-green-500" />
  </div>
);

// タイピングアニメーション（モニター用）
export const TypingAnimation = () => <g className="animate-typing">
    <rect x="15" y="-3" width="2" height="1" fill="#333" />
    <rect x="18" y="-3" width="3" height="1" fill="#333" />
    <rect x="22" y="-3" width="1" height="1" fill="#333" />
    <rect x="15" y="-1.5" width="4" height="1" fill="#333" />
    <rect x="20" y="-1.5" width="2" height="1" fill="#333" />
  </g>;

// 吹き出し（通話中表示）
export const SpeechBubble = ({
  isActive,
  isOnCall
}: {
  isActive: boolean;
  isOnCall: boolean;
}) => {
  if (!isActive) return null;
  return (
    <div className="absolute -top-7 left-1/2 -translate-x-1/2 animate-float z-20">
      {isOnCall ? (
        <div className="flex items-center gap-1 px-2 py-1 bg-green-500 rounded-full shadow-lg animate-glow-pulse">
          <CallingPhoneIcon />
          <SoundWaveAnimation />
        </div>
      ) : (
        <div className="flex items-center gap-1 px-2 py-1 bg-green-500/80 rounded-full shadow-md">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <span className="text-[8px] text-white font-medium">待機中</span>
        </div>
      )}
    </div>
  );
};
