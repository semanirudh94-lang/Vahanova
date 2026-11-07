// Single data door for the whole app. Pages never touch localStorage or Firestore directly,
// so switching demo -> live is only a matter of filling .env.local.
import { firebaseOn } from "./firebase";
import * as local from "./store-local";

// The Firebase SDK is ~180 kB, so it is only imported when real keys are present — demo mode stays light on mobile data.
let cloudPromise = null;
function store() {
  if (!firebaseOn) return Promise.resolve(local);
  if (!cloudPromise) cloudPromise = import("./store-cloud");
  return cloudPromise;
}

const call = (name) => async (...a) => (await store())[name](...a);

export const isLive = firebaseOn;

export const currentUser = call("currentUser");
export const login = call("login");
export const logout = call("logout");
export const updateProfile = call("updateProfile");
export const mechanics = call("mechanics");
export const providerProfile = call("providerProfile");
export const saveProviderProfile = call("saveProviderProfile");
export const providerOffers = call("providerOffers");
export const userById = call("userById");
export const myVehicles = call("myVehicles");
export const vehicleById = call("vehicleById");
export const addVehicle = call("addVehicle");
export const createBooking = call("createBooking");
export const updateBooking = call("updateBooking");
export const acceptBooking = call("acceptBooking");
export const assignBooking = call("assignBooking");
export const bookingById = call("bookingById");
export const bookingByCode = call("bookingByCode");
export const bookingsForCustomer = call("bookingsForCustomer");
export const bookingsForMechanic = call("bookingsForMechanic");
export const openRequestsForMechanic = call("openRequestsForMechanic");
export const subscribeOpenRequestsForMechanic = call("subscribeOpenRequestsForMechanic");
export const allBookings = call("allBookings");
export const completeBooking = call("completeBooking");
export const rateBooking = call("rateBooking");
export const ratingsForCustomer = call("ratingsForCustomer");
export const ratingsForProvider = call("ratingsForProvider");
export const recordsForVehicle = call("recordsForVehicle");
export const recordsForCustomer = call("recordsForCustomer");
export const stats = call("stats");
