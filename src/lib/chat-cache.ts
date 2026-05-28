import { QueryClient } from "@tanstack/react-query";

type ChatPage = {
  items: unknown[];
  nextCursor?: string | null;
};

type ChatInfiniteData = {
  pages: ChatPage[];
  pageParams: unknown[];
};

export function appendChatMessage(
  queryClient: QueryClient,
  queryKey: string,
  message: unknown
) {
  queryClient.setQueryData<ChatInfiniteData>([queryKey], (oldData) => {
    if (!oldData?.pages?.length) {
      return {
        pages: [{ items: [message] }],
        pageParams: [undefined],
      };
    }

    const firstPage = oldData.pages[0];
    const exists = firstPage.items.some(
      (item) => (item as { id?: string }).id === (message as { id?: string }).id
    );
    if (exists) return oldData;

    return {
      ...oldData,
      pages: [
        { ...firstPage, items: [message, ...firstPage.items] },
        ...oldData.pages.slice(1),
      ],
    };
  });
}

export function updateChatMessage(
  queryClient: QueryClient,
  queryKey: string,
  message: unknown
) {
  queryClient.setQueryData<ChatInfiniteData>([queryKey], (oldData) => {
    if (!oldData?.pages?.length) return oldData;

    const messageId = (message as { id: string }).id;

    return {
      ...oldData,
      pages: oldData.pages.map((page) => ({
        ...page,
        items: page.items.map((item) =>
          (item as { id: string }).id === messageId ? message : item
        ),
      })),
    };
  });
}

export function removeOptimisticMessage(
  queryClient: QueryClient,
  queryKey: string,
  optimisticId: string
) {
  queryClient.setQueryData<ChatInfiniteData>([queryKey], (oldData) => {
    if (!oldData?.pages?.length) return oldData;

    return {
      ...oldData,
      pages: oldData.pages.map((page) => ({
        ...page,
        items: page.items.filter(
          (item) => (item as { id: string }).id !== optimisticId
        ),
      })),
    };
  });
}
