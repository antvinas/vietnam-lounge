
export const fetchWeather = async (city: string) => {
  // Simulate API call
  return {
    city,
    temperature: Math.floor(Math.random() * 15) + 20, // 20-34 C
    condition: ['Sunny', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 3)],
  };
};

export const fetchExchangeRates = async () => {
  // Simulate API call
  return {
    USD: 25450,
    EUR: 27200,
    JPY: 162.5,
  };
};
