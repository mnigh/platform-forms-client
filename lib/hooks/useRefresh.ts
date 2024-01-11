"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * @description Function that watches for changes on props and initiates a server side props refresh
 * @param data The props or values that will be refreshed
 * @returns Object containing the refreshData function and isRefreshing boolean
 */
export const useRefresh = (
  data?: unknown[]
): { refreshData: () => Promise<void>; isRefreshing: boolean } => {
  const router = useRouter();
  const pathname = usePathname();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = async () => {
    setIsRefreshing(true);
    router.replace(pathname);
  };

  useEffect(() => {
    setIsRefreshing(false);
  }, [data]);

  return { refreshData, isRefreshing };
};
