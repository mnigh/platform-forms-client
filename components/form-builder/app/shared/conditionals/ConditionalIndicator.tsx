import React from "react";
import { useTranslation } from "next-i18next";
import { FormElementWithIndex } from "../../../types";
import { useTemplateStore } from "@components/form-builder/store";
import { ConditionalIcon } from "@components/form-builder/icons/ConditionalIcon";

const RuleIndicator = ({ whenId }: { whenId: string }) => {
  const { t } = useTranslation("form-builder");

  const getChoice = useTemplateStore((state) => state.getChoice);
  const translationLanguagePriority = useTemplateStore(
    (state) => state.translationLanguagePriority
  );

  const parentId = Number(whenId.split(".")[0]);
  const childId = Number(whenId.split(".")[1]);
  const choice = getChoice(parentId, childId);
  if (!choice) return null;
  const choiceValue = choice[translationLanguagePriority];
  return (
    <div>
      <ConditionalIcon className="mr-2 mt-[-5px] inline-block" />
      <div className="inline-block rounded-md border-1 border-slate-500 p-2">
        {t("question")} {`${parentId}`}
      </div>
      <span className="hidden">{`${choiceValue}`}</span>
    </div>
  );
};

export const ConditionalIndicator = ({ item }: { item: FormElementWithIndex }) => {
  const hasConditionalRules = item.properties.conditionalRules;

  if (!hasConditionalRules) return null;

  const whenId = item.properties.conditionalRules?.whenId as string;
  // @todo update this to loop through all conditional rules
  return (
    <div className="mt-2">
      <RuleIndicator whenId={whenId} />
    </div>
  );
};
