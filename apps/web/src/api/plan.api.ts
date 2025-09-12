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
    const response = await api.get('/plan');
    return response.data;
};

/**
 * Fetches a single travel plan by its ID.
 */
export const getPlanById = async (planId: string): Promise<Plan> => {
    const response = await api.get(`/plan/${planId}`);
    return response.data;
};

/**
 * Creates a new travel plan.
 */
export const createPlan = async (planData: Omit<Plan, 'id'>): Promise<Plan> => {
    const response = await api.post('/plan', planData);
    return response.data;
};

/**
 * Updates an existing travel plan.
 */
export const updatePlan = async (updateData: PlanUpdateData): Promise<Plan> => {
    const { planId, ...data } = updateData;
    const response = await api.put(`/plan/${planId}`, data);
    return response.data;
};
