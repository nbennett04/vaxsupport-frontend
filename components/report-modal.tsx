"use client";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Input, Textarea } from "@heroui/input";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Alert } from "@heroui/alert";

import { axiosInstance } from "@/utils/axiosInstance";

export default function ReportModal({
  isOpen,
  onOpenChange,
  onClose,
}: {
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("ReportIssueModal");
  const [reportData, setReportData] = useState({ title: "", description: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.post("/reports", reportData);

      if (res.status === 201) {
      }
      setShowSuccessMessage(true);
      setReportData({ title: "", description: "" });
      setIsLoading(false);
      setTimeout(() => {
        setShowSuccessMessage(false);
        onClose();
      }, 3000);
    } catch (e) {
      console.log(e);
      setIsLoading(false);
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
              {showSuccessMessage && (
                <Alert color="success" title="Report submitted successfully" />
              )}
              <Input
                isRequired
                label={t("title")}
                labelPlacement="outside"
                name="title"
                placeholder="Enter the title of the issue you are facing"
                value={reportData.title}
                onChange={(e) => {
                  setReportData((prevState) => ({
                    ...prevState,
                    title: e.target.value,
                  }));
                }}
              />
              <Textarea
                label={t("description")}
                labelPlacement="outside"
                name="description"
                placeholder="Describe in detail the issue you are facing"
                value={reportData.description}
                onChange={(e) => {
                  setReportData((prevState) => ({
                    ...prevState,
                    description: e.target.value,
                  }));
                }}
              />
            </ModalBody>
            <ModalFooter>
              <Button radius="full" variant="light" onPress={onClose}>
                {t("cancel")}
              </Button>
              <Button
                className="text-black dark:text-black bg-lime-500 shadow-lime-500/50 hover:bg-lime-600 transition duration-200 ease-in-out"
                isLoading={isLoading}
                radius="full"
                onPress={handleSubmit}
              >
                {t("confirm")}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
