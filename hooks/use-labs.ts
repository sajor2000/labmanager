import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { labsApi, cacheUtils, optimisticHelpers } from '@/lib/api/labs';
import type { 
  Lab, 
  CreateLabPayload, 
  UpdateLabPayload,
  AddMemberPayload,
  UpdateMemberPayload 
} from '@/types/lab';

/**
 * Hook to fetch all labs
 */
export function useLabs() {
  return useQuery({
    queryKey: cacheUtils.keys.lists(),
    queryFn: labsApi.getAll,
    staleTime: cacheUtils.staleTime.list,
  });
}

/**
 * Hook to fetch a single lab
 */
export function useLab(labId: string) {
  return useQuery({
    queryKey: cacheUtils.keys.detail(labId),
    queryFn: () => labsApi.getById(labId),
    staleTime: cacheUtils.staleTime.detail,
    enabled: !!labId,
  });
}

/**
 * Hook to create a new lab with optimistic update
 */
export function useCreateLab() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: labsApi.create,
    onMutate: async (payload: CreateLabPayload) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: cacheUtils.keys.lists() });

      // Snapshot the previous value
      const previousLabs = queryClient.getQueryData<Lab[]>(cacheUtils.keys.lists());

      // Optimistically update to the new value
      const optimisticLab = optimisticHelpers.createOptimisticLab(payload);
      queryClient.setQueryData<Lab[]>(cacheUtils.keys.lists(), (old) => {
        return [...(old || []), optimisticLab];
      });

      // Return a context object with the snapshotted value
      return { previousLabs, optimisticLab };
    },
    onError: (err, payload, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousLabs) {
        queryClient.setQueryData(cacheUtils.keys.lists(), context.previousLabs);
      }
      toast.error('Failed to create lab');
    },
    onSuccess: (data, payload, context) => {
      // Replace optimistic lab with real data
      queryClient.setQueryData<Lab[]>(cacheUtils.keys.lists(), (old) => {
        if (!old) return [data];
        return old.map(lab => 
          lab.id === context?.optimisticLab.id ? data : lab
        );
      });
      toast.success('Lab created successfully');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: cacheUtils.keys.lists() });
    },
  });
}

/**
 * Hook to update a lab with optimistic update
 */
export function useUpdateLab(labId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateLabPayload) => labsApi.update(labId, payload),
    onMutate: async (payload) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: cacheUtils.keys.detail(labId) });
      await queryClient.cancelQueries({ queryKey: cacheUtils.keys.lists() });

      // Snapshot the previous values
      const previousLab = queryClient.getQueryData<Lab>(cacheUtils.keys.detail(labId));
      const previousLabs = queryClient.getQueryData<Lab[]>(cacheUtils.keys.lists());

      // Optimistically update the lab
      if (previousLab) {
        const updatedLab = optimisticHelpers.updateOptimisticLab(previousLab, payload);
        
        // Update single lab query
        queryClient.setQueryData(cacheUtils.keys.detail(labId), updatedLab);
        
        // Update labs list query
        queryClient.setQueryData<Lab[]>(cacheUtils.keys.lists(), (old) => {
          if (!old) return [];
          return old.map(lab => lab.id === labId ? updatedLab : lab);
        });
      }

      return { previousLab, previousLabs };
    },
    onError: (err, payload, context) => {
      // Roll back on error
      if (context?.previousLab) {
        queryClient.setQueryData(cacheUtils.keys.detail(labId), context.previousLab);
      }
      if (context?.previousLabs) {
        queryClient.setQueryData(cacheUtils.keys.lists(), context.previousLabs);
      }
      toast.error('Failed to update lab');
    },
    onSuccess: () => {
      toast.success('Lab updated successfully');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: cacheUtils.keys.detail(labId) });
      queryClient.invalidateQueries({ queryKey: cacheUtils.keys.lists() });
    },
  });
}

/**
 * Hook to delete a lab with optimistic update
 */
export function useDeleteLab() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: labsApi.delete,
    onMutate: async (labId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: cacheUtils.keys.lists() });

      // Snapshot the previous value
      const previousLabs = queryClient.getQueryData<Lab[]>(cacheUtils.keys.lists());

      // Optimistically remove the lab
      queryClient.setQueryData<Lab[]>(cacheUtils.keys.lists(), (old) => {
        if (!old) return [];
        return optimisticHelpers.removeOptimisticLab(old, labId);
      });

      return { previousLabs };
    },
    onError: (err, labId, context) => {
      // Roll back on error
      if (context?.previousLabs) {
        queryClient.setQueryData(cacheUtils.keys.lists(), context.previousLabs);
      }
      toast.error('Failed to delete lab');
    },
    onSuccess: () => {
      toast.success('Lab deleted successfully');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: cacheUtils.keys.lists() });
    },
  });
}

/**
 * Hook to manage lab members
 */
export function useLabMembers(labId: string) {
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: cacheUtils.keys.members(labId),
    queryFn: () => labsApi.members.getAll(labId),
    staleTime: cacheUtils.staleTime.members,
    enabled: !!labId,
  });

  const addMember = useMutation({
    mutationFn: (payload: AddMemberPayload) => labsApi.members.add(labId, payload),
    onSuccess: () => {
      toast.success('Member added successfully');
      queryClient.invalidateQueries({ queryKey: cacheUtils.keys.members(labId) });
      queryClient.invalidateQueries({ queryKey: cacheUtils.keys.detail(labId) });
    },
    onError: () => {
      toast.error('Failed to add member');
    },
  });

  const updateMember = useMutation({
    mutationFn: (payload: UpdateMemberPayload) => labsApi.members.update(labId, payload),
    onSuccess: () => {
      toast.success('Member updated successfully');
      queryClient.invalidateQueries({ queryKey: cacheUtils.keys.members(labId) });
    },
    onError: () => {
      toast.error('Failed to update member');
    },
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => labsApi.members.remove(labId, userId),
    onSuccess: () => {
      toast.success('Member removed successfully');
      queryClient.invalidateQueries({ queryKey: cacheUtils.keys.members(labId) });
      queryClient.invalidateQueries({ queryKey: cacheUtils.keys.detail(labId) });
    },
    onError: () => {
      toast.error('Failed to remove member');
    },
  });

  return {
    members: membersQuery.data,
    isLoading: membersQuery.isLoading,
    error: membersQuery.error,
    addMember,
    updateMember,
    removeMember,
  };
}