"use client";
import React, { useEffect, useState } from "react";

import UsersTable from "@/components/users-table";
import { axiosInstance } from "@/utils/axiosInstance";
import { UserDataType } from "@/types/dataTypes";
import Loader from "@/components/loader";

const UsersPage = () => {
  const [users, setUsers] = useState<UserDataType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await axiosInstance.get("/users");

      setUsers(res?.data);
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
      <UsersTable data={users} fetchData={fetchData} />
    </div>
  );
};

export default UsersPage;
