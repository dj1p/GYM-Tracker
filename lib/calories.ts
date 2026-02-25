// MET (Metabolic Equivalent of Task) values for different activities
const MET_VALUES = {
  // Strength training
  strength_light: 3.5,
  strength_moderate: 5.0,
  strength_vigorous: 6.0,
  
  // Cardio
  elliptical_moderate: 5.0,
  elliptical_vigorous: 7.0,
  treadmill_walking: 3.5,
  treadmill_jogging: 7.0,
  treadmill_running: 10.0,
  bike_moderate: 5.5,
  bike_vigorous: 8.0,
  rowing_moderate: 6.0,
  rowing_vigorous: 8.5
};

// Estimate calories burned: (MET × weight in kg × duration in hours)
export function estimateStrengthCalories(
  durationMinutes: number,
  weightKg: number = 85, // Tor's approximate weight
  intensity: 'light' | 'moderate' | 'vigorous' = 'moderate'
): number {
  const met = MET_VALUES[`strength_${intensity}`];
  const hours = durationMinutes / 60;
  return Math.round(met * weightKg * hours);
}

export function estimateCardioCalories(
  equipment: string,
  durationMinutes: number,
  avgSpeedKmh: number | null = null,
  weightKg: number = 85
): number {
  const hours = durationMinutes / 60;
  let met = 5.0; // default moderate
  
  if (equipment.toLowerCase().includes('elliptical')) {
    met = avgSpeedKmh && avgSpeedKmh > 10 ? MET_VALUES.elliptical_vigorous : MET_VALUES.elliptical_moderate;
  } else if (equipment.toLowerCase().includes('treadmill')) {
    if (avgSpeedKmh) {
      if (avgSpeedKmh < 6) met = MET_VALUES.treadmill_walking;
      else if (avgSpeedKmh < 10) met = MET_VALUES.treadmill_jogging;
      else met = MET_VALUES.treadmill_running;
    } else {
      met = MET_VALUES.treadmill_jogging;
    }
  } else if (equipment.toLowerCase().includes('bike')) {
    met = avgSpeedKmh && avgSpeedKmh > 20 ? MET_VALUES.bike_vigorous : MET_VALUES.bike_moderate;
  } else if (equipment.toLowerCase().includes('row')) {
    met = avgSpeedKmh && avgSpeedKmh > 12 ? MET_VALUES.rowing_vigorous : MET_VALUES.rowing_moderate;
  }
  
  return Math.round(met * weightKg * hours);
}

export function estimateMixedSessionCalories(
  strengthMinutes: number,
  cardioMinutes: number,
  cardioIntensity: 'moderate' | 'vigorous' = 'moderate',
  weightKg: number = 85
): number {
  const strengthCals = estimateStrengthCalories(strengthMinutes, weightKg);
  const cardioCals = estimateCardioCalories('elliptical', cardioMinutes, cardioIntensity === 'vigorous' ? 11 : 8, weightKg);
  return strengthCals + cardioCals;
}
