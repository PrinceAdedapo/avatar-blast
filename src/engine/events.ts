// Event bus for game effects (particles, popups, combos, sounds)
type EffectHandler = (data: Record<string, unknown>) => void;
const listeners = new Map<string, Set<EffectHandler>>();

export function onEffect(event: string, handler: EffectHandler) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(handler);
  return () => { listeners.get(event)?.delete(handler); };
}

export function emitEffect(event: string, data: Record<string, unknown> = {}) {
  listeners.get(event)?.forEach(fn => fn(data));
}
