import { create } from 'zustand';
import { AppModule } from '../../../di/AppModule';
import { ApiError } from '../../../core/network/ApiError';
import { User } from '../domain/AuthUseCaseProtocol';

export interface LoginFormState {
  email: string;
  password: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  user: User | null;
}

export interface LoginViewModelActions {
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  submit: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export type LoginViewModel = LoginFormState & LoginViewModelActions;

const initialState: LoginFormState = {
  email: '',
  password: '',
  isSubmitting: false,
  errorMessage: null,
  user: null,
};

/**
 * MVVM ViewModel for the login screen, implemented as a Zustand store.
 *
 * The screen (View) only reads state and calls actions — it holds no
 * business logic. All orchestration (validation, network calls, error
 * mapping) lives here and in the domain layer (`AuthUseCase`), which this
 * store reaches through `AppModule` rather than constructing directly.
 */
export const useLoginViewModel = create<LoginViewModel>((set, get) => ({
  ...initialState,

  setEmail: (email: string) => set({ email, errorMessage: null }),

  setPassword: (password: string) => set({ password, errorMessage: null }),

  clearError: () => set({ errorMessage: null }),

  reset: () => set(initialState),

  submit: async () => {
    const { email, password, isSubmitting } = get();
    if (isSubmitting) return;

    set({ isSubmitting: true, errorMessage: null });

    try {
      const session = await AppModule.authUseCase.login({ email: email.trim(), password });
      set({ isSubmitting: false, user: session.user, errorMessage: null });
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
      set({ isSubmitting: false, errorMessage: message });
    }
  },
}));
