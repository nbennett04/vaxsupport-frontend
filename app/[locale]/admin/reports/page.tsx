"use client";
import React, { useEffect, useState } from "react";

import ReportsTable from "@/components/reports-table";
import { axiosInstance } from "@/utils/axiosInstance";
import { ReportType } from "@/types/dataTypes";
import Loader from "@/components/loader";

const ReportsPage = () => {
  const [reports, setReports] = useState<ReportType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get("/reports");

      setReports(res.data);
      setIsLoading(false);
    } catch (e) {
      console.log(e);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <Loader isLoading={isLoading} />
      <ReportsTable data={reports} fetchData={fetchData} />
    </div>
  );
};

export default ReportsPage;
