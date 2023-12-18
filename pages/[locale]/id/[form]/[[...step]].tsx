import { getPublicTemplateByID } from "@lib/templates";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { checkOne } from "@lib/cache/flags";
import React, { ReactElement } from "react";
import classnames from "classnames";
import { useTranslation } from "next-i18next";
import Head from "next/head";
import { Form, TextPage, ClosedPage } from "@components/forms";
import { getRenderedForm } from "@lib/formBuilder";
import { useRouter } from "next/router";
import { PublicFormRecord } from "@lib/types";
import { GetServerSideProps } from "next";
import { NextPageWithLayout } from "@pages/_app";
import { dateHasPast } from "@lib/utils";
import { languageParamSanitization } from "@app/i18n/utils";
import { getLocalizedProperty } from "@lib/utils";

import FormDisplayLayout from "@components/globals/layouts/FormDisplayLayout";

/* The Dynamic form component is the outer stateful component which renders either a form step or a
    form text page based on the step
*/

interface RenderFormProps {
  formRecord: PublicFormRecord;
}

const RenderForm: NextPageWithLayout<RenderFormProps> = ({
  formRecord,
}: RenderFormProps): React.ReactElement => {
  const { t, i18n } = useTranslation();
  const language = i18n.language as "en" | "fr";
  const classes = classnames("gc-form-wrapper");
  const currentForm = getRenderedForm(formRecord, language, t);
  const formTitle = formRecord.form[getLocalizedProperty("title", language)] as string;
  const router = useRouter();
  const { step } = router.query;

  let isPastClosingDate = false;

  if (formRecord.closingDate) {
    isPastClosingDate = dateHasPast(Date.parse(formRecord.closingDate));
  }

  if (isPastClosingDate) {
    return <ClosedPage language={language} formRecord={formRecord} />;
  }

  // render text pages
  if (step == "confirmation") {
    return <TextPage formRecord={formRecord} />;
  }

  return (
    <>
      <Head>
        <title>{formTitle}</title>
      </Head>
      <div className={classes}>
        <h1>{formTitle}</h1>
        <Form formRecord={formRecord} language={language} router={router} t={t}>
          {currentForm}
        </Form>
      </div>
    </>
  );
};

// Redirects to 404 page
function redirect(locale: string | undefined) {
  return {
    redirect: {
      // We can redirect to a 'Form does not exist page' in the future
      destination: `/${locale}/404`,
      permanent: false,
    },
  };
}

RenderForm.getLayout = function getLayout(page: ReactElement) {
  const isEmbeddable = page.props.formRecord && page.props.isEmbeddable;
  return (
    <FormDisplayLayout formRecord={page.props.formRecord} embedded={isEmbeddable}>
      {page}
    </FormDisplayLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { locale: localeParam, form: formID }: { locale?: string; form?: string } =
    context.params ?? {};
  const unpublishedForms = await checkOne("unpublishedForms");
  let publicForm: PublicFormRecord | null = null;
  const locale = languageParamSanitization(localeParam);

  const isEmbeddable = context.query?.embed == "true" || null;

  if (formID === "preview-form" && context.query?.formObject) {
    // If we're previewing a form, get the object from the query string

    // If more then one formObject param is passed in short circuit back to 404
    if (Array.isArray(context.query?.formObject)) return redirect(locale);
    const queryObj = context.query.formObject;
    const parsedForm = JSON.parse(queryObj);
    publicForm = parsedForm.form ?? null;
  } else {
    //Otherwise, get the form object via the dataLayer library
    // Needed for typechecking of a ParsedURLQuery type which can be a string or string[]
    if (!formID || Array.isArray(formID)) return redirect(locale);

    publicForm = await getPublicTemplateByID(formID);
  }

  // Redirect if form doesn't exist and
  // Only retrieve publish ready forms if isProduction
  if (!publicForm || (!publicForm?.isPublished && !unpublishedForms)) {
    return redirect(locale);
  }

  // undefined will throw a serialization error in which case delete the key as it's uneeded
  if (typeof publicForm.closingDate === "undefined") {
    delete publicForm.closingDate;
  }

  return {
    props: {
      formRecord: publicForm,
      isEmbeddable: isEmbeddable,
      ...(locale && (await serverSideTranslations(locale, [
          "common",
          "welcome",
          "confirmation",
          "form-closed"]))),
    }, // will be passed to the page component as props
  };
};

export default RenderForm;
