"use client";
import React, { useContext, useEffect, useState } from "react";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Alert } from "@heroui/alert";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { useTranslations } from "next-intl";
import { useDisclosure } from "@heroui/modal";

import { axiosInstance } from "@/utils/axiosInstance";
import Loader from "@/components/loader";
import { ReportType } from "@/types/dataTypes";
import { UserContext } from "@/context/user-context";
import DeleteAccountConfirmationModal from "@/components/delete-account-confirmation-modal";

const defaultValue = {
  id: "",
  firstName: "",
  lastName: "",
  email: "",
  role: "",
};

type VisibilityKeys = "oldPassword" | "newPassword" | "confirmPassword";

const ProfilePage = () => {
  const t = useTranslations("ProfilePage");

  const { logout } = useContext(UserContext);

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const [userInfo, setUserInfo] = useState(defaultValue);
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isUserInfoLoading, setIsUserInfoLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState({
    firstName: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isVisible, setIsVisible] = useState<Record<VisibilityKeys, boolean>>({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [reports, setReports] = useState<ReportType[]>([]);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // Add smooth scrolling animation
    });
  };
  const [isLoading, setIsLoading] = useState(true);

  const validateName = (value: string) => {
    if (value.trim().length === 0) {
      setValidationErrors((prevState) => ({
        ...prevState,
        firstName: "Name cannot be empty.",
      }));

      return false;
    }
    if (value.trim().length < 3) {
      setValidationErrors((prevState) => ({
        ...prevState,
        firstName: "Name too short.",
      }));

      return false;
    }
    setValidationErrors((prevState) => ({
      ...prevState,
      firstName: "",
    }));

    return true;
  };

  const validatePassword = (password: string, confirmPassword: string) => {
    // Check if the new password is the same as the old password
    if (passwords.oldPassword === password) {
      setValidationErrors((prevState) => ({
        ...prevState,
        newPassword: "New password cannot be the same as the current password.",
      }));

      return false;
    }

    // Check if password meets criteria
    if (password.length < 8) {
      setValidationErrors((prevState) => ({
        ...prevState,
        newPassword: "Password must be at least 8 characters long.",
      }));

      return false;
    } else if (!/[A-Z]/.test(password)) {
      setValidationErrors((prevState) => ({
        ...prevState,
        newPassword: "Password must contain at least one uppercase letter.",
      }));

      return false;
    } else if (!/[a-z]/.test(password)) {
      setValidationErrors((prevState) => ({
        ...prevState,
        newPassword: "Password must contain at least one lowercase letter.",
      }));

      return false;
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setValidationErrors((prevState) => ({
        ...prevState,
        newPassword: "Password must contain at least one special character.",
      }));

      return false;
    }

    setValidationErrors((prevState) => ({
      ...prevState,
      newPassword: "",
    }));

    // Check if passwords match
    if (password !== confirmPassword) {
      setValidationErrors((prevState) => ({
        ...prevState,
        confirmPassword: "Passwords do not match.",
      }));

      return false;
    }

    setValidationErrors((prevState) => ({
      ...prevState,
      newPassword: "",
      confirmPassword: "",
    }));

    return true;
  };

  const toggleVisibility = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.target as HTMLButtonElement;
    const name = target.name as VisibilityKeys; // Assert that the name matches VisibilityKeys

    setIsVisible((prevState) => ({
      ...prevState,
      [name]: !prevState[name],
    }));
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get("/auth/profile");
      const reportsResponse = await axiosInstance.get("/reports/user");

      setReports(reportsResponse.data);
      setUserInfo({
        id: res?.data?.user?._id,
        email: res?.data?.user?.email,
        firstName: res?.data?.user?.firstName,
        lastName: res?.data?.user?.lastName,
        role: res?.data?.user?.role,
      });
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      console.log(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateProfile = async () => {
    try {
      setIsUserInfoLoading(true);
      await axiosInstance.put("/users/update", {
        firstName: userInfo?.firstName,
        lastName: userInfo?.lastName,
      });

      setIsUserInfoLoading(false);
      setAlertMessage("Profile updated successfully!");
      setIsSuccess(true);
      scrollToTop();
      await fetchData();

      setTimeout(() => {
        setIsSuccess(false);
        setAlertMessage("");
      }, 3000);
    } catch (e) {
      setIsUserInfoLoading(false);
      setAlertMessage(
        "An error occurred while updating profile. Please try again.",
      );
      setIsError(true);
      setTimeout(() => {
        setIsError(false);
        setAlertMessage("");
      }, 3000);
      console.log(e);
    }
  };

  const handleUpdatePassword = async () => {
    try {
      setIsPasswordLoading(true);
      await axiosInstance.put("/users/password", {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
      });

      setAlertMessage("Password updated successfully!");
      setIsSuccess(true);
      scrollToTop();
      setTimeout(() => {
        setIsSuccess(false);
        setAlertMessage("");
      }, 3000);
      setIsPasswordLoading(false);
      setPasswords({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (e: any) {
      setIsPasswordLoading(false);
      scrollToTop();
      setAlertMessage(e?.response?.data?.message);
      setIsError(true);
      setTimeout(() => {
        setIsError(false);
        setAlertMessage("");
      }, 3000);
      console.log(e?.response?.data);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleteLoading(true);
      await axiosInstance.delete("users/delete");

      logout();
      setIsDeleteLoading(false);
    } catch (e) {
      setIsDeleteLoading(false);
      console.log(e);
    }
  };

  return (
    <>
      <Loader fullPage isLoading={isLoading} />
      <div className="flex flex-col gap-8 w-full">
        {(isSuccess || isError) && (
          <Alert
            className="text-left"
            color={isSuccess ? "success" : isError ? "danger" : "default"}
            description={alertMessage}
            title={
              isSuccess
                ? "Update successful"
                : isError
                  ? "An error occurred"
                  : ""
            }
            variant="faded"
          />
        )}
        <Card>
          <CardBody className="flex flex-col gap-8 md:flex-row md:gap-0 sm:px-8 sm:py-7 ">
            <div className="flex flex-col gap-2 flex-1">
              <h2 className="text-lg font-medium">{t("profileTitle")}</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t("profileDescription")}
              </span>
            </div>
            <div className="flex flex-col gap-4 flex-grow max-w-2xl">
              <Input
                errorMessage={validationErrors.firstName}
                isInvalid={Boolean(validationErrors.firstName)}
                label={t("firstName")}
                labelPlacement="outside"
                placeholder="Jhon"
                value={userInfo.firstName}
                onChange={(e) => {
                  setUserInfo((prevState) => ({
                    ...prevState,
                    firstName: e.target.value,
                  }));
                  validateName(e.target.value);
                }}
              />
              <Input
                label={t("lastName")}
                labelPlacement="outside"
                placeholder="Doe"
                value={userInfo.lastName}
                onChange={(e) => {
                  setUserInfo((prevState) => ({
                    ...prevState,
                    lastName: e.target.value,
                  }));
                }}
              />
              <Input
                disabled
                description="Updating email is not allowed."
                isDisabled={true}
                label={t("email")}
                labelPlacement="outside"
                placeholder="jhon.doe@example.com"
                type="email"
                value={userInfo.email}
              />
            </div>
          </CardBody>
          <CardFooter className="flex justify-end gap-4">
            <Button color="default" radius="full" variant="ghost">
              {t("cancel")}
            </Button>
            <Button
              className="text-black dark:text-black bg-lime-500 shadow-lime-500/50 hover:bg-lime-600 transition duration-200 ease-in-out"
              isLoading={isUserInfoLoading}
              radius="full"
              variant="solid"
              onPress={handleUpdateProfile}
            >
              {t("updateProfile")}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardBody className="flex flex-col gap-8 md:flex-row md:gap-0 sm:px-8 sm:py-7">
            <div className="flex flex-col gap-2 flex-1 ">
              <h2 className="text-lg font-medium">{t("privacyTitle")}</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t("privacyDescription")}
              </span>
            </div>
            <div className="flex flex-col gap-4 flex-grow max-w-2xl">
              <Input
                endContent={
                  <button
                    aria-label="toggle password visibility"
                    className="focus:outline-none"
                    name="oldPassword"
                    type="button"
                    onClick={toggleVisibility}
                  >
                    {isVisible.oldPassword ? (
                      <EyeSlashIcon
                        className="text-default-400 pointer-events-none"
                        height={20}
                        width={20}
                      />
                    ) : (
                      <EyeIcon
                        className="text-default-400 pointer-events-none"
                        height={20}
                        width={20}
                      />
                    )}
                  </button>
                }
                label={t("currentPassword")}
                labelPlacement="outside"
                placeholder="Enter your current password"
                type={isVisible.oldPassword ? "text" : "password"}
                onChange={(e) => {
                  setPasswords((prevState) => ({
                    ...prevState,
                    oldPassword: e.target.value,
                  }));
                }}
              />
              <Input
                endContent={
                  <button
                    aria-label="toggle password visibility"
                    className="focus:outline-none"
                    name="newPassword"
                    type="button"
                    onClick={toggleVisibility}
                  >
                    {isVisible.newPassword ? (
                      <EyeSlashIcon
                        className="text-default-400 pointer-events-none"
                        height={20}
                        width={20}
                      />
                    ) : (
                      <EyeIcon
                        className="text-default-400 pointer-events-none"
                        height={20}
                        width={20}
                      />
                    )}
                  </button>
                }
                errorMessage={validationErrors.newPassword}
                isInvalid={Boolean(validationErrors.newPassword)}
                label={t("newPassword")}
                labelPlacement="outside"
                placeholder="Enter your new password"
                type={isVisible.newPassword ? "text" : "password"}
                onChange={(e) => {
                  setPasswords((prevState) => ({
                    ...prevState,
                    newPassword: e.target.value,
                  }));
                  validatePassword(e.target.value, passwords.confirmPassword);
                }}
              />
              <Input
                endContent={
                  <button
                    aria-label="toggle password visibility"
                    className="focus:outline-none"
                    name="confirmPassword"
                    type="button"
                    onClick={toggleVisibility}
                  >
                    {isVisible.confirmPassword ? (
                      <EyeSlashIcon
                        className="text-default-400 pointer-events-none"
                        height={20}
                        width={20}
                      />
                    ) : (
                      <EyeIcon
                        className="text-default-400 pointer-events-none"
                        height={20}
                        width={20}
                      />
                    )}
                  </button>
                }
                errorMessage={validationErrors.confirmPassword}
                isInvalid={Boolean(validationErrors.confirmPassword)}
                label={t("confirmPassword")}
                labelPlacement="outside"
                placeholder="Confirm Password"
                type={isVisible.confirmPassword ? "text" : "password"}
                onChange={(e) => {
                  setPasswords((prevState) => ({
                    ...prevState,
                    confirmPassword: e.target.value,
                  }));
                  validatePassword(passwords.newPassword, e.target.value);
                }}
              />
            </div>
          </CardBody>
          <CardFooter className="flex justify-end gap-4">
            <Button color="default" radius="full" variant="ghost">
              {t("cancel")}
            </Button>
            <Button
              className="text-black dark:text-black bg-lime-500 shadow-lime-500/50 hover:bg-lime-600 transition duration-200 ease-in-out"
              isLoading={isPasswordLoading}
              radius="full"
              variant="solid"
              onPress={handleUpdatePassword}
            >
              {t("updatePassword")}
            </Button>
          </CardFooter>
        </Card>
        {userInfo?.role !== "admin" && (
          <Card>
            <CardBody className="flex flex-col gap-8 md:flex-row md:gap-0 sm:px-8 sm:py-7">
              <div className="flex flex-col gap-2 flex-1">
                <h2 className="text-lg font-medium">{t("myReportsTitle")}</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t("myReportsDescription")}
                </span>
              </div>
              <div className="flex flex-col gap-8 flex-grow max-w-2xl">
                {reports.length > 0
                  ? reports.map((report) => (
                      <Card key={report?._id} isHoverable>
                        <CardHeader className="flex justify-between gap-4">
                          <p className="font-medium text-left">
                            {report?.title}
                          </p>
                          <Chip
                            className="capitalize"
                            color={
                              report?.status === "open" ? "danger" : "success"
                            }
                            size="sm"
                            variant="flat"
                          >
                            {report?.status}
                          </Chip>
                        </CardHeader>
                        <Divider />
                        <CardBody>
                          <p>{report?.description}</p>
                        </CardBody>
                      </Card>
                    ))
                  : "No reports found."}
              </div>
            </CardBody>
          </Card>
        )}
        {userInfo?.role !== "admin" && (
          <Card>
            <CardBody className="flex flex-col gap-8 md:flex-row md:gap-0 sm:px-8 sm:py-7">
              <div className="flex flex-col gap-2 flex-1">
                <h2 className="text-lg font-medium">
                  {t("deleteAccountTitle")}
                </h2>
              </div>
              <div className="flex flex-col gap-4 flex-grow max-w-2xl">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t("deleteAccountDescription")}
                </span>
              </div>
            </CardBody>
            <CardFooter className="flex justify-end gap-4">
              <Button
                color="danger"
                isDisabled={userInfo?.role === "admin"}
                radius="full"
                variant="solid"
                onPress={onOpen}
              >
                {t("deleteAccount")}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
      <DeleteAccountConfirmationModal
        isLoading={isDeleteLoading}
        isOpen={isOpen}
        onConfirm={handleDeleteAccount}
        onOpenChange={onOpenChange}
      />
    </>
  );
};

export default ProfilePage;
