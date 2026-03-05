// src/services/departmentService.js
import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

export const getAllDepartments = async (activeOnly = false) => {
  let query = supabase
    .from('chat_departments')
    .select('*')
    .order('sort_order', { ascending: true });

  if (activeOnly) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) throw new AppError('Failed to fetch departments.', 500);
  return data;
};

export const getDepartmentById = async (id) => {
  const { data, error } = await supabase
    .from('chat_departments')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) throw new AppError('Department not found.', 404);
  return data;
};

export const createDepartment = async (body) => {
  const { data, error } = await supabase
    .from('chat_departments')
    .insert(body)
    .select()
    .single();

  if (error) throw new AppError('Failed to create department.', 500);
  return data;
};

export const updateDepartment = async (id, body) => {
  const { data, error } = await supabase
    .from('chat_departments')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) throw new AppError('Failed to update department.', 500);
  return data;
};

export const deleteDepartment = async (id) => {
  const { error } = await supabase
    .from('chat_departments')
    .delete()
    .eq('id', id);

  if (error) throw new AppError('Failed to delete department.', 500);
  return { id };
};