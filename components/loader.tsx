import React from "react";
import { Spinner } from "@heroui/spinner";
import clsx from "clsx";

const Loader = ({
  isLoading = false,
  fullPage = false,
}: {
  isLoading: boolean;
  fullPage?: boolean;
}) => {
  return (
    <>
      {isLoading ? (
        <div
          className={clsx(
            fullPage ? "fixed" : "absolute",
            "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 bg-white/50 dark:bg-black/50 backdrop-blur-lg h-full w-full flex justify-center items-center",
          )}
        >
          <Spinner
            classNames={{
              circle1: "border-b-lime-500",
              circle2: "border-b-lime-500",
            }}
            size="lg"
          />
        </div>
      ) : (
        ""
      )}
    </>
  );
};

export default Loader;
