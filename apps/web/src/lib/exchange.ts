
import axios from 'axios';

const API_KEY = 'YOUR_EXCHANGERATE_API_KEY'; // Replace with your actual API key
const BASE_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}`;

export interface ExchangeRateResponse {
  result: string;
  base_code: string;
  target_code: string;
  conversion_rate: number;
  conversion_result: number;
}

export const getExchangeRate = async (base: string, target: string, amount: number): Promise<ExchangeRateResponse> => {
  try {
    const response = await axios.get(`${BASE_URL}/pair/${base}/${target}/${amount}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    throw error;
  }
};
