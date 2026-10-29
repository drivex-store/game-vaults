// NOTE: module id: 927627
import { buildKitTouch, parseFirstTouch, KIT_TOUCH_COOKIE } from '@/libs/auth/serialize'; // NOTE: module id: 660219

export const STARTER_PROMPT_KEY = "anm_starter_prompt_dismissed_v1";

export function readSubscriberId() {
  if (typeof document === "undefined") return null;
  
  let touchId = buildKitTouch({
    getParam: (param) => new URLSearchParams(window.location.search).get(param)
  })?.id;
  
  if (touchId) return touchId;
  
  let kitCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${KIT_TOUCH_COOKIE}=`))
    ?.slice(KIT_TOUCH_COOKIE.length + 1);
    
  return parseFirstTouch(kitCookie)?.id || null;
}

export function suppressStarterPrompt() {
  try {
    window.localStorage.setItem(STARTER_PROMPT_KEY, String(Date.now()));
  } catch (error) {
    // Ignore localStorage errors
  }
}
