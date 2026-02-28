"use client";

import {
  createContext,
  useCallback,
  useContext,
  useReducer,
  useRef,
} from "react";
import {
  BrandingSettings,
  DEFAULT_BRANDING,
  saveBranding,
  saveLabel,
  deleteLabel,
} from "@/lib/api/branding";

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
type Action =
  | { type: "LOAD"; payload: BrandingSettings }
  | { type: "SET_FIELD"; key: keyof BrandingSettings; value: unknown }
  | { type: "SET_LABEL"; labelKey: string; value: string }
  | { type: "RESET_LABEL"; labelKey: string }
  | { type: "SET_SAVE_STATUS"; status: SaveStatus };

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface BrandingState {
  settings: BrandingSettings;
  saveStatus: SaveStatus;
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
function reducer(state: BrandingState, action: Action): BrandingState {
  switch (action.type) {
    case "LOAD":
      return { ...state, settings: action.payload };

    case "SET_FIELD":
      return {
        ...state,
        settings: { ...state.settings, [action.key]: action.value },
      };

    case "SET_LABEL":
      return {
        ...state,
        settings: {
          ...state.settings,
          labels: { ...state.settings.labels, [action.labelKey]: action.value },
        },
      };

    case "RESET_LABEL": {
      const { [action.labelKey]: _removed, ...remaining } =
        state.settings.labels;
      void _removed;
      return {
        ...state,
        settings: { ...state.settings, labels: remaining },
      };
    }

    case "SET_SAVE_STATUS":
      return { ...state, saveStatus: action.status };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface BrandingContextValue {
  state: BrandingState;
  /** Load full branding from API response */
  load: (branding: BrandingSettings) => void;
  /** Update a single top-level branding field and trigger auto-save (debounced) */
  setField: (key: keyof BrandingSettings, value: unknown) => void;
  /** Update a single top-level field and immediately save (no debounce – for toggles & colour picks) */
  setFieldImmediate: (key: keyof BrandingSettings, value: unknown) => void;
  /** Update a custom label immediately */
  setLabel: (labelKey: string, value: string) => void;
  /** Reset a label to its default */
  resetLabel: (labelKey: string) => void;
  /** Get the display value for a label (custom or default) */
  getLabel: (labelKey: string, defaultValue: string) => string;
}

const BrandingCtx = createContext<BrandingContextValue>({
  state: { settings: DEFAULT_BRANDING, saveStatus: "idle" },
  load: () => {},
  setField: () => {},
  setFieldImmediate: () => {},
  setLabel: () => {},
  resetLabel: () => {},
  getLabel: (_key, def) => def,
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    settings: DEFAULT_BRANDING,
    saveStatus: "idle",
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Partial<BrandingSettings>>({});

  const triggerSave = useCallback(async (patch: Partial<BrandingSettings>) => {
    dispatch({ type: "SET_SAVE_STATUS", status: "saving" });
    try {
      await saveBranding(patch);
      dispatch({ type: "SET_SAVE_STATUS", status: "saved" });
      setTimeout(
        () => dispatch({ type: "SET_SAVE_STATUS", status: "idle" }),
        3000
      );
    } catch {
      dispatch({ type: "SET_SAVE_STATUS", status: "error" });
    }
  }, []);

  const load = useCallback((branding: BrandingSettings) => {
    dispatch({ type: "LOAD", payload: branding });
  }, []);

  const setField = useCallback(
    (key: keyof BrandingSettings, value: unknown) => {
      dispatch({ type: "SET_FIELD", key, value });
      // Accumulate changes
      pendingRef.current = {
        ...pendingRef.current,
        [key]: value,
      } as Partial<BrandingSettings>;
      // Debounce 800ms
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        triggerSave(pendingRef.current);
        pendingRef.current = {};
      }, 800);
    },
    [triggerSave]
  );

  const setFieldImmediate = useCallback(
    (key: keyof BrandingSettings, value: unknown) => {
      dispatch({ type: "SET_FIELD", key, value });
      if (debounceRef.current) clearTimeout(debounceRef.current);
      pendingRef.current = {};
      triggerSave({ [key]: value } as Partial<BrandingSettings>);
    },
    [triggerSave]
  );

  const setLabel = useCallback(
    async (labelKey: string, value: string) => {
      dispatch({ type: "SET_LABEL", labelKey, value });
      dispatch({ type: "SET_SAVE_STATUS", status: "saving" });
      try {
        await saveLabel(labelKey, value);
        dispatch({ type: "SET_SAVE_STATUS", status: "saved" });
        setTimeout(
          () => dispatch({ type: "SET_SAVE_STATUS", status: "idle" }),
          3000
        );
      } catch {
        dispatch({ type: "SET_SAVE_STATUS", status: "error" });
      }
    },
    []
  );

  const resetLabel = useCallback(
    async (labelKey: string) => {
      dispatch({ type: "RESET_LABEL", labelKey });
      dispatch({ type: "SET_SAVE_STATUS", status: "saving" });
      try {
        await deleteLabel(labelKey);
        dispatch({ type: "SET_SAVE_STATUS", status: "saved" });
        setTimeout(
          () => dispatch({ type: "SET_SAVE_STATUS", status: "idle" }),
          3000
        );
      } catch {
        dispatch({ type: "SET_SAVE_STATUS", status: "error" });
      }
    },
    []
  );

  const getLabel = useCallback(
    (labelKey: string, defaultValue: string) => {
      return state.settings.labels[labelKey] ?? defaultValue;
    },
    [state.settings.labels]
  );

  return (
    <BrandingCtx.Provider
      value={{ state, load, setField, setFieldImmediate, setLabel, resetLabel, getLabel }}
    >
      {children}
    </BrandingCtx.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingCtx);
}
