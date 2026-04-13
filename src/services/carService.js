// carService.js - Simplified car system (7 cars, unlock every 3 levels)
import { getDatabase, ref, get, update } from "firebase/database";

// Regular car definitions - 7 cars unlocked by leveling up (maps to car-1.png to car-7.png)
export const REGULAR_CARS = {
  car1: {
    id: "car1",
    imageFile: "car-1.png",
    displayName: "ROOKIE",
    icon: "🚗",
    levelRequired: 3,
    description: "Beginning your racing journey",
    order: 1,
  },
  car2: {
    id: "car2",
    imageFile: "car-2.png",
    displayName: "SPRINTER",
    icon: "🏎️",
    levelRequired: 6,
    description: "Finding your speed",
    order: 2,
  },
  car3: {
    id: "car3",
    imageFile: "car-3.png",
    displayName: "RACER",
    icon: "🏁",
    levelRequired: 9,
    description: "Ready to compete",
    order: 3,
  },
  car4: {
    id: "car4",
    imageFile: "car-4.png",
    displayName: "PRODIGY",
    icon: "⚡",
    levelRequired: 12,
    description: "Natural talent on the track",
    order: 4,
  },
  car5: {
    id: "car5",
    imageFile: "car-5.png",
    displayName: "ELITE",
    icon: "💫",
    levelRequired: 15,
    description: "Among the best",
    order: 5,
  },
  car6: {
    id: "car6",
    imageFile: "car-6.png",
    displayName: "MASTER",
    icon: "👑",
    levelRequired: 18,
    description: "Master of the track",
    order: 6,
  },
  car7: {
    id: "car7",
    imageFile: "car-7.png",
    displayName: "LEGEND",
    icon: "🌟",
    levelRequired: 24,
    description: "Legendary status",
    order: 7,
  },
};

// Special car definitions - Weekly top 3 cars (maps to golden.png, silver.png, bronze.png)
export const SPECIAL_CARS = {
  golden: {
    id: "golden",
    imageFile: "golden.png",
    displayName: "💫 PHANTOM",
    icon: "💫",
    rank: 1,
    description: "Weekly #1 Champion - Elite speed",
    color: "#FFD700",
    glowColor: "rgba(255, 215, 0, 0.5)",
  },
  silver: {
    id: "silver",
    imageFile: "silver.png",
    displayName: "🌪️ CYCLONE",
    icon: "🌪️",
    rank: 2,
    description: "Weekly #2 - Whirlwind of speed",
    color: "#C0C0C0",
    glowColor: "rgba(192, 192, 192, 0.5)",
  },
  bronze: {
    id: "bronze",
    imageFile: "bronze.png",
    displayName: "⚡ VELOCITY",
    icon: "⚡",
    rank: 3,
    description: "Weekly #3 - Lightning fast",
    color: "#CD7F32",
    glowColor: "rgba(205, 127, 50, 0.5)",
  },
};

// Get regular car by its ID
export const getRegularCarById = (carId) => {
  return REGULAR_CARS[carId] || REGULAR_CARS.car1;
};

// Get special car by its ID
export const getSpecialCarById = (carId) => {
  return SPECIAL_CARS[carId] || null;
};

// Get the regular car for a given level (updated for 24 levels, every 3 levels)
export const getRegularCarForLevel = (level) => {
  const levelNum = parseInt(level);

  if (levelNum <= 3) return REGULAR_CARS.car1;
  if (levelNum <= 6) return REGULAR_CARS.car2;
  if (levelNum <= 9) return REGULAR_CARS.car3;
  if (levelNum <= 12) return REGULAR_CARS.car4;
  if (levelNum <= 15) return REGULAR_CARS.car5;
  if (levelNum <= 18) return REGULAR_CARS.car6;
  return REGULAR_CARS.car7;
};

// Get display name for any car
export const getCarDisplayName = (carId) => {
  if (REGULAR_CARS[carId]) {
    return REGULAR_CARS[carId].displayName;
  }
  if (SPECIAL_CARS[carId]) {
    return SPECIAL_CARS[carId].displayName;
  }
  return "ROOKIE";
};

// Get car icon for display
export const getCarIcon = (carId) => {
  if (REGULAR_CARS[carId]) {
    return REGULAR_CARS[carId].icon;
  }
  if (SPECIAL_CARS[carId]) {
    return SPECIAL_CARS[carId].icon;
  }
  return "🚗";
};

// Check if user has unlocked a specific regular car
export const hasUnlockedRegularCar = async (userId, carId) => {
  try {
    const db = getDatabase();
    const userRef = ref(db, `users/${userId}/unlockedCars`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) return false;

    const unlockedCars = snapshot.val() || [];
    return unlockedCars.includes(carId);
  } catch (error) {
    console.error("Error checking unlocked car:", error);
    return false;
  }
};

// Get all regular cars unlocked by user
export const getUnlockedRegularCars = async (userId) => {
  try {
    const db = getDatabase();
    const userRef = ref(db, `users/${userId}/unlockedCars`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) return [];

    const unlockedCarIds = snapshot.val() || [];

    return unlockedCarIds
      .map((id) => REGULAR_CARS[id])
      .filter((car) => car)
      .sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Error getting unlocked cars:", error);
    return [];
  }
};

