import type { Shell } from "../app";
import { getLocale } from "../i18n/locale";
import { mountUsernameForm } from "../username-form";
import { createContributionController } from "./controller";
import { attachFormControls } from "./form-controls";
import { renderPreview } from "./preview";

export function mountContributionRetrieval(shell: Shell): void {
  let submit: ((username: string) => void) | null = null;

  const form = mountUsernameForm(shell, (username) => submit?.(username));
  const controller = createContributionController(shell, attachFormControls(form), (model) =>
    renderPreview(shell, model, getLocale()),
  );

  submit = controller.handleUsernameSubmit;
}
