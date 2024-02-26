"use client";
import React, { useEffect } from "react";
import { Dialog, useDialogRef } from "@clientComponents/form-builder/app/shared";
import { useTranslation } from "@i18n/client";
import { Button } from "@clientComponents/globals";
import { logMessage } from "@lib/logger";
import {
  CSVResponse,
  DownloadFormat,
  HtmlZippedResponse,
  JSONResponse,
} from "@lib/responseDownloadFormats/types";
import JSZip from "jszip";
import { getDate, slugify } from "@lib/client/clientHelpers";
import { SpinnerIcon } from "@serverComponents/icons/SpinnerIcon";
import { getSubmissionsByFormat } from "../../actions";
import { Language } from "@clientComponents/form-builder/types";
import { usePathname } from "next/navigation";

export const DownloadDialog = ({
  checkedItems,
  isDialogVisible,
  setIsDialogVisible,
  setDownloadError,
  formId,
  formName,
  onSuccessfulDownload,
  responseDownloadLimit,
}: {
  checkedItems: Map<string, boolean>;
  isDialogVisible: boolean;
  setIsDialogVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setDownloadError: React.Dispatch<React.SetStateAction<boolean>>;
  formId: string;
  formName: string;
  onSuccessfulDownload: () => void;
  responseDownloadLimit: number;
}) => {
  const dialogRef = useDialogRef();
  const { t, i18n } = useTranslation("form-builder-responses");
  const pathname = usePathname();
  const defaultSelectedFormat = DownloadFormat.HTML_ZIPPED;
  const [selectedFormat, setSelectedFormat] = React.useState<DownloadFormat>(defaultSelectedFormat);
  const [zipAllFiles, setZipAllFiles] = React.useState<boolean>(true);
  const [isDownloading, setIsDownloading] = React.useState<boolean>(false);

  useEffect(() => {
    if (selectedFormat === DownloadFormat.HTML_ZIPPED) {
      setZipAllFiles(true);
    }
  }, [selectedFormat]);

  const handleClose = () => {
    setSelectedFormat(defaultSelectedFormat);
    setZipAllFiles(true);
    setIsDialogVisible(false);
    dialogRef.current?.close();
  };

  const handleDownloadComplete = () => {
    setIsDownloading(false);
    onSuccessfulDownload();
    handleClose();
  };

  const downloadFileFromBlob = (data: Blob, fileName: string) => {
    const href = window.URL.createObjectURL(data);
    const anchorElement = document.createElement("a");
    anchorElement.href = href;
    anchorElement.download = fileName;
    document.body.appendChild(anchorElement);
    anchorElement.click();
    document.body.removeChild(anchorElement);
    window.URL.revokeObjectURL(href);
  };

  const downloadFormatEvent = (
    formID: string,
    downloadType: DownloadFormat,
    numberOfRecords: number
  ) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "download_format",
      formID,
      downloadType,
      numberOfRecords,
    });
  };

  // Note: The API can provide additional formats, see DownloadFormat enum and update this array if needed
  const availableFormats = [DownloadFormat.CSV, DownloadFormat.JSON, DownloadFormat.HTML_ZIPPED];

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(false);
    if (!selectedFormat || !availableFormats.includes(selectedFormat)) {
      setDownloadError(true);
      return;
    }

    if (!checkedItems.size || checkedItems.size > responseDownloadLimit) {
      setDownloadError(true);
      return;
    }

    const ids = Array.from(checkedItems.keys());

    const filePrefix = slugify(`${formName}-${getDate()}`) + "-";

    try {
      if (selectedFormat === DownloadFormat.HTML_ZIPPED) {
        const response = (await getSubmissionsByFormat({
          formID: formId,
          ids: ids,
          format: DownloadFormat.HTML_ZIPPED,
          lang: i18n.language as Language,
          revalidate: pathname.includes("new"),
        })) as HtmlZippedResponse;

        downloadFormatEvent(formId, selectedFormat, ids.length);

        const zip = new JSZip();
        zip.file("_receipt-recu.html", response.receipt);

        response.responses.forEach((response: { id: string; html: string }) => {
          zip.file(`${response.id}.html`, response.html);
        });

        zip.generateAsync({ type: "nodebuffer", streamFiles: true }).then((buffer) => {
          const fileName = `${filePrefix}responses-reponses.zip`;
          downloadFileFromBlob(new Blob([buffer]), fileName);

          handleDownloadComplete();
        });
      }

      if (selectedFormat === DownloadFormat.CSV) {
        const response = (await getSubmissionsByFormat({
          formID: formId,
          ids: ids,
          format: DownloadFormat.CSV,
          lang: i18n.language as Language,
          revalidate: pathname.includes("new"),
        })) as CSVResponse;

        downloadFormatEvent(formId, selectedFormat, ids.length);

        if (zipAllFiles) {
          const file = new JSZip();
          const universalBOMForUTF8 = "\uFEFF";
          file.file("receipt-recu.html", response.receipt);
          file.file("responses-reponses.csv", universalBOMForUTF8 + response.responses);
          file.generateAsync({ type: "nodebuffer", streamFiles: true }).then((buffer) => {
            const fileName = `${filePrefix}responses-reponses.zip`;
            downloadFileFromBlob(new Blob([buffer]), fileName);

            handleDownloadComplete();
          });
        } else {
          downloadFileFromBlob(new Blob([response.receipt]), `${filePrefix}receipt-recu.html`);
          downloadFileFromBlob(
            new Blob([response.responses]),
            `${filePrefix}responses-reponses.csv`
          );

          handleDownloadComplete();
        }
      }

      if (selectedFormat === DownloadFormat.JSON) {
        const response = (await getSubmissionsByFormat({
          formID: formId,
          ids: ids,
          format: DownloadFormat.JSON,
          lang: i18n.language as Language,
          revalidate: pathname.includes("new"),
        })) as JSONResponse;

        downloadFormatEvent(formId, selectedFormat, ids.length);

        if (zipAllFiles) {
          const file = new JSZip();
          file.file("receipt-recu.html", response.receipt);
          file.file("responses-reponses.json", JSON.stringify(response.responses));
          file.generateAsync({ type: "nodebuffer", streamFiles: true }).then((buffer) => {
            const fileName = `${filePrefix}responses-reponses.zip`;
            downloadFileFromBlob(new Blob([buffer]), fileName);

            handleDownloadComplete();
          });
        } else {
          downloadFileFromBlob(new Blob([response.receipt]), `${filePrefix}receipt-recu.html`);
          downloadFileFromBlob(
            new Blob([JSON.stringify(response.responses)], { type: "application/json" }),
            `${filePrefix}responses-reponses.json`
          );

          handleDownloadComplete();
        }
      }
    } catch (err) {
      logMessage.error(err as Error);
      setDownloadError(true);
      handleClose();
    }
  };

  return (
    <>
      {isDialogVisible && (
        <Dialog
          title={t("downloadResponsesModals.downloadDialog.title")}
          dialogRef={dialogRef}
          handleClose={handleClose}
        >
          <div className="p-8">
            <h3 className="mb-4 block font-semibold">
              {t("downloadResponsesModals.downloadDialog.chooseDownloadFormat")}
            </h3>
            <p>
              {t("downloadResponsesModals.downloadDialog.downloadFormatContext1")}
              <i>{t("downloadResponsesModals.downloadDialog.downloadFormatContext2")}</i>
              {t("downloadResponsesModals.downloadDialog.downloadFormatContext3")}
            </p>
            <div className="mt-4 flex flex-col gap-6">
              <div>
                <input
                  type="radio"
                  name="downloadFormat"
                  id="zip"
                  value={DownloadFormat.HTML_ZIPPED}
                  checked={selectedFormat === DownloadFormat.HTML_ZIPPED}
                  className="gc-radio__input"
                  onChange={(e) => setSelectedFormat(e.target.value as DownloadFormat)}
                />
                <label htmlFor="zip" className="gc-checkbox-label ml-14 inline-block">
                  <span className="block font-semibold">
                    {t("downloadResponsesModals.downloadDialog.html")}
                  </span>
                  <span className="">
                    {t("downloadResponsesModals.downloadDialog.htmlDescription")}
                  </span>
                </label>
              </div>

              <div>
                <input
                  type="radio"
                  name="downloadFormat"
                  id="combined"
                  value={DownloadFormat.CSV}
                  checked={selectedFormat === DownloadFormat.CSV}
                  className="gc-radio__input"
                  onChange={(e) => setSelectedFormat(e.target.value as DownloadFormat)}
                />
                <label htmlFor="combined" className="gc-checkbox-label ml-14 inline-block">
                  <span className="block font-semibold">
                    {t("downloadResponsesModals.downloadDialog.csv")}
                  </span>
                  <span className="">
                    {t("downloadResponsesModals.downloadDialog.csvDescription")}
                  </span>
                </label>
              </div>

              <div>
                <input
                  type="radio"
                  name="downloadFormat"
                  id="json"
                  value={DownloadFormat.JSON}
                  checked={selectedFormat === DownloadFormat.JSON}
                  className="gc-radio__input"
                  onChange={(e) => setSelectedFormat(e.target.value as DownloadFormat)}
                />
                <label htmlFor="json" className="gc-checkbox-label ml-14 inline-block">
                  <span className="block font-semibold">
                    {t("downloadResponsesModals.downloadDialog.json")}
                  </span>
                  <span className="">
                    {t("downloadResponsesModals.downloadDialog.jsonDescription")}
                  </span>
                </label>
              </div>

              <hr />

              <div>
                <div className="gc-input-checkbox">
                  <input
                    type="checkbox"
                    name="downloadFormat"
                    id="zipped"
                    checked={zipAllFiles}
                    disabled={selectedFormat === DownloadFormat.HTML_ZIPPED}
                    className="gc-input-checkbox__input"
                    onChange={() => setZipAllFiles(zipAllFiles === true ? false : true)}
                  />
                  <label htmlFor="zipped" className="gc-checkbox-label">
                    <span className="block font-semibold">
                      {t("downloadResponsesModals.downloadDialog.downloadAllAsZip")}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <Button theme="secondary" onClick={handleClose} disabled={isDownloading}>
                {t("downloadResponsesModals.downloadDialog.cancel")}
              </Button>
              <Button
                theme="primary"
                onClick={handleDownload}
                disabled={!selectedFormat || isDownloading}
              >
                {t("downloadResponsesModals.downloadDialog.download")}
              </Button>
              {isDownloading && (
                <div role="status" className="mt-2">
                  <SpinnerIcon className="h-8 w-8 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600" />
                  <span className="sr-only">{t("loading")}</span>
                </div>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
};
