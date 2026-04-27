import { EditPlan } from "./types";
import { validateEditPlan } from "./validate";

export type EditPlanHookContext = {
  hookName: string;
  index: number;
};

export type EditPlanHook = (
  plan: EditPlan,
  context: EditPlanHookContext,
) => EditPlan | Promise<EditPlan>;

export async function applyEditPlanHooks(
  initialPlan: EditPlan,
  hooks: EditPlanHook[],
): Promise<EditPlan> {
  let current = initialPlan;

  for (let index = 0; index < hooks.length; index++) {
    const hook = hooks[index];
    current = await hook(current, {
      hookName: hook.name || `hook-${index + 1}`,
      index,
    });
    const validation = validateEditPlan(current);
    if (!validation.valid) {
      throw new Error(
        `Edit plan hook ${index + 1} returned invalid plan:\n${validation.errors.join("\n")}`,
      );
    }
  }

  return current;
}
