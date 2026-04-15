import { useDialogStore, type DialogPayload } from "../store/useDialogStore";

const openDialogWithPromise = <T>(payload: DialogPayload): Promise<T> => {
  return new Promise<T>((resolve) => {
    useDialogStore.getState().openDialog(payload, resolve as (value: unknown) => void);
  });
};

export const showAlert = async (
  message: string,
  options?: Omit<DialogPayload, "type" | "message">
): Promise<void> => {
  await openDialogWithPromise<void>({
    type: "alert",
    message,
    title: options?.title,
    confirmText: options?.confirmText,
    tone: options?.tone,
  });
};

export const showConfirm = async (
  message: string,
  options?: Omit<DialogPayload, "type" | "message">
): Promise<boolean> => {
  return openDialogWithPromise<boolean>({
    type: "confirm",
    message,
    title: options?.title,
    confirmText: options?.confirmText,
    cancelText: options?.cancelText,
    tone: options?.tone,
  });
};

export const showPrompt = async (
  message: string,
  options?: Omit<DialogPayload, "type" | "message">
): Promise<string | null> => {
  return openDialogWithPromise<string | null>({
    type: "prompt",
    message,
    title: options?.title,
    confirmText: options?.confirmText,
    cancelText: options?.cancelText,
    defaultValue: options?.defaultValue,
    placeholder: options?.placeholder,
    tone: options?.tone,
  });
};
