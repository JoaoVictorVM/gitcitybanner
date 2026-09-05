import type { Shell } from "./app";
import { t } from "./i18n/locale";
import { normalizeUsername } from "./username/normalize";
import { isValidUsername } from "./username/validate";

export type ValidUsernameHandler = (username: string) => void;

const INPUT_ID = "username";
const ERROR_ID = "username-error";

function warnMissingConsumer(username: string): void {
  console.warn(`[gitcitybanner] no onValidUsername consumer wired; dropping "${username}"`);
}

export function mountUsernameForm(
  shell: Shell,
  onValidUsername: ValidUsernameHandler = warnMissingConsumer,
): HTMLFormElement {
  const form = document.createElement("form");
  form.className = "username-form";
  form.noValidate = true;

  const label = document.createElement("label");
  label.className = "username-form__label";
  label.htmlFor = INPUT_ID;
  label.textContent = t("usernameLabel");

  const row = document.createElement("div");
  row.className = "username-form__row";

  const input = document.createElement("input");
  input.className = "username-form__input";
  input.id = INPUT_ID;
  input.type = "text";
  input.name = "username";
  input.maxLength = 39;
  input.autocomplete = "off";
  input.spellcheck = false;
  input.placeholder = t("usernamePlaceholder");
  input.setAttribute("aria-describedby", ERROR_ID);

  const button = document.createElement("button");
  button.className = "username-form__button";
  button.type = "submit";
  button.disabled = true;
  button.textContent = t("generateButtonLabel");

  const error = document.createElement("p");
  error.className = "username-form__error";
  error.id = ERROR_ID;
  error.setAttribute("aria-live", "polite");

  row.append(input, button);
  form.append(label, row, error);

  function clearError(): void {
    if (!error.textContent) return;
    error.textContent = "";
    input.removeAttribute("aria-invalid");
  }

  function showError(): void {
    error.textContent = t("invalidUsernameMessage");
    input.setAttribute("aria-invalid", "true");
    input.focus();
  }

  function submit(): void {
    const username = normalizeUsername(input.value);
    if (!isValidUsername(username)) {
      showError();
      return;
    }
    clearError();
    onValidUsername(username);
  }

  input.addEventListener("input", () => {
    button.disabled = input.value === "";
    clearError();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    submit();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submit();
  });

  shell.root.append(form);
  input.focus();

  return form;
}
