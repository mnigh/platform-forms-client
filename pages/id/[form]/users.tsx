import React, { ReactElement, useState, useId } from "react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import axios from "axios";
import { logMessage } from "@lib/logger";
import Head from "next/head";

import { getTemplateWithAssociatedUsers } from "@lib/templates";
import AdminNavLayout from "@components/globals/layouts/AdminNavLayout";
import { Alert, ErrorStatus } from "@components/forms/Alert/Alert";
import { getUsers } from "@lib/users";
import { Button } from "@components/globals";
import { checkPrivileges } from "@lib/privileges";
import { requireAuthentication } from "@lib/auth";
import { FormRecord } from "@lib/types";
import { getProperty } from "@lib/formBuilder";

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

interface AssignUsersToTemplateProps {
  formRecord: FormRecord;
  usersAssignedToFormRecord: User[];
  allUsers: User[];
}

const updateUsersToTemplateAssignations = async (
  formID: string,
  users: { id: string; action: "add" | "remove" }[]
) => {
  try {
    return await axios({
      url: `/api/templates/${formID}`,
      method: "PUT",
      data: {
        users,
      },
      timeout: process.env.NODE_ENV === "production" ? 60000 : 0,
    });
  } catch (e) {
    logMessage.error(e);
  }
};

const usersToOptions = (users: User[]): { value: string; label: string | null }[] => {
  return users.map((user) => {
    return { value: user.id, label: user.email };
  });
};

const Users = ({
  formRecord,
  usersAssignedToFormRecord,
  allUsers,
}: AssignUsersToTemplateProps): React.ReactElement => {
  const { t, i18n } = useTranslation("admin-users");
  const language = i18n.language as string;
  const [message, setMessage] = useState<ReactElement | null>(null);
  const assignedToFormRecord = usersToOptions(usersAssignedToFormRecord);
  const [selectedUsers, setSelectedUsers] =
    useState<{ value: string; label: string | null }[]>(assignedToFormRecord);

  const saveAssignations = async () => {
    setMessage(null);
    const usersToAdd: { id: string; action: "add" | "remove" }[] = selectedUsers
      .filter((user) => {
        return !usersAssignedToFormRecord.map((u) => u.id).includes(user.value);
      })
      .map((user) => {
        return { id: user.value, action: "add" };
      });

    const usersToRemove: { id: string; action: "add" | "remove" }[] = usersAssignedToFormRecord
      .filter((user) => {
        return !selectedUsers.map((u) => u.value).includes(user.id);
      })
      .map((user) => {
        return { id: user.id, action: "remove" };
      });

    const response = await updateUsersToTemplateAssignations(
      formRecord.id,
      usersToAdd.concat(usersToRemove)
    );

    if (response && response.status === 200) {
      setMessage(
        <Alert
          type={ErrorStatus.SUCCESS}
          focussable={true}
          heading={t("responseSuccess.title")}
          tabIndex={0}
          className="mb-2"
        >
          {t("responseSuccess.message")}
        </Alert>
      );
      return response.data;
    }

    setMessage(
      <Alert
        type={ErrorStatus.ERROR}
        focussable={true}
        heading={t("responseFail.title")}
        tabIndex={0}
        className="mb-2"
      >
        {t("responseFail.message")}
      </Alert>
    );
  };

  return (
    <>
      <Head>
        <title>{t("title")}</title>
      </Head>

      <h1 className="mb-0 border-b-0 text-h1 font-bold md:mb-10 md:text-small_h1">
        {`${t("title")} - ${formRecord.form[getProperty("title", language)] as string}`}
      </h1>

      {message && message}

      <p className="mb-4">{t("assignUsersToTemplate")}</p>
      <p className="mb-4 font-bold">{t("enterOwnersEmail")} </p>
      <Select
        instanceId={useId()}
        isClearable
        isSearchable
        isMulti
        components={makeAnimated()}
        options={usersToOptions(allUsers)}
        value={selectedUsers}
        onChange={(value) => setSelectedUsers(value as { value: string; label: string | null }[])}
      />
      <br />
      <Button theme="secondary" type="submit" onClick={() => saveAssignations()}>
        {t("save")}
      </Button>
    </>
  );
};

const redirect = (locale: string | undefined) => {
  return {
    redirect: {
      // We can redirect to a 'Form does not exist page' in the future
      destination: `/${locale}/404`,
      permanent: false,
    },
  };
};

Users.getLayout = (page: ReactElement) => {
  return <AdminNavLayout user={page.props.user}>{page}</AdminNavLayout>;
};

export const getServerSideProps = requireAuthentication(
  async ({ user: { ability }, locale, params }) => {
    checkPrivileges(ability, [
      { action: "update", subject: "FormRecord" },
      { action: "update", subject: "User" },
    ]);

    const formID = params?.form;
    if (!formID || Array.isArray(formID)) return redirect(locale);

    const templateWithAssociatedUsers = await getTemplateWithAssociatedUsers(ability, formID);
    if (!templateWithAssociatedUsers) return redirect(locale);

    const allUsers = (await getUsers(ability)).map((user) => {
      return { id: user.id, name: user.name, email: user.email };
    });

    return {
      props: {
        ...(locale &&
          (await serverSideTranslations(locale, ["common", "admin-users", "admin-login"]))),
        formRecord: templateWithAssociatedUsers.formRecord,
        usersAssignedToFormRecord: templateWithAssociatedUsers.users,
        allUsers,
      },
    };
  }
);

export default Users;
