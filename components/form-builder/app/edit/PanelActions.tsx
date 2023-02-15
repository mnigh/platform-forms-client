import React, { useEffect, useRef } from "react";
import { useTranslation } from "next-i18next";

import { FormElementTypes } from "@lib/types";
import { Button } from "../shared";
import { AddElementButton } from "./elements/element-dialog/AddElementButton";
import { FormElementWithIndex } from "@components/form-builder/types";
import { useTemplateStore } from "@components/form-builder/store";
import {
  ChevronDown,
  ChevronUp,
  Close,
  Duplicate,
  ThreeDotsIcon,
} from "@components/form-builder/icons";

import { usePanelActions } from "@components/form-builder/hooks";

const buttonClasses =
  "group border-none transition duration-100 h-0 !py-5 lg:!pb-3 !pl-4 !pr-2 m-1 !bg-transparent hover:!bg-gray-600 focus:!bg-blue-hover disabled:!bg-transparent";
const iconClasses =
  "group-hover:group-enabled:fill-white-default group-disabled:fill-gray-500 group-focus:fill-white-default transition duration-100";

export interface RenderMoreFunc {
  ({ item, moreButton }: { item: FormElementWithIndex; moreButton: JSX.Element | undefined }):
    | React.ReactElement
    | string
    | undefined;
}

export const PanelActions = ({
  item,
  renderMoreButton,
  handleAdd,
  handleRemove,
  handleMoveUp,
  handleMoveDown,
  handleDuplicate,
}: {
  item: FormElementWithIndex;
  renderMoreButton: RenderMoreFunc;
  handleAdd: (index: number, type?: FormElementTypes) => void;
  handleRemove: () => void;
  handleMoveUp: () => void;
  handleMoveDown: () => void;
  handleDuplicate: () => void;
}) => {
  const { t } = useTranslation("form-builder");
  const { lang, elements } = useTemplateStore((s) => ({
    lang: s.lang,
    elements: s.form.elements,
  }));

  const isInit = useRef(false);
  const isLastItem = item.index === elements.length - 1;
  const isFirstItem = item.index === 0;
  const isRichText = item.type == "richText";

  const getPanelButtons = () => {
    return [
      {
        id: 1,
        txt: "moveUp",
        icon: ChevronUp,
        onClick: handleMoveUp,
        disabled: isFirstItem,
      },
      {
        id: 2,
        txt: "moveDown",
        icon: ChevronDown,
        onClick: handleMoveDown,
        disabled: isLastItem,
      },
      {
        id: 3,
        txt: "duplicate",
        icon: Duplicate,
        onClick: handleDuplicate,
      },
      {
        id: 4,
        txt: "remove",
        icon: Close,
        onClick: handleRemove,
      },
      {
        id: 5,
        txt: "more",
        icon: ThreeDotsIcon,
        onClick: () => null,
      },
    ];
  };

  const panelButtons = getPanelButtons();

  const { handleNav, getTabIndex, currentFocusIndex, itemsRef, setRef } = usePanelActions({
    panelButtons,
    isFirstItem,
    isLastItem,
    elementsLength: elements.length,
  });

  useEffect(() => {
    if (!isInit.current) {
      isInit.current = true;
      return;
    }
    const index = `button-${currentFocusIndex}` as unknown as number;
    const el = itemsRef.current[index];
    if (el) {
      el.focus();
    }
  }, [currentFocusIndex, isInit, itemsRef]);

  const actions = panelButtons.map((button, loopIndex) => {
    const Icon = button.icon;
    return (
      <Button
        key={button.txt}
        className={`${isFirstItem ? "disabled" : ""} ${buttonClasses}`}
        disabled={button.disabled && button.disabled}
        theme="secondary"
        iconWrapperClassName="!w-7 !mr-0"
        icon={<Icon className={`${iconClasses}`} />}
        onClick={button.onClick}
        tabIndex={getTabIndex(button.txt)}
        buttonRef={setRef(`button-${loopIndex}`)}
        dataTestId={button.txt}
      >
        <span className="text-sm mx-3 xl:mx-0">{t(button.txt)}</span>
      </Button>
    );
  });

  const moreButton = actions.pop();

  return (
    <div className="relative">
      <div
        className={`bg-gray-200 px-6 lg:px-0 py-4 lg:py-0 flex flex-wrap sm:flex-col ${lang}`}
        role="toolbar"
        aria-label={t("elementActions")}
        onKeyDown={handleNav}
        data-testid="panel-actions"
      >
        {actions}
        {!isRichText && renderMoreButton && renderMoreButton({ item, moreButton })}
      </div>
      <div className="absolute right-0 bottom-0 -mb-5 mr-8 xl:mr-2">
        <AddElementButton position={item.index} handleAdd={handleAdd} />
      </div>
    </div>
  );
};
