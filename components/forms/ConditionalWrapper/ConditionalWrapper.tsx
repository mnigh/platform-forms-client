import React from "react";
import { useGCFormsContext } from "@lib/hooks/useGCFormContext";
import { ConditionalRule, FormElement } from "@lib/types";
import { inGroup } from "@lib/formContext";

export const ConditionalWrapper = ({
  children,
  element,
  rules,
}: {
  children: React.ReactElement;
  element: FormElement;
  rules: ConditionalRule[] | null;
}) => {
  const { matchedIds, currentGroup, groups, formRecord } = useGCFormsContext();
  // Check if we're using groups and if the current element is in a group
  if (
    currentGroup &&
    groups &&
    Object.keys(groups).length >= 1 &&
    groups &&
    !inGroup(currentGroup, element.id, groups)
  )
    return null;

  // If there's no rule or no choiceId, just return the children
  if (!rules || rules.length < 1) return children;

  const parentIds = rules.map((rule) => rule?.choiceId.split(".")[0]);
  const parentId = parentIds[0];

  const hasMatchedRule = rules.some((rule) => matchedIds.includes(rule?.choiceId));

  // If we have a matched rule for the element
  // also ensure the parent element has a matched rule
  if (hasMatchedRule) {
    // Find parent element and get it's rules
    const parentMatches = formRecord.form.elements
      .filter((el) => parentIds.includes(String(el.id)))
      .map((el) => {
        if (el.properties.conditionalRules && el.properties.conditionalRules.length > 0) {
          const parentRules = el.properties.conditionalRules;
          const parentHasMatchedRule = parentRules.some((rule) =>
            matchedIds.includes(rule?.choiceId)
          );
          if (parentHasMatchedRule) {
            // The parent element has a matched rule i.e. is showing
            return true;
          }
        } else {
          // No rules, so the parent element is showing
          return true;
        }
      });

    if (parentMatches && parentMatches.some(Boolean)) {
      return children;
    }
  }

  // Otherwise, return null
  return null;
};
