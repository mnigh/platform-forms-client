import React from "react";
import { useTemplateStore } from "../../../store/useTemplateStore";
import { RichTextEditor } from "./lexical-editor/RichTextEditor";
import { LocalizedElementProperties } from "../../../types";
import { useTranslation } from "next-i18next";

export const RichText = ({ parentIndex }: { parentIndex: number }) => {
  const { t } = useTranslation("form-builder");
  const { translationLanguagePriority, localizeField, form } = useTemplateStore((s) => ({
    localizeField: s.localizeField,
    translationLanguagePriority: s.translationLanguagePriority,
    form: s.form,
    lang: s.lang,
  }));

  const content =
    form.elements[parentIndex].properties[
      localizeField(LocalizedElementProperties.DESCRIPTION, translationLanguagePriority)
    ];

  return (
    <div
      key={translationLanguagePriority}
      className="flex mx-7 mt-5 mb-7 border-2 rounded"
      data-testid="richText"
    >
      <RichTextEditor
        path={`form.elements[${parentIndex}].properties.${localizeField(
          LocalizedElementProperties.DESCRIPTION
        )}`}
        content={content || ""}
        lang={translationLanguagePriority}
        autoFocusEditor={false}
        ariaLabel={t("pageText") + " " + (parentIndex + 1).toString()}
      />
    </div>
  );
};
