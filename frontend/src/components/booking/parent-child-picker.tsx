import { Field, HStack, NativeSelect } from "@chakra-ui/react";
import type { Child, Parent } from "@/lib/api-types";

interface ParentChildPickerProps {
  parents: Parent[];
  selectedParent: Parent | null;
  selectedChild: Child | null;
  onParentChange: (parent: Parent | null) => void;
  onChildChange: (child: Child | null) => void;
}

export function ParentChildPicker({
  parents,
  selectedParent,
  selectedChild,
  onParentChange,
  onChildChange,
}: ParentChildPickerProps) {
  return (
    <HStack gap="4" align="start" flexWrap="wrap">
      <Field.Root maxWidth="16rem">
        <Field.Label>Parent</Field.Label>
        <NativeSelect.Root>
          <NativeSelect.Field
            placeholder="Choose a parent"
            value={selectedParent?.id ?? ""}
            onChange={(event) =>
              onParentChange(
                parents.find(
                  (parent) => parent.id === Number(event.target.value),
                ) ?? null,
              )
            }
          >
            {parents.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.name}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Field.Root>

      <Field.Root maxWidth="16rem" disabled={!selectedParent}>
        <Field.Label>Child</Field.Label>
        <NativeSelect.Root>
          <NativeSelect.Field
            placeholder="Choose a child"
            value={selectedChild?.id ?? ""}
            onChange={(event) =>
              onChildChange(
                selectedParent?.children.find(
                  (child) => child.id === Number(event.target.value),
                ) ?? null,
              )
            }
          >
            {selectedParent?.children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Field.Root>
    </HStack>
  );
}
