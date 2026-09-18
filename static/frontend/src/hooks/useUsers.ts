import { useState, useCallback } from "react";
import { requestJira } from "@forge/bridge";

export interface UserMap {
  [accountId: string]: string;
}

export function useUsers() {
  const [userMap, setUserMap] = useState<UserMap>({
    system: "System",
  });
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);

  const fetchUsers = useCallback(
    async (accountIds: string[]) => {
      const missingIds = Array.from(new Set(accountIds)).filter(
        (id) => id && id !== "system" && id !== "N/A" && !userMap[id]
      );

      if (missingIds.length === 0) return;

      setLoadingUsers(true);
      const newMap: UserMap = {};

      const CHUNK_SIZE = 50;
      for (let i = 0; i < missingIds.length; i += CHUNK_SIZE) {
        const chunk = missingIds.slice(i, i + CHUNK_SIZE);
        const params = new URLSearchParams();
        params.append("maxResults", "100"); // Ensure we fetch up to 100 users per request
        chunk.forEach((id) => params.append("accountId", id));

        try {
          const res = await requestJira(`/rest/api/3/user/bulk?${params.toString()}`);
          if (res.ok) {
            const data = await res.json();
            // Jira v3 returns paginated object { values: [...] }
            const users = Array.isArray(data) ? data : data.values || [];

            users.forEach((user: any) => {
              if (user.accountId) {
                newMap[user.accountId] = user.displayName || user.accountId;
              }
            });
          }
        } catch (err) {
          console.error("Failed to fetch bulk users:", err);
        }
      }

      if (Object.keys(newMap).length > 0) {
        setUserMap((prev) => ({
          ...prev,
          ...newMap,
        }));
      }
      setLoadingUsers(false);
    },
    [userMap]
  );

  const getUserName = useCallback(
    (accountId: string) => {
      if (!accountId || accountId === "N/A") return "N/A";
      if (accountId === "system") return "System";

      return (
        userMap[accountId] ||
        (accountId.length > 12 ? `${accountId.substring(0, 12)}...` : accountId)
      );
    },
    [userMap]
  );

  return {
    userMap,
    loadingUsers,
    fetchUsers,
    getUserName,
  };
}