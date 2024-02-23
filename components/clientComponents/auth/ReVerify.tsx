"use client";
import React, { ReactElement, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@i18n/client";
import { Button, StyledLink } from "@clientComponents/globals";
import { useAuthErrors } from "@lib/hooks/auth/useAuthErrors";
import { logMessage } from "@lib/logger";
import axios from "axios";
import { getCsrfToken } from "@lib/client/csrfToken";
import { hasError } from "@lib/hasError";
import { Alert } from "@clientComponents/forms";
import { ErrorStatus } from "@clientComponents/forms/Alert/Alert";
import Link from "next/link";

import { useFocusIt } from "@lib/hooks/useFocusIt";

interface ReVerifyProps {
  username: React.MutableRefObject<string>;
  authenticationFlowToken: React.MutableRefObject<string>;
  callback: () => void;
}

export const ReVerify = ({
  username,
  authenticationFlowToken,
  callback,
}: ReVerifyProps): ReactElement => {
  const router = useRouter();
  const {
    t,
    i18n: { language },
  } = useTranslation(["auth-verify", "cognito-errors", "common"]);
  const [authErrorsState, { authErrorsReset, handleErrorById }] = useAuthErrors();

  const headingRef = useRef(null);
  useFocusIt({ elRef: headingRef });

  const handleReVerify = async () => {
    authErrorsReset();

    const token = await getCsrfToken();
    if (!token) {
      throw new Error("CSRF token not found");
    }

    try {
      const { status } = await axios({
        url: "/api/auth/2fa/request-new-verification-code",
        method: "POST",
        headers: {
          "X-CSRF-Token": token,
        },
        data: {
          email: username.current,
          authenticationFlowToken: authenticationFlowToken.current,
        },
        timeout: process.env.NODE_ENV === "production" ? 60000 : 0,
      });

      if (Number(status) !== 200) {
        return;
      }

      if (typeof callback === "function") {
        callback();
      }
    } catch (err) {
      logMessage.error(err);

      if (hasError(["CredentialsSignin", "CSRF token not found", "Missing 2FA session"], err)) {
        // Missing CsrfToken, username or 2FA session so have the user try signing in again
        router.push("/auth/login");
        router.refresh();
      } else {
        handleErrorById("InternalServiceException");
      }
    }
  };

  return (
    <>
      {/*
      @todo find a way to inclde this in the page metadata
      <Head>
        <title>{t("reVerify.title")}</title>
      </Head> */}
      {authErrorsState?.isError && (
        <Alert
          type={ErrorStatus.ERROR}
          heading={authErrorsState.title}
          onDismiss={authErrorsReset}
          id="cognitoErrors"
        >
          {authErrorsState.description}&nbsp;
          {authErrorsState.callToActionLink ? (
            <Link href={authErrorsState.callToActionLink}>{authErrorsState.callToActionText}</Link>
          ) : undefined}
        </Alert>
      )}
      <h1 ref={headingRef} className="border-0 mt-6 mb-6">
        {t("reVerify.title")}
      </h1>
      <p className="mt-10">{t("reVerify.description")}</p>
      <div className="flex mt-16">
        <Button theme="primary" className="mr-4" onClick={handleReVerify}>
          {t("reVerify.buttons.reSendCode")}
        </Button>
        <StyledLink theme="secondaryButton" href={`/${language}/support`}>
          {t("reVerify.buttons.getSupport")}
        </StyledLink>
      </div>
    </>
  );
};
