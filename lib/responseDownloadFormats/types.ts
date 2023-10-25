export type Answer = {
  questionEn: string | undefined;
  questionFr: string | undefined;
  answer: string | Answer[];
};

export interface ResponseSubmission {
  id: string;
  created_at: number;
  confirmation_code: string;
  submission: Answer[];
}

export type JSONValue = string | number | boolean | { [x: string]: JSONValue } | Array<JSONValue>;

export interface Translations {
  en: JSONValue;
  fr: JSONValue;
}
