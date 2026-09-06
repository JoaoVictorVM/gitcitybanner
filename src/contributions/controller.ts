import type { Shell } from "../app";
import { getLocale } from "../i18n/locale";
import { fetchContributions } from "./client";
import type { FormControls } from "./form-controls";
import { resolveErrorMessage } from "./messages";
import { setContributionModel } from "./session";
import { ContributionFetchError } from "./types";
import type { ContributionModel } from "./types";

export const PREVIEW_PENDING_CLASS = "preview--pending";

export type ContributionResultHandler = (model: ContributionModel) => void;

export interface ContributionController {
  handleUsernameSubmit(username: string): void;
}

function warnMissingConsumer(model: ContributionModel): void {
  console.warn(`[gitcitybanner] no onResult consumer wired; holding model for "${model.username}"`);
}

function toFetchError(error: unknown): ContributionFetchError {
  return error instanceof ContributionFetchError
    ? error
    : new ContributionFetchError("NETWORK_OR_TIMEOUT");
}

export function createContributionController(
  shell: Shell,
  formControls: FormControls,
  onResult: ContributionResultHandler = warnMissingConsumer,
): ContributionController {
  let generation = 0;
  let inFlight: AbortController | null = null;

  function settle(): void {
    inFlight = null;
    formControls.setPending(false);
    shell.preview.classList.remove(PREVIEW_PENDING_CLASS);
  }

  function handleUsernameSubmit(username: string): void {
    inFlight?.abort();

    const controller = new AbortController();
    const token = (generation += 1);
    inFlight = controller;

    formControls.clearRemoteError();
    formControls.setPending(true);
    shell.preview.classList.add(PREVIEW_PENDING_CLASS);

    fetchContributions(username, controller.signal).then(
      (model) => {
        if (token !== generation) return;
        settle();
        setContributionModel(model);
        onResult(model);
      },
      (error: unknown) => {
        if (token !== generation) return;
        settle();
        formControls.showRemoteError(resolveErrorMessage(toFetchError(error), getLocale()));
      },
    );
  }

  return { handleUsernameSubmit };
}
