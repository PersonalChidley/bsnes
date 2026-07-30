import type { EmulatorClient } from "./client";
import { SNES_BUTTONS, type SnesButton } from "./protocol";

const MAX_PLAYERS = 2;
const AXIS_DEADZONE = 0.5;

const STANDARD_BUTTONS: ReadonlyArray<
  readonly [buttonIndex: number, snesButton: SnesButton]
> = [
  [0, "b"],
  [1, "a"],
  [2, "y"],
  [3, "x"],
  [4, "l"],
  [5, "r"],
  [8, "select"],
  [9, "start"],
  [12, "up"],
  [13, "down"],
  [14, "left"],
  [15, "right"],
];

export type GamepadAssignment = {
  player: 0 | 1;
  index: number;
  id: string;
  mapping: GamepadMappingType;
};

type AssignmentHandler = (assignments: GamepadAssignment[]) => void;

export class GamepadInput {
  private animationFrame: number | null = null;
  private enabled = false;
  private focused = true;
  private assignmentSignature = "";
  private readonly pressedButtons = Array.from(
    { length: MAX_PLAYERS },
    () => new Set<SnesButton>(),
  );

  constructor(
    private readonly client: EmulatorClient,
    private readonly onAssignments: AssignmentHandler,
  ) {}

  start() {
    if (this.animationFrame !== null) return;
    this.focused = document.visibilityState === "visible" && document.hasFocus();
    window.addEventListener("blur", this.handleBlur);
    window.addEventListener("focus", this.handleFocus);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    this.animationFrame = window.requestAnimationFrame(this.poll);
  }

  setEnabled(enabled: boolean) {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    this.releaseButtons();
  }

  resync() {
    this.client.syncButtons();
  }

  destroy() {
    if (this.animationFrame !== null) {
      window.cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    window.removeEventListener("blur", this.handleBlur);
    window.removeEventListener("focus", this.handleFocus);
    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );
    this.releaseButtons();
  }

  private readonly poll = () => {
    const gamepads =
      typeof navigator.getGamepads === "function"
        ? Array.from(navigator.getGamepads())
            .filter(
              (gamepad): gamepad is Gamepad =>
                gamepad !== null && gamepad.connected,
            )
            .sort((left, right) => left.index - right.index)
            .slice(0, MAX_PLAYERS)
        : [];

    this.updateAssignments(gamepads);
    if (this.enabled && this.focused) {
      gamepads.forEach((gamepad, player) => {
        this.updatePlayer(player as 0 | 1, readSnesButtons(gamepad));
      });
    }

    this.animationFrame = window.requestAnimationFrame(this.poll);
  };

  private updateAssignments(gamepads: Gamepad[]) {
    const assignments = gamepads.map(
      (gamepad, player): GamepadAssignment => ({
        player: player as 0 | 1,
        index: gamepad.index,
        id: gamepad.id,
        mapping: gamepad.mapping,
      }),
    );
    const signature = assignments
      .map(({ index, id, mapping }) => `${index}:${id}:${mapping}`)
      .join("|");
    if (signature === this.assignmentSignature) return;

    this.releaseButtons();
    this.assignmentSignature = signature;
    this.onAssignments(assignments);
  }

  private updatePlayer(player: 0 | 1, nextButtons: Set<SnesButton>) {
    const previousButtons = this.pressedButtons[player];
    for (const button of SNES_BUTTONS) {
      const wasPressed = previousButtons.has(button);
      const pressed = nextButtons.has(button);
      if (wasPressed !== pressed) {
        this.client.setButton(
          button,
          pressed,
          player,
          gamepadSource(player),
        );
      }
    }
    this.pressedButtons[player] = nextButtons;
  }

  private releaseButtons() {
    for (let player = 0; player < MAX_PLAYERS; player += 1) {
      this.client.clearInputSource(gamepadSource(player), player);
      this.pressedButtons[player].clear();
    }
  }

  private readonly handleBlur = () => {
    this.focused = false;
    this.releaseButtons();
  };

  private readonly handleFocus = () => {
    this.focused =
      document.visibilityState === "visible" && document.hasFocus();
  };

  private readonly handleVisibilityChange = () => {
    this.focused =
      document.visibilityState === "visible" && document.hasFocus();
    if (!this.focused) this.releaseButtons();
  };
}

export function readSnesButtons(gamepad: Gamepad) {
  const pressed = new Set<SnesButton>();

  for (const [buttonIndex, snesButton] of STANDARD_BUTTONS) {
    const button = gamepad.buttons[buttonIndex];
    if (button && (button.pressed || button.value >= 0.5)) {
      pressed.add(snesButton);
    }
  }

  const horizontal = gamepad.axes[0] ?? 0;
  const vertical = gamepad.axes[1] ?? 0;
  if (horizontal <= -AXIS_DEADZONE) pressed.add("left");
  if (horizontal >= AXIS_DEADZONE) pressed.add("right");
  if (vertical <= -AXIS_DEADZONE) pressed.add("up");
  if (vertical >= AXIS_DEADZONE) pressed.add("down");

  return pressed;
}

function gamepadSource(player: number) {
  return `gamepad:player-${player}`;
}
