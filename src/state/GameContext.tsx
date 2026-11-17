import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { initialState, performPull, forgetFresh, type GameState, type Presentation } from "@/game/logic";
import { clearGame, loadGame, saveGame } from "@/game/storage";
import { buzz, initFeedback, playSound } from "@/game/feedback";

export type Phase = "idle" | "shake" | "pop" | "reveal";

export type Overlay =
  | null
  | { kind: "settings" }
  | { kind: "rates" }
  | { kind: "reset" }
  | { kind: "detail"; creatureId: string }
  | { kind: "color"; colorId: string };

type GameContextValue = {
  ready: boolean;
  saveError: string | null;
  state: GameState;
  phase: Phase;
  presentation: Presentation | null;
  fontsOn: boolean;
  now: number;
  overlay: Overlay;
  setOverlay: (overlay: Overlay) => void;
  openBox: () => void;
  skipAnimation: () => void;
  dismissReveal: () => void;
  openAnother: () => void;
  setSound: (on: boolean) => void;
  setHaptics: (on: boolean) => void;
  resetGame: () => void;
  markSeen: (creatureId?: string, colorId?: string) => void;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children, fontsOn }: { children: ReactNode; fontsOn: boolean }) {
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [state, setState] = useState<GameState>(initialState);
  const [phase, setPhase] = useState<Phase>("idle");
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [now, setNow] = useState(() => Date.now());

  const stateRef = useRef(state);
  const phaseRef = useRef(phase);
  const presentationRef = useRef(presentation);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  stateRef.current = state;
  phaseRef.current = phase;
  presentationRef.current = presentation;

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    void initFeedback();
    void loadGame().then((loaded) => {
      if (cancelled) return;
      setState(loaded.state);
      setSaveError(loaded.error);
      setReady(true);
    });
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancelled = true;
      clearInterval(clock);
      clearTimers();
    };
  }, [clearTimers]);

  useEffect(() => {
    if (!ready) return;
    const handle = setTimeout(() => {
      void saveGame(stateRef.current).catch(() => undefined);
    }, 180);
    return () => clearTimeout(handle);
  }, [state, ready]);

  const playReveal = useCallback((card: Presentation) => {
    const prefs = stateRef.current;
    const duplicate = !card.isNewCreature && !card.isNewPose && !card.isNewColor;
    const sound =
      card.tier === "legendary" ? "legendary" : card.tier === "epic" ? "epic" : duplicate ? "dupe" : "sparkle";
    playSound(sound, prefs.soundOn);
    if (!duplicate && card.tier !== "common") {
      setTimeout(() => playSound(card.isNewCreature ? "sparkle" : "dupe", stateRef.current.soundOn), 280);
    } else if (duplicate && card.tier === "legendary") {
      setTimeout(() => playSound("dupe", stateRef.current.soundOn), 360);
    }
    void buzz(card.tier === "legendary" || card.isNewCreature ? "success" : "selection", prefs.hapticsOn);
  }, []);

  const openBox = useCallback(() => {
    if (phaseRef.current === "shake" || phaseRef.current === "pop") return;
    const outcome = performPull(stateRef.current, Math.random, Date.now());
    if (!outcome) {
      playSound("ui", stateRef.current.soundOn);
      return;
    }
    clearTimers();
    setState(outcome.state);
    setPresentation(outcome.presentation);
    presentationRef.current = outcome.presentation;
    phaseRef.current = "shake";
    setPhase("shake");
    setOverlay(null);
    playSound("shake", outcome.state.soundOn);
    void buzz("light", outcome.state.hapticsOn);

    timers.current.push(
      setTimeout(() => {
        phaseRef.current = "pop";
        setPhase("pop");
        playSound("pop", stateRef.current.soundOn);
        void buzz("medium", stateRef.current.hapticsOn);
      }, 880),
    );
    timers.current.push(
      setTimeout(() => {
        phaseRef.current = "reveal";
        setPhase("reveal");
        const card = presentationRef.current;
        if (card) playReveal(card);
      }, 1280),
    );
  }, [clearTimers, playReveal]);

  const skipAnimation = useCallback(() => {
    if (phaseRef.current !== "shake" && phaseRef.current !== "pop") return;
    clearTimers();
    phaseRef.current = "reveal";
    setPhase("reveal");
    const card = presentationRef.current;
    if (card) playReveal(card);
  }, [clearTimers, playReveal]);

  const dismissReveal = useCallback(() => {
    clearTimers();
    phaseRef.current = "idle";
    setPhase("idle");
  }, [clearTimers]);

  const openAnother = useCallback(() => {
    clearTimers();
    phaseRef.current = "idle";
    setPhase("idle");
    openBox();
  }, [clearTimers, openBox]);

  const setSound = useCallback((on: boolean) => {
    setState((current) => ({ ...current, soundOn: on }));
    if (on) playSound("ui", true);
  }, []);

  const setHaptics = useCallback((on: boolean) => {
    setState((current) => ({ ...current, hapticsOn: on }));
    if (on) void buzz("selection", true);
  }, []);

  const resetGame = useCallback(() => {
    clearTimers();
    phaseRef.current = "idle";
    setPhase("idle");
    setPresentation(null);
    setOverlay(null);
    const fresh = initialState();
    setState(fresh);
    void clearGame();
  }, [clearTimers]);

  const markSeen = useCallback((creatureId?: string, colorId?: string) => {
    const keys = [
      creatureId ? `c:${creatureId}` : "",
      creatureId ? `p:${creatureId}:1` : "",
      creatureId ? `p:${creatureId}:2` : "",
      colorId ? `m:${colorId}` : "",
    ].filter(Boolean);
    setState((current) => forgetFresh(current, keys));
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({
      ready,
      saveError,
      state,
      phase,
      presentation,
      fontsOn,
      now,
      overlay,
      setOverlay,
      openBox,
      skipAnimation,
      dismissReveal,
      openAnother,
      setSound,
      setHaptics,
      resetGame,
      markSeen,
    }),
    [
      ready,
      saveError,
      state,
      phase,
      presentation,
      fontsOn,
      now,
      overlay,
      openBox,
      skipAnimation,
      dismissReveal,
      openAnother,
      setSound,
      setHaptics,
      resetGame,
      markSeen,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const value = useContext(GameContext);
  if (!value) throw new Error("useGame must be used inside GameProvider");
  return value;
}

export function useType() {
  const { fontsOn } = useGame();
  return {
    display: fontsOn ? "Fredoka_700Bold" : undefined,
    title: fontsOn ? "Fredoka_600SemiBold" : undefined,
    body: fontsOn ? "Nunito_700Bold" : undefined,
    strong: fontsOn ? "Nunito_800ExtraBold" : undefined,
  };
}
