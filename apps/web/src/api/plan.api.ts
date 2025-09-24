import { api } from '../lib/api';

export interface ScheduleItem {
    id: string;
    time: string;
    place: string;
    memo: string;
}

export interface Plan {
    id: string;
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    schedule: ScheduleItem[];
}

export interface PlanUpdateData extends Partial<Omit<Plan, 'id'>> {
    planId: string;
}

/**
 * Fetches all travel plans for the current user.
 */
export const getUserPlans = async (): Promise<Plan[]> => {
    const response = await api.get('/plans'); // Corrected endpoint from /plan to /plans
    return response.data;
};

/**
 * Fetches a single travel plan by its ID.
 */
export const getPlanById = async (planId: string): Promise<Plan> => {
    const response = await api.get(`/plans/${planId}`); // Also corrected for consistency
    return response.data;
};

/**
 * Creates a new travel plan.
 */
export const createPlan = async (planData: Omit<Plan, 'id'>): Promise<Plan> => {
    const response = await api.post('/plans', planData); // Also corrected for consistency
    return response.data;
};

/**
 * Updates an existing travel plan.
 */
export const updatePlan = async (updateData: PlanUpdateData): Promise<Plan> => {
    const { planId, ...data } = updateData;
    const response = await api.put(`/plans/${planId}`, data); // Also corrected for consistency
    return response.data;
};
