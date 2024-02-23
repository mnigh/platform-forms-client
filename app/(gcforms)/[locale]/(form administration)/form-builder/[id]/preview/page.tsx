import { serverTranslation } from "@i18n";
import { Metadata } from "next";
import { auth } from "@lib/auth";

import { notFound } from "next/navigation";
import { createAbility } from "@lib/privileges";
import { getFullTemplateByID } from "@lib/templates";
import { Preview } from "./Preview";
import { LockIcon } from "@serverComponents/icons";
import Markdown from "markdown-to-jsx";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { t } = await serverTranslation("form-builder", { lang: locale });
  return {
    title: `${t("gcFormsEdit")} — ${t("gcForms")}`,
  };
}

export default async function Page({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  const session = await auth();
  const { t } = await serverTranslation("form-builder", { lang: locale });

  const formID = id;

  if (!session?.user && formID !== "0000") {
    return notFound();
  }

  let isPublished = false;

  if (session) {
    try {
      const ability = createAbility(session);
      const initialForm = ability && (await getFullTemplateByID(ability, id));
      isPublished = initialForm?.isPublished || false;
    } catch (e) {
      // no-op
    }
  }

  if (isPublished) {
    return (
      <div className="my-5 flex bg-purple-200 p-5">
        <div className="flex">
          <div className="pr-7">
            <LockIcon className="mb-2 scale-125" />
          </div>
          <div>
            <Markdown options={{ forceBlock: true }}>
              {t("previewDisabledForPublishedForm", { ns: "form-builder" })}
            </Markdown>
          </div>
        </div>
      </div>
    );
  }

  return <Preview />;
}
