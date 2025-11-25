"use client";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Input } from "@heroui/input";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Alert } from "@heroui/alert";

import { axiosInstance } from "@/utils/axiosInstance";

export default function ShareModal({
  isOpen,
  onOpenChange,
  onClose,
}: {
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("ShareWithFriendModal");
  const [friendInfo, setFriendInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.post("/users/invite-friend", friendInfo);

      if (res.status === 201) {
      }
      setShowSuccessMessage(true);
      setFriendInfo({
        firstName: "",
        lastName: "",
        email: "",
      });
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
                <Alert color="success" title="Invitation sent successfully" />
              )}
              <Input
                isRequired
                label={t("firstName")}
                labelPlacement="outside"
                name="firstName"
                placeholder="John"
                value={friendInfo.firstName}
                onChange={(e) => {
                  setFriendInfo((prevState) => ({
                    ...prevState,
                    firstName: e.target.value,
                  }));
                }}
              />
              <Input
                isRequired
                label={t("lastName")}
                labelPlacement="outside"
                name="lastName"
                placeholder="Doe"
                value={friendInfo.lastName}
                onChange={(e) => {
                  setFriendInfo((prevState) => ({
                    ...prevState,
                    lastName: e.target.value,
                  }));
                }}
              />
              <Input
                isRequired
                label={t("email")}
                labelPlacement="outside"
                name="email"
                placeholder="john.doe@example.com"
                type="email"
                value={friendInfo.email}
                onChange={(e) => {
                  setFriendInfo((prevState) => ({
                    ...prevState,
                    email: e.target.value,
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
