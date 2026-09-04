import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api";
import { authQueryKey } from "./auth";

export const createAppQueryClient = (isTest = false) => {
  let queryClient: QueryClient;

  const clearExpiredSession = (error: Error) => {
    if (error instanceof ApiError && error.status === 401) {
      queryClient.setQueryData(authQueryKey, null);
    }
  };

  queryClient = new QueryClient({
    queryCache: new QueryCache({ onError: clearExpiredSession }),
    mutationCache: new MutationCache({ onError: clearExpiredSession }),
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: isTest ? false : 1,
        staleTime: 15_000,
      },
      mutations: { retry: false },
    },
  });

  return queryClient;
};
