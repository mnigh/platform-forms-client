import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import useTemplateStore from "../store/useTemplateStore";

const OptionWrapper = styled.div`
  display: flex;
`;

const TextInput = styled.input`
  padding: 22px;
  width: 460px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  max-height: 36px;
`;

export const RichText = ({ parentIndex }: { parentIndex: number }) => {
  const input = useRef<HTMLInputElement>(null);
  const {
    form: { elements },
    updateField,
    resetChoices,
  } = useTemplateStore();
  const val = elements[parentIndex].properties.descriptionEn;

  useEffect(() => {
    if (input.current) {
      input.current.focus();
    }
  }, []);

  return (
    <OptionWrapper>
      <TextInput
        ref={input}
        type="text"
        value={val}
        placeholder="Rich text"
        onChange={(e) => {
          updateField(`form.elements[${parentIndex}].properties.descriptionEn`, e.target.value);
          // for rich text fields we want to clear the choices array
          resetChoices(parentIndex);
        }}
      />
    </OptionWrapper>
  );
};

RichText.propTypes = {
  parentIndex: PropTypes.number,
  index: PropTypes.number,
  renderIcon: PropTypes.func,
};
