"use client";
import React from "react";
import { useTranslation } from "@i18n/client";
import { RichText } from "../forms/RichText/RichText";
import { logMessage } from "@lib/logger";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { getCsrfToken } from "@lib/clientHelpers";
import { localPathRegEx } from "@lib/validation";
import { Button } from "@clientComponents/globals";
import { useSession } from "next-auth/react";

interface AcceptableUseProps {
  content: string;
}
export const AcceptableUseTerms = ({ content }: AcceptableUseProps): React.ReactElement | null => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    t,
    i18n: { language },
  } = useTranslation("common");

  const { data: session, update } = useSession();

  let referer = searchParams.get("referer");
  const defaultRoute = `/${language}/forms`;

  // An extra check just encase a malicous user sets the referer to an external URL
  if (referer && !localPathRegEx.test(referer)) {
    referer = defaultRoute;
  }

  const agree = async () => {
    const csrfToken = await getCsrfToken();
    try {
      if (csrfToken && session?.user.id) {
        // await axios({
        //   url: "/api/acceptableuse",
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //     "X-CSRF-Token": csrfToken,
        //   },
        //   data: {
        //     userID: session.user.id,
        //   },
        //   timeout: process.env.NODE_ENV === "production" ? 60000 : 0,
        // });
        // Update the session to reflect the user has accepted the terms of use.
        await update({ ...session, user: { ...session.user, acceptableUse: true } });

        // Go back to the page the user was redirected from.
        router.push(referer ?? defaultRoute);
      } else {
        logMessage.error("Undefined CSRF Token or Session");
      }
    } catch (err) {
      logMessage.error(err as Error);
    }
  };

  return (
    <>
      <h1 className="pb-2">{t("acceptableUsePage.welcome")}</h1>
      <RichText className="w-full pb-10">{content}</RichText>
      <Button id="acceptableUse" onClick={agree}>
        {t("acceptableUsePage.agree")}
      </Button>
    </>
  );
};

export default AcceptableUseTerms;
