import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { createNotebook } from '@/api/notebooks';
import type { CreateNotebookRequest } from '@/lib/types';

export function useCreateNotebook() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: CreateNotebookRequest) => createNotebook(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      navigate(`/app/notebooks/${data.id}`);
    },
  });
}
