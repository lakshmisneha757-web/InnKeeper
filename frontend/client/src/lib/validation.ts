export interface GuestInputValues {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  checkIn?: string;
  checkOut?: string;
  vehiclePlate?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  idType?: string;
  idNumber?: string;
}

export function validateEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) return true;
  // Format: username@domain.com (checks username before @, @ symbol, domain name, . followed by at least 2 letters)
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(trimmed)) return false;
  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) return false;
  const domainParts = domain.split('.');
  if (domainParts.some(part => part.length === 0)) return false;
  return true;
}

export function validatePhone(phone: string): boolean {
  const clean = phone.replace(/\D/g, "");
  if (!clean) return true;
  if (clean.length !== 10) return false;
  if (!/^[6-9]\d{9}$/.test(clean)) return false;
  if (/^(\d)\1{9}$/.test(clean) || clean === "1234567890" || clean === "0123456789") return false;
  return true;
}

// Indian Vehicle Registration Number format: SS 00 XX 0000 (e.g., AP 39 AB 1234, TS 09 EF 5678, KA 01 MN 2468)
export function validateIndianLicensePlate(plate: string): boolean {
  const clean = plate.trim().toUpperCase();
  if (!clean) return true;
  if (clean.length < 8 || clean.length > 13) return false;
  const indianPlateRegex = /^[A-Z]{2}\s?[0-9]{2}\s?[A-Z]{1,2}\s?[0-9]{4}$/;
  return indianPlateRegex.test(clean);
}

// Vehicle Brand + Model format: e.g. Toyota Innova, Honda City, Tata Nexon, Mahindra Thar, Maruti Suzuki Swift
export function validateVehicleBrandModel(makeOrModel: string): boolean {
  const clean = makeOrModel.trim();
  if (!clean) return true;
  if (clean.length < 3 || clean.length > 40) return false;
  if (!/^[A-Za-z]{2,}/.test(clean)) return false; // Must start with Brand name letters
  return /^[A-Za-z0-9\s\-\.]{3,40}$/.test(clean);
}

export function validateGuestInput(values: GuestInputValues): string | null {
  // 1. First Name
  const firstName = values.firstName?.trim() || "";
  if (!firstName) {
    return "Validation Error: First Name is required";
  }
  if (firstName.length < 2) {
    return "Validation Error: First Name must be at least 2 characters long";
  }
  if (!/^[A-Za-z\s'\-]+$/.test(firstName)) {
    return "Validation Error: First Name must contain only alphabetic characters";
  }

  // 2. Last Name
  const lastName = values.lastName?.trim() || "";
  if (!lastName) {
    return "Validation Error: Last Name is required";
  }
  if (!/^[A-Za-z\s'\-]+$/.test(lastName)) {
    return "Validation Error: Last Name must contain only alphabetic characters";
  }

  // 3. Email: username@domain.com
  const email = values.email?.trim() || "";
  if (email && !validateEmail(email)) {
    return "Validation Error: Please enter a valid email address (e.g., lakshmi@gmail.com)";
  }

  // 4. Phone: Must start with 6, 7, 8, 9 and be 10 digits
  const phone = values.phone ? values.phone.replace(/\D/g, "") : "";
  if (phone) {
    if (phone.length !== 10 || !/^[6-9]\d{9}$/.test(phone)) {
      return "Validation Error: Invalid phone number";
    }
    if (/^(\d)\1{9}$/.test(phone) || phone === "1234567890" || phone === "0123456789") {
      return "Validation Error: Invalid phone number";
    }
  }

  // 5. Vehicle License Plate (Indian Format: AP 39 AB 1234)
  const plate = values.vehiclePlate?.trim() || "";
  if (plate && !validateIndianLicensePlate(plate)) {
    return "Validation Error: Please enter a valid Indian vehicle registration number (e.g., AP 39 AB 1234)";
  }

  // 6. Vehicle Brand + Model (e.g., Toyota Innova)
  const make = values.vehicleMake?.trim() || "";
  if (make && !validateVehicleBrandModel(make)) {
    return "Validation Error: Please enter a valid vehicle brand and model (e.g., Toyota Innova)";
  }

  const model = values.vehicleModel?.trim() || "";
  if (model && !validateVehicleBrandModel(model)) {
    return "Validation Error: Please enter a valid vehicle brand and model (e.g., Toyota Innova)";
  }

  // 7. Dates
  if (values.checkIn) {
    const ciDate = new Date(values.checkIn);
    if (isNaN(ciDate.getTime())) {
      return "Validation Error: Check In date is invalid";
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (ciDate < today) {
      return "Validation Error: Check In date cannot be in the past";
    }
  }

  if (values.checkIn && values.checkOut) {
    const ciDate = new Date(values.checkIn);
    const coDate = new Date(values.checkOut);
    if (isNaN(coDate.getTime())) {
      return "Validation Error: Check Out date is invalid";
    }
    if (coDate <= ciDate) {
      return "Validation Error: Check Out date must be after Check In date";
    }
  }

  // 8. ID Number (if provided)
  const idNum = values.idNumber?.trim() || "";
  if (idNum && idNum.length < 4) {
    return "Validation Error: ID document number must be at least 4 characters";
  }

  return null;
}
