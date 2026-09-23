import {reactive, readonly} from "vue";

const DEFAULT_DURATION = 5000;
let nextId = 0;
const state = reactive({items: []});
const timers = new Map();

function close(id) {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
  state.items = state.items.filter((item) => item.id !== id);
}

function schedule(item) {
  if (item.duration === Infinity || item.type === "loading") return;
  timers.set(item.id, setTimeout(() => close(item.id), item.duration));
}

function add(options = {}) {
  const item = {
    id: options.id ?? `toast-${++nextId}`,
    title: options.title ?? "",
    description: options.description ?? "",
    type: options.type ?? "default",
    duration: options.duration ?? DEFAULT_DURATION,
    action: options.action ?? null,
    dismissible: options.dismissible ?? true,
  };
  state.items = [...state.items, item].slice(-5);
  schedule(item);
  return item.id;
}

function update(id, options = {}) {
  const index = state.items.findIndex((item) => item.id === id);
  if (index < 0) return;
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
  const item = {...state.items[index], ...options, id};
  state.items[index] = item;
  schedule(item);
}

async function promise(task, messages) {
  const id = add({type: "loading", title: messages.loading, duration: Infinity, dismissible: false});
  try {
    const result = await (typeof task === "function" ? task() : task);
    const success = typeof messages.success === "function" ? messages.success(result) : messages.success;
    update(id, {type: "success", title: success, duration: messages.duration ?? DEFAULT_DURATION, dismissible: true});
    return result;
  } catch (error) {
    const message = typeof messages.error === "function" ? messages.error(error) : messages.error;
    update(id, {type: "error", title: message, duration: messages.duration ?? DEFAULT_DURATION, dismissible: true});
    throw error;
  }
}

export const toast = {add, close, update, promise};
export function useToast() { return toast; }
export const toastState = readonly(state);
