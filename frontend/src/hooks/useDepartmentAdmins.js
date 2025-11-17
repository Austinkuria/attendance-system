import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
    getDepartmentAdmins,
    getDepartmentAdminById,
    createDepartmentAdmin,
    updateDepartmentAdmin,
    deleteDepartmentAdmin,
    assignDepartments,
    getDepartmentAdminStats,
} from '../services/superAdminAPI';

// ============================================
// GET DEPARTMENT ADMINS
// ============================================
export const useDepartmentAdmins = (params = {}) => {
    return useQuery({
        queryKey: ['departmentAdmins', params],
        queryFn: () => getDepartmentAdmins(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
        onError: (error) => {
            message.error(error.response?.data?.message || 'Failed to fetch department admins');
        },
    });
};

// ============================================
// GET SINGLE DEPARTMENT ADMIN
// ============================================
export const useDepartmentAdmin = (id) => {
    return useQuery({
        queryKey: ['departmentAdmin', id],
        queryFn: () => getDepartmentAdminById(id),
        enabled: !!id,
        onError: (error) => {
            message.error(error.response?.data?.message || 'Failed to fetch admin details');
        },
    });
};

// ============================================
// GET DEPARTMENT ADMIN STATS
// ============================================
export const useDepartmentAdminStats = () => {
    return useQuery({
        queryKey: ['departmentAdminStats'],
        queryFn: getDepartmentAdminStats,
        staleTime: 10 * 60 * 1000, // 10 minutes
        onError: (error) => {
            message.error(error.response?.data?.message || 'Failed to fetch statistics');
        },
    });
};

// ============================================
// CREATE DEPARTMENT ADMIN
// ============================================
export const useCreateDepartmentAdmin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createDepartmentAdmin,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['departmentAdmins'] });
            queryClient.invalidateQueries({ queryKey: ['departmentAdminStats'] });
            message.success(data.message || 'Department admin created successfully');
        },
        onError: (error) => {
            message.error(error.response?.data?.message || 'Failed to create department admin');
        },
    });
};

// ============================================
// UPDATE DEPARTMENT ADMIN
// ============================================
export const useUpdateDepartmentAdmin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => updateDepartmentAdmin(id, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['departmentAdmins'] });
            queryClient.invalidateQueries({ queryKey: ['departmentAdmin', variables.id] });
            message.success(data.message || 'Department admin updated successfully');
        },
        onError: (error) => {
            message.error(error.response?.data?.message || 'Failed to update department admin');
        },
    });
};

// ============================================
// DELETE DEPARTMENT ADMIN
// ============================================
export const useDeleteDepartmentAdmin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteDepartmentAdmin,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['departmentAdmins'] });
            queryClient.invalidateQueries({ queryKey: ['departmentAdminStats'] });
            message.success(data.message || 'Department admin deleted successfully');
        },
        onError: (error) => {
            message.error(error.response?.data?.message || 'Failed to delete department admin');
        },
    });
};

// ============================================
// ASSIGN DEPARTMENTS TO ADMIN
// ============================================
export const useAssignDepartments = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ adminId, departmentIds }) => assignDepartments(adminId, departmentIds),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['departmentAdmins'] });
            queryClient.invalidateQueries({ queryKey: ['departmentAdmin', variables.adminId] });
            message.success(data.message || 'Departments assigned successfully');
        },
        onError: (error) => {
            message.error(error.response?.data?.message || 'Failed to assign departments');
        },
    });
};
