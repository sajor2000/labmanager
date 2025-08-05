import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Theme } from "@/types";

interface UIState {
  // Sidebar state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Search
  searchQuery: string;
  isSearchOpen: boolean;
  setSearchQuery: (query: string) => void;
  setSearchOpen: (open: boolean) => void;

  // Modals
  modals: {
    createStudy: boolean;
    createTask: boolean;
    createIdea: boolean;
    userProfile: boolean;
  };
  openModal: (modal: keyof UIState["modals"]) => void;
  closeModal: (modal: keyof UIState["modals"]) => void;

  // Current lab
  currentLabId: string | null;
  setCurrentLab: (labId: string) => void;

  // View preferences
  viewPreferences: {
    studiesView: "grid" | "list" | "table" | "timeline";
    tasksView: "board" | "list" | "calendar";
    showCompletedTasks: boolean;
    cardSize: "small" | "medium" | "large";
  };
  setViewPreference: <K extends keyof UIState["viewPreferences"]>(
    key: K,
    value: UIState["viewPreferences"][K]
  ) => void;

  // Notifications
  notificationCount: number;
  incrementNotifications: () => void;
  resetNotifications: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        // Sidebar
        sidebarCollapsed: false,
        toggleSidebar: () =>
          set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

        // Theme
        theme: "system",
        setTheme: (theme) => set({ theme }),

        // Search
        searchQuery: "",
        isSearchOpen: false,
        setSearchQuery: (query) => set({ searchQuery: query }),
        setSearchOpen: (open) => set({ isSearchOpen: open }),

        // Modals
        modals: {
          createStudy: false,
          createTask: false,
          createIdea: false,
          userProfile: false,
        },
        openModal: (modal) =>
          set((state) => ({
            modals: { ...state.modals, [modal]: true },
          })),
        closeModal: (modal) =>
          set((state) => ({
            modals: { ...state.modals, [modal]: false },
          })),

        // Current lab
        currentLabId: null,
        setCurrentLab: (labId) => set({ currentLabId: labId }),

        // View preferences
        viewPreferences: {
          studiesView: "grid",
          tasksView: "board",
          showCompletedTasks: true,
          cardSize: "medium",
        },
        setViewPreference: (key, value) =>
          set((state) => ({
            viewPreferences: {
              ...state.viewPreferences,
              [key]: value,
            },
          })),

        // Notifications
        notificationCount: 0,
        incrementNotifications: () =>
          set((state) => ({ notificationCount: state.notificationCount + 1 })),
        resetNotifications: () => set({ notificationCount: 0 }),
      }),
      {
        name: "ui-storage",
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
          viewPreferences: state.viewPreferences,
          currentLabId: state.currentLabId,
        }),
      }
    )
  )
);

// Keyboard shortcuts hook
export const useKeyboardShortcuts = () => {
  const { setSearchOpen, openModal } = useUIStore();

  if (typeof window !== "undefined") {
    window.addEventListener("keydown", (e) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }

      // Cmd/Ctrl + N for new study
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        openModal("createStudy");
      }

      // Cmd/Ctrl + T for new task
      if ((e.metaKey || e.ctrlKey) && e.key === "t") {
        e.preventDefault();
        openModal("createTask");
      }
    });
  }
};