// Check and unlock car when user reaches a milestone level (updated for 7 cars)
export const checkAndUnlockCar = async (userId, newLevel) => {
  try {
    const db = getDatabase();
    const carForLevel = getRegularCarForLevel(newLevel);
    const milestoneLevels = [3, 6, 9, 12, 15, 18, 24];

    if (!milestoneLevels.includes(parseInt(newLevel))) {
      return { unlocked: false, car: null };
    }

    const userCarsRef = ref(db, `users/${userId}/unlockedCars`);
    const snapshot = await get(userCarsRef);
    const unlockedCars = snapshot.exists() ? snapshot.val() || [] : [];

    if (unlockedCars.includes(carForLevel.id)) {
      return { unlocked: false, car: carForLevel };
    }

    const updatedCars = [...unlockedCars, carForLevel.id];
    await update(ref(db, `users/${userId}`), {
      unlockedCars: updatedCars,
    });

    return {
      unlocked: true,
      car: carForLevel,
    };
  } catch (error) {
    console.error("Error unlocking car:", error);
    return { unlocked: false, car: null, error };
  }
};

// Assign special car to weekly winner
export const assignSpecialCar = async (userId, rank) => {
  try {
    let specialCarId = null;

    if (rank === 1) specialCarId = "golden";
    else if (rank === 2) specialCarId = "silver";
    else if (rank === 3) specialCarId = "bronze";
    else return { success: false };

    const specialCar = SPECIAL_CARS[specialCarId];
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    const db = getDatabase();
    await update(ref(db, `users/${userId}`), {
      specialCar: {
        id: specialCarId,
        awardedAt: Date.now(),
        expiresAt: expiresAt,
        rank: rank,
      },
    });

    return {
      success: true,
      specialCar: specialCar,
      expiresAt: expiresAt,
    };
  } catch (error) {
    console.error("Error assigning special car:", error);
    return { success: false, error };
  }
};

// Get user's current special car (if not expired)
export const getCurrentSpecialCar = async (userId) => {
  try {
    const db = getDatabase();
    const userRef = ref(db, `users/${userId}/specialCar`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) return null;

    const specialCarData = snapshot.val();

    if (specialCarData.expiresAt < Date.now()) {
      await update(ref(db, `users/${userId}`), {
        specialCar: null,
      });
      return null;
    }

    return {
      ...SPECIAL_CARS[specialCarData.id],
      awardedAt: specialCarData.awardedAt,
      expiresAt: specialCarData.expiresAt,
      rank: specialCarData.rank,
    };
  } catch (error) {
    console.error("Error getting special car:", error);
    return null;
  }
};

// Get user's current active car (priority: Special > Highest Unlocked Regular)
export const getCurrentActiveCar = async (userId, userLevel) => {
  try {
    const specialCar = await getCurrentSpecialCar(userId);
    if (specialCar) {
      return {
        id: specialCar.id,
        imageFile: specialCar.imageFile,
        displayName: specialCar.displayName,
        icon: specialCar.icon,
        isSpecial: true,
        rank: specialCar.rank,
        expiresAt: specialCar.expiresAt,
      };
    }

    const carForLevel = getRegularCarForLevel(userLevel);
    return {
      id: carForLevel.id,
      imageFile: carForLevel.imageFile,
      displayName: carForLevel.displayName,
      icon: carForLevel.icon,
      isSpecial: false,
    };
  } catch (error) {
    console.error("Error getting active car:", error);
    return {
      id: "car1",
      imageFile: "car-1.png",
      displayName: "ROOKIE",
      icon: "🚗",
      isSpecial: false,
    };
  }
};

// Get all cars with unlock status for garage display
export const getAllCarsWithStatus = async (userId) => {
  try {
    const unlockedCars = await getUnlockedRegularCars(userId);
    const unlockedIds = unlockedCars.map((car) => car.id);
    const specialCar = await getCurrentSpecialCar(userId);

    const regularCarsWithStatus = Object.values(REGULAR_CARS).map((car) => ({
      ...car,
      unlocked: unlockedIds.includes(car.id),
      unlockedAt: null,
    }));

    return {
      regularCars: regularCarsWithStatus,
      specialCar: specialCar,
    };
  } catch (error) {
    console.error("Error getting cars with status:", error);
    return {
      regularCars: [],
      specialCar: null,
    };
  }
};

// Initialize cars for a new user
export const initializeUserCars = async (userId) => {
  try {
    const db = getDatabase();

    await update(ref(db, `users/${userId}`), {
      unlockedCars: ["car1"],
      specialCar: null,
    });

    return { success: true };
  } catch (error) {
    console.error("Error initializing user cars:", error);
    return { success: false, error };
  }
};

// Backfill cars for existing users (updated for 7 cars, 24 levels)
export const backfillUserCars = async (userId, currentLevel) => {
  try {
    const unlockedCars = [];

    if (currentLevel >= 3) unlockedCars.push("car1");
    if (currentLevel >= 6) unlockedCars.push("car2");
    if (currentLevel >= 9) unlockedCars.push("car3");
    if (currentLevel >= 12) unlockedCars.push("car4");
    if (currentLevel >= 15) unlockedCars.push("car5");
    if (currentLevel >= 18) unlockedCars.push("car6");
    if (currentLevel >= 24) unlockedCars.push("car7");

    const db = getDatabase();
    await update(ref(db, `users/${userId}`), {
      unlockedCars: unlockedCars,
    });

    return { success: true };
  } catch (error) {
    console.error("Error backfilling user cars:", error);
    return { success: false, error };
  }
};
