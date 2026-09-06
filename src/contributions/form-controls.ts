export interface FormControls {
  setPending(pending: boolean): void;
  showRemoteError(message: string): void;
  clearRemoteError(): void;
}

const INPUT_SELECTOR = ".username-form__input";
const BUTTON_SELECTOR = ".username-form__button";
const ERROR_SELECTOR = ".username-form__error";
const PENDING_CLASS = "username-form__button--pending";

export function attachFormControls(form: HTMLFormElement): FormControls {
  const input = form.querySelector<HTMLInputElement>(INPUT_SELECTOR);
  const button = form.querySelector<HTMLButtonElement>(BUTTON_SELECTOR);
  const error = form.querySelector<HTMLElement>(ERROR_SELECTOR);
  if (!input || !button || !error) {
    throw new Error("username form is missing the input, button, or error element");
  }

  let pending = false;

  // Runs after the form's own input listener, which re-enables the button on every keystroke.
  input.addEventListener("input", () => {
    if (pending) button.disabled = true;
  });

  return {
    setPending(next: boolean): void {
      pending = next;
      button.disabled = next ? true : input.value === "";
      button.classList.toggle(PENDING_CLASS, next);
      if (next) button.setAttribute("aria-busy", "true");
      else button.removeAttribute("aria-busy");
    },

    showRemoteError(message: string): void {
      error.textContent = message;
    },

    clearRemoteError(): void {
      error.textContent = "";
    },
  };
}
