import { serverTranslation } from "@i18n";
import { requireAuthentication } from "@lib/auth";
import { checkPrivilegesAsBoolean } from "@lib/privileges";
import { AdminNavLayout } from "@serverComponents/globals/layouts";
import { Metadata } from "next";
import { FlagTable } from "./clientSide";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { t } = await serverTranslation("admin-flags", { lang: locale });
  return {
    title: `${t("title")}`,
  };
}

export default async function Page({ params: { locale } }: { params: { locale: string } }) {
  const { user } = await requireAuthentication();

  checkPrivilegesAsBoolean(user.ability, [{ action: "view", subject: "Flag" }], { redirect: true });

  const { t } = await serverTranslation("admin-flags");

  return (
    <AdminNavLayout locale={locale}>
      <h1 className="border-0 mb-10">{t("title")}</h1>
      <p className="pb-8">{t("subTitle")}</p>
      <FlagTable />
    </AdminNavLayout>
  );
}
