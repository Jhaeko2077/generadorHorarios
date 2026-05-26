import { useQuery } from "@tanstack/react-query";
import { me } from "../api/auth";
import { getToken } from "../api/client";

export function useAuth() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: me,
    enabled: Boolean(getToken()),
    retry: false
  });
}
