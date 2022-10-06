import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { requireAuthentication } from "@lib/auth";

import { useFormik } from "formik";
import { Button } from "@components/forms";
import React, { useState } from "react";
import axios from "axios";
import { useTranslation } from "next-i18next";
import { checkPriveleges, getAllPriveleges } from "@lib/priveleges";
import { Privelege } from "@lib/policyBuilder";
import { useAccessControl } from "@lib/hooks/useAccessControl";
import { logMessage } from "@lib/logger";
import { useRefresh } from "@lib/hooks";

const PrivelegeRow = ({
  privelege,
  edit,
}: {
  privelege: Privelege;
  edit: (privelege: Privelege) => void;
}) => {
  const { ability } = useAccessControl();
  const { i18n } = useTranslation();

  return (
    <tr className="border-b-1">
      <td>{i18n.language === "en" ? privelege.nameEn : privelege.nameFr}</td>
      <td>{i18n.language === "en" ? privelege.descriptionEn : privelege.descriptionFr}</td>
      <td>
        <table className="table-fixed min-w-full text-center">
          <thead>
            <tr>
              <td className="font-bold w-1/3">Action</td>
              <td className="font-bold w-1/3">Subject</td>
              <td className="font-bold w-1/3">Condition</td>
            </tr>
          </thead>
          <tbody>
            {privelege.permissions.map((permission, index) => {
              return (
                <tr key={index}>
                  <td>
                    {Array.isArray(permission.action)
                      ? JSON.stringify(permission.action)
                      : permission.action}
                  </td>
                  <td>
                    {Array.isArray(permission.subject)
                      ? JSON.stringify(permission.subject)
                      : permission.subject}
                  </td>
                  <td>{permission.condition}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </td>
      <td>
        {ability?.can("update", "Privelege") && (
          <Button type="button" className="w-32" onClick={() => edit(privelege)}>
            Edit
          </Button>
        )}
      </td>
    </tr>
  );
};

const ModifyPrivelege = ({
  privelege,
  backToList,
}: {
  privelege: Privelege | null;
  backToList: () => void;
}) => {
  const formik = useFormik({
    initialValues: {
      nameEn: privelege?.nameEn || "",
      nameFr: privelege?.nameFr || "",
      descriptionEn: privelege?.descriptionEn || "",
      descriptionFr: privelege?.descriptionFr || "",
      permissions: JSON.stringify(privelege?.permissions) || "",
    },
    validate: (values) => {
      const errors = {};
      // logMessage.debug(JSON.stringify(values));

      return errors;
    },
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await axios({
          url: `/api/priveleges`,
          method: privelege?.id ? "PUT" : "POST",
          data: {
            privelege: {
              ...(privelege?.id && { id: privelege.id }),
              ...values,
            },
          },
          timeout: process.env.NODE_ENV === "production" ? 60000 : 0,
        });
        setSubmitting(false);
        backToList();
      } catch (e) {
        logMessage.error(e);
      }
    },
  });

  return (
    <div>
      <form onSubmit={formik.handleSubmit}>
        <div>
          <label htmlFor="nameEn" className="gc-label">
            English Name
          </label>
          <input
            id="nameEn"
            name="nameEn"
            className="gc-input-text"
            onChange={formik.handleChange}
            value={formik.values.nameEn}
          />
        </div>
        <div>
          <label htmlFor="nameFr" className="gc-label">
            French Name
          </label>
          <input
            id="nameFr"
            name="nameFr"
            className="gc-input-text"
            onChange={formik.handleChange}
            value={formik.values.nameFr}
          />
        </div>
        <div>
          <label htmlFor="descriptionEn" className="gc-label">
            English Description
          </label>
          <input
            id="descriptionEn"
            name="descriptionEn"
            className="gc-input-text"
            onChange={formik.handleChange}
            value={formik.values.descriptionEn}
          />
        </div>
        <div>
          <label htmlFor="descriptionFr" className="gc-label">
            French Description
          </label>
          <input
            id="descriptionFr"
            name="descriptionFr"
            className="gc-input-text"
            onChange={formik.handleChange}
            value={formik.values.descriptionFr}
          />
        </div>
        <div>
          <label htmlFor="permissions" className="gc-label">
            Permissions
          </label>
          <input
            id="permissions"
            name="permissions"
            className="gc-input-text"
            onChange={formik.handleChange}
            value={formik.values.permissions}
          />
        </div>

        <Button type="submit">Submit</Button>
        <Button type="button" onClick={backToList}>
          Cancel
        </Button>
      </form>
    </div>
  );
};

const Priveleges = ({ allPriveleges }: { allPriveleges: Privelege[] }): React.ReactElement => {
  const { t } = useTranslation("admin-priveleges");
  const [modifyMode, setModifyMode] = useState(false);
  const [selectedPrivelege, setSelectedPrivealge] = useState<Privelege | null>(null);
  const { refreshData } = useRefresh();

  const editPrivelege = (privelege: Privelege) => {
    setSelectedPrivealge(privelege);
    setModifyMode(true);
  };

  const cancelEdit = () => {
    setModifyMode(false);
    setSelectedPrivealge(null);
    refreshData();
  };

  return (
    <>
      <h1>{t("title")}</h1>
      <div className="shadow-lg border-4">
        {modifyMode ? (
          <ModifyPrivelege privelege={selectedPrivelege} backToList={cancelEdit} />
        ) : (
          <div>
            <table className="table-fixed min-w-full">
              <thead>
                <tr className="border-b-2">
                  <th className="w-1/6">Privelege Name</th>
                  <th className="w-1/3">Description</th>
                  <th className="w-3/4">Permissions</th>
                </tr>
              </thead>
              <tbody>
                {allPriveleges.map((privelege) => {
                  return (
                    <PrivelegeRow key={privelege.id} privelege={privelege} edit={editPrivelege} />
                  );
                })}
              </tbody>
            </table>
            <Button
              type="button"
              onClick={() => {
                setSelectedPrivealge(null);
                setModifyMode(true);
              }}
            >
              Create
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default Priveleges;

export const getServerSideProps = requireAuthentication(async ({ user: { ability }, locale }) => {
  checkPriveleges(ability, [{ action: "manage", subject: "Privelege" }]);
  const allPriveleges = await getAllPriveleges(ability);

  return {
    props: {
      ...(locale && (await serverSideTranslations(locale, ["common", "admin-priveleges"]))),
      allPriveleges,
    },
  };
});
