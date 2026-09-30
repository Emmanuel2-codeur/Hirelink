export const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';
export const get = async (p) => (await fetch(API + p)).json();
