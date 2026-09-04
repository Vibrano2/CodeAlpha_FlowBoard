import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authQueryKey, getCurrentUser, login, logout, register } from "../lib/auth";

export const useCurrentUser = () =>
  useQuery({
    queryKey: authQueryKey,
    queryFn: getCurrentUser,
    retry: false,
  });

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess(response) {
      queryClient.setQueryData(authQueryKey, response.data.user);
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: register,
    onSuccess(response) {
      queryClient.setQueryData(authQueryKey, response.data.user);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSettled() {
      queryClient.setQueryData(authQueryKey, null);
      queryClient.removeQueries({ predicate: ({ queryKey }) => queryKey[0] !== "auth" });
    },
  });
};
