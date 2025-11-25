"use client";
import { Key, useCallback, useState } from "react";
import { Tooltip } from "@heroui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { Chip } from "@heroui/chip";
import { User } from "@heroui/user";
import {
  ChatBubbleLeftRightIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { useDisclosure } from "@heroui/modal";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/routing";
import ResetPasswordConfirmationModal from "@/components/reset-password-confirmation-modal";
import { UserDataType } from "@/types/dataTypes";
import { axiosInstance } from "@/utils/axiosInstance";
import DeleteUserConfirmationModal from "@/components/delete-user-confirmation-modal";

export const columns = [
  { name: "NAME", uid: "name" },
  { name: "ROLE", uid: "role" },
  { name: "STATUS", uid: "status" },
  { name: "ACTIONS", uid: "actions" },
];

const statusColorMap = {
  active: "success",
  paused: "danger",
  vacation: "warning",
};

export default function UsersTable({
  data,
  fetchData,
}: {
  data: UserDataType[];
  fetchData: () => void;
}) {
  const router = useRouter();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
    onClose: onDeleteClose,
  } = useDisclosure();

  const [selectedUserForResetPassword, setSelectedUserForResetPassword] =
    useState<string | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<
    string | null
  >(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isResetPasswordLoading, setIsResetPasswordLoading] = useState(false);

  const t = useTranslations("AdminUsersPage");

  const handleResetPasswordClick = (id: string) => {
    if (id) {
      setSelectedUserForResetPassword(id);
      onOpen();
    }
  };

  const handleResetPassword = async () => {
    try {
      setIsResetPasswordLoading(true);
      await axiosInstance.put(
        `/users/reset-password/${selectedUserForResetPassword}`,
      );

      setIsResetPasswordLoading(false);
      onClose();
    } catch (e) {
      setIsResetPasswordLoading(false);
      console.log(e);
    }
  };

  const handleDeleteClick = (id: string) => {
    if (id) {
      setSelectedUserForDelete(id);
      onDeleteOpen();
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleteLoading(true);
      await axiosInstance.delete(
        `/users/admin/delete/${selectedUserForDelete}`,
      );

      setIsDeleteLoading(false);
      fetchData();
      onDeleteClose();
    } catch (e) {
      setIsDeleteLoading(false);
      console.log(e);
    }
  };

  const renderCell = useCallback((user: UserDataType, columnKey: Key) => {
    // @ts-ignore
    const cellValue = user[columnKey];

    switch (columnKey) {
      case "name":
        return (
          <User
            avatarProps={{ radius: "lg" }}
            description={user.email}
            name={user?.firstName + " " + user?.lastName}
          >
            {user.email}
          </User>
        );
      case "role":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize">{cellValue}</p>
          </div>
        );
      case "status":
        return (
          <Chip
            className="capitalize"
            // @ts-ignore
            // color={statusColorMap[user.status]}
            color={statusColorMap["active"]}
            size="sm"
            variant="flat"
          >
            {/*{cellValue}*/}
            Active
          </Chip>
        );
      case "actions":
        return user?.role === "admin" ? (
          ""
        ) : (
          <div className="relative flex items-center gap-2">
            <Tooltip content={t("tooltip.chatHistory")}>
              <span
                className="text-lg text-default-400 cursor-pointer active:opacity-50"
                role="button"
                onClick={() => router.push(`/admin/users/${user._id}`)}
              >
                <ChatBubbleLeftRightIcon height={20} width={20} />
              </span>
            </Tooltip>
            <Tooltip content={t("tooltip.resetPassword")}>
              <span
                className="text-lg text-default-400 cursor-pointer active:opacity-50"
                role="button"
                onClick={() => handleResetPasswordClick(user._id)}
              >
                <PencilSquareIcon height={20} width={20} />
              </span>
            </Tooltip>
            <Tooltip color="danger" content={t("tooltip.delete")}>
              <span
                className="text-lg text-danger cursor-pointer active:opacity-50"
                role="button"
                onClick={() => handleDeleteClick(user._id)}
              >
                <TrashIcon height={20} width={20} />
              </span>
            </Tooltip>
          </div>
        );
      default:
        return cellValue;
    }
  }, []);

  return (
    <>
      <Table removeWrapper>
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === "actions" ? "center" : "start"}
            >
              {t(`table.${column.name}`)}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={data}>
          {(item) => (
            <TableRow key={item._id}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
      <ResetPasswordConfirmationModal
        isLoading={isResetPasswordLoading}
        isOpen={isOpen}
        onConfirm={handleResetPassword}
        onOpenChange={onOpenChange}
      />
      <DeleteUserConfirmationModal
        isLoading={isDeleteLoading}
        isOpen={isDeleteOpen}
        onConfirm={handleDelete}
        onOpenChange={onDeleteOpenChange}
      />
    </>
  );
}
