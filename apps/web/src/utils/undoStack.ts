/* @file apps/web/src/utils/undoStack.ts */
export type UndoItem<T> = {
  /** do action payload snapshot (for redo) */
  next: T;
  /** undo action payload snapshot (for undo) */
  prev: T;
  /** apply function */
  apply: (state: T) => void;
};

export class UndoStack<T> {
  private stack: UndoItem<T>[] = [];
  private redoStack: UndoItem<T>[] = [];

  get canUndo() {
    return this.stack.length > 0;
  }
  get canRedo() {
    return this.redoStack.length > 0;
  }

  /** Push a state transition {prev -> next} */
  push(item: UndoItem<T>) {
    this.stack.push(item);
    this.redoStack.length = 0;
  }

  undo() {
    const it = this.stack.pop();
    if (!it) return;
    it.apply(it.prev);
    this.redoStack.push(it);
  }

  redo() {
    const it = this.redoStack.pop();
    if (!it) return;
    it.apply(it.next);
    this.stack.push(it);
  }
}

/**
 * Timed undo helper for "delete with snackbar undo".
 * Calls onApply(next) immediately. If user calls cancel() within windowMs, it reverts to prev.
 */
export function scheduleUndo<T>(
  prev: T,
  next: T,
  onApply: (state: T) => void,
  windowMs = 5000
) {
  let cancelled = false;
  onApply(next);
  const timer = window.setTimeout(() => {
    // commit. nothing to do if not cancelled
  }, windowMs);

  return {
    cancel() {
      if (cancelled) return;
      cancelled = true;
      window.clearTimeout(timer);
      onApply(prev);
    },
  };
}
