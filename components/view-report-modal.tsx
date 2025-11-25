"use client";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ReportType } from "@/types/dataTypes";
import { axiosInstance } from "@/utils/axiosInstance";

export default function ViewReportModal({
  isOpen,
  onOpenChange,
  data,
  fetchData,
  onClose,
}: {
  isOpen: boolean;
  onOpenChange: () => void;
  fetchData: () => void;
  onClose: () => void;
  data: ReportType | null;
}) {
  const t = useTranslations("ViewReportModal");
  const [loading, setLoading] = useState(false);

  const handleUpdateStatus = async () => {
    try {
      setLoading(true);
      await axiosInstance.put(`/reports/${data?._id}`, {
        status: data?.status === "open" ? "resolved" : "open",
      });

      setLoading(false);
      onClose();
      await fetchData();
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <Modal
      isDismissable={false}
      isOpen={isOpen}
      scrollBehavior="inside"
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {t("modalTitle")}
            </ModalHeader>
            <ModalBody>
              {data?.description && (
                <>
                  <div>
                    <span className="font-semibold">{t("title")}:</span>
                    <p>{data?.title}</p>
                  </div>
                  <div>
                    <span className="font-semibold">{t("description")}:</span>
                    <p>{data?.description}</p>
                  </div>
                </>
              )}
            </ModalBody>
            <ModalFooter>
              <Button radius="full" variant="light" onPress={onClose}>
                {t("close")}
              </Button>
              <Button
                className={
                  data?.status === "open"
                    ? "text-black dark:text-black bg-lime-500 shadow-lime-500/50 hover:bg-lime-600 transition duration-200 ease-in-out"
                    : ""
                }
                color={data?.status === "open" ? "default" : "danger"}
                isLoading={loading}
                radius="full"
                onPress={handleUpdateStatus}
              >
                {t(data?.status === "open" ? "markAsResolved" : "markAsOpen")}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
