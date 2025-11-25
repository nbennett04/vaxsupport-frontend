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

export default function DeleteReportConfirmationModal({
  isOpen,
  onOpenChange,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean;
  onOpenChange: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  const t = useTranslations("DeleteReportConfirmationModal");

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
              {t("title")}
            </ModalHeader>
            <ModalBody>
              <p>{t("message")}</p>
            </ModalBody>
            <ModalFooter>
              <Button radius="full" variant="light" onPress={onClose}>
                {t("cancel")}
              </Button>
              <Button
                color="danger"
                isLoading={isLoading}
                radius="full"
                variant="ghost"
                onPress={onConfirm}
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
