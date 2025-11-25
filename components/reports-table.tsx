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
import { EyeIcon, TrashIcon } from "@heroicons/react/24/solid";
import { useDisclosure } from "@heroui/modal";
import { useTranslations } from "next-intl";
import dayjs from "dayjs";

import ViewReportModal from "@/components/view-report-modal";
import { ReportType } from "@/types/dataTypes";
import DeleteReportConfirmationModal from "@/components/delete-report-confirmation-modal";
import { axiosInstance } from "@/utils/axiosInstance";

export const columns = [
  { name: "TITLE", uid: "title" },
  { name: "REPORTED_BY", uid: "reportedBy" },
  { name: "STATUS", uid: "status" },
  { name: "REPORTED_ON", uid: "reportedOn" },
  { name: "ACTIONS", uid: "actions" },
];

const statusColorMap = {
  resolved: "success",
  open: "danger",
};

export default function ReportsTable({
  data,
  fetchData,
}: {
  data: ReportType[];
  fetchData: () => void;
}) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const {
    isOpen: isConfirmDeleteModalOpen,
    onOpen: onConfrimDeleteModalOpen,
    onOpenChange: onConfirmDeleteModalOpenChange,
    onClose: onConfirmDeleteModalClose,
  } = useDisclosure();
  const t = useTranslations("AdminReportsPage");
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [selectedReportForDelete, setSelectedReportForDelete] = useState<
    string | null
  >(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const handleViewReportClick = (report: ReportType) => {
    if (report) {
      setSelectedReport(report);
      onOpen();
    }
  };

  const handleDeleteReportClick = (reportId: string) => {
    if (reportId) {
      onConfrimDeleteModalOpen();
      setSelectedReportForDelete(reportId);
    }
  };

  const handleDeleteReport = async () => {
    try {
      setIsDeleteLoading(true);
      await axiosInstance.delete(`/reports/${selectedReportForDelete}`);

      setIsDeleteLoading(false);
      onConfirmDeleteModalClose();
      fetchData();
    } catch (e) {
      setIsDeleteLoading(false);
      console.log(e);
    }
  };

  const renderCell = useCallback((report: ReportType, columnKey: Key) => {
    // @ts-ignore
    const cellValue = report[columnKey];

    switch (columnKey) {
      case "title":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize">{report.title}</p>
          </div>
        );
      case "reportedBy":
        return (
          <User
            avatarProps={{ radius: "lg" }}
            description={report.user.email}
            name={`${report.user.firstName} ${report.user.lastName}`}
          >
            {report.user.email}
          </User>
        );
      case "status":
        return (
          <Chip
            className="capitalize"
            // @ts-ignore
            color={statusColorMap[report.status]}
            size="sm"
            variant="flat"
          >
            {cellValue}
          </Chip>
        );
      case "reportedOn":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm">
              {dayjs(report.createdAt).format("DD MMM, YYYY") +
                " at " +
                dayjs(report.createdAt).format("HH:mm")}
            </p>
          </div>
        );
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip content={t("tooltip.details")}>
              <span
                className="text-lg text-default-400 cursor-pointer active:opacity-50"
                role="button"
                onClick={() => handleViewReportClick(report)}
              >
                <EyeIcon height={20} width={20} />
              </span>
            </Tooltip>
            <Tooltip color="danger" content={t("tooltip.delete")}>
              <span
                className="text-lg text-danger cursor-pointer active:opacity-50"
                role="button"
                onClick={() => handleDeleteReportClick(report?._id)}
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
      <ViewReportModal
        data={selectedReport}
        fetchData={fetchData}
        isOpen={isOpen}
        onClose={onClose}
        onOpenChange={onOpenChange}
      />
      <DeleteReportConfirmationModal
        isLoading={isDeleteLoading}
        isOpen={isConfirmDeleteModalOpen}
        onConfirm={handleDeleteReport}
        onOpenChange={onConfirmDeleteModalOpenChange}
      />
    </>
  );
}
