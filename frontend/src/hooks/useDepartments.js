import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../services/superAdminAPI';

// ============================================
// GET DEPARTMENTS
// ============================================
export const useDepartments = (params = {}) => {
  return useQuery({
    queryKey: ['departments', params],
    queryFn: () => getDepartments(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to fetch departments');
    },
  });
};

// ============================================
// GET SINGLE DEPARTMENT
// ============================================
export const useDepartment = (id) => {
  return useQuery({
    queryKey: ['department', id],
    queryFn: () => getDepartmentById(id),
    enabled: !!id,
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to fetch department details');
    },
  });
};

// ============================================
// CREATE DEPARTMENT
// ============================================
export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDepartment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      message.success(data.message || 'Department created successfully');
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to create department');
    },
  });
};

// ============================================
// UPDATE DEPARTMENT
// ============================================
export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateDepartment(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['department', variables.id] });
      message.success(data.message || 'Department updated successfully');
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to update department');
    },
  });
};

// ============================================
// DELETE DEPARTMENT
// ============================================
export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDepartment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      message.success(data.message || 'Department deleted successfully');
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to delete department');
    },
  });
};
