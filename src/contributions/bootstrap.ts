import type { Shell } from "../app";
import { mountUsernameForm } from "../username-form";
import { createContributionController } from "./controller";
import { attachFormControls } from "./form-controls";

export function mountContributionRetrieval(shell: Shell): void {
  let submit: ((username: string) => void) | null = null;

  const form = mountUsernameForm(shell, (username) => submit?.(username));
  const controller = createContributionController(shell, attachFormControls(form));

  submit = controller.handleUsernameSubmit;
}
