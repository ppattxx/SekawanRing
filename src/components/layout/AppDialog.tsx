import { useEffect, useMemo, useState } from "react";
import { useDialogStore } from "../../store/useDialogStore";

const toneMap: Record<string, { icon: string; iconBg: string; iconColor: string }> = {
  info: { icon: "i", iconBg: "bg-blue-100", iconColor: "text-blue-700" },
  success: { icon: "✓", iconBg: "bg-emerald-100", iconColor: "text-emerald-700" },
  warning: { icon: "!", iconBg: "bg-amber-100", iconColor: "text-amber-700" },
  danger: { icon: "×", iconBg: "bg-red-100", iconColor: "text-red-700" },
};

export default function AppDialog() {
  const { dialog, resolver, closeDialog } = useDialogStore();
  const [promptValue, setPromptValue] = useState("");

  useEffect(() => {
    setPromptValue(dialog?.defaultValue || "");
  }, [dialog]);

  const tone = useMemo(() => {
    return toneMap[dialog?.tone || "info"] || toneMap.info;
  }, [dialog?.tone]);

  if (!dialog) return null;

  const finish = (value: unknown) => {
    if (resolver) resolver(value);
    closeDialog();
  };

  const title = dialog.title || "Notifikasi";
  const confirmText = dialog.confirmText || "OK";
  const cancelText = dialog.cancelText || "Batal";

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup"
        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
        onClick={() => {
          if (dialog.type === "alert") {
            finish(undefined);
          } else {
            finish(dialog.type === "confirm" ? false : null);
          }
        }}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_24px_60px_rgba(0,0,0,0.2)]">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black ${tone.iconBg} ${tone.iconColor}`}>
            {tone.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-black text-plant-dark">{title}</h3>
            <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{dialog.message}</p>
          </div>
        </div>

        {dialog.type === "prompt" && (
          <input
            type="text"
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            placeholder={dialog.placeholder || "Ketik di sini..."}
            className="mt-4 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-plant-green focus:border-plant-green"
            autoFocus
          />
        )}

        <div className="mt-5 flex justify-end gap-2">
          {dialog.type !== "alert" && (
            <button
              type="button"
              onClick={() => finish(dialog.type === "confirm" ? false : null)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (dialog.type === "confirm") {
                finish(true);
                return;
              }
              if (dialog.type === "prompt") {
                finish(promptValue.trim() ? promptValue.trim() : null);
                return;
              }
              finish(undefined);
            }}
            className="px-4 py-2 rounded-lg bg-plant-green text-white hover:bg-green-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
