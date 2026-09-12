import { DOMAINS } from "../data/constants.js";

const BASIC_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[A-Za-z\s'\-]+$/;
const MOBILE_REGEX = /^\d{10}$/;
const COLLEGE_REGEX = /^[A-Za-z0-9\s.,'&\-()]+$/;
const LETTER_REGEX = /[A-Za-z]/;

function hasAlphabeticText(text) {
  return LETTER_REGEX.test(text || "");
}

export function validateEmail(email) {
  const clean = (email || "").trim().toLowerCase();
  if (!clean || !BASIC_EMAIL_REGEX.test(clean)) {
    return false;
  }

  const parts = clean.split("@");
  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domainPart] = parts;
  const domainName = domainPart.split(".")[0]; // part before TLD

  // Local part MUST contain at least one letter [a-z]
  if (!LETTER_REGEX.test(localPart)) {
    return false;
  }

  // Domain name MUST contain at least one letter [a-z]
  if (!LETTER_REGEX.test(domainName)) {
    return false;
  }

  return true;
}

export function validateStudentForm(form, resumeFile) {
  const errors = {};

  // Full Name
  const name = (form.name || "").trim();
  if (name.length < 2 || name.length > 60) {
    errors.name = "Full name must be between 2 and 60 characters.";
  } else if (!NAME_REGEX.test(name)) {
    errors.name = "Name can only contain letters, spaces, hyphens, and apostrophes.";
  }

  // Email
  const email = (form.email || "").trim();
  if (!validateEmail(email)) {
    errors.email = "Please enter a valid email address.";
  }

  // Mobile - EXACTLY 10 digits 0-9
  const mobile = (form.mobile || "").trim();
  if (!MOBILE_REGEX.test(mobile)) {
    errors.mobile = "Mobile number must contain exactly 10 digits (0–9).";
  }

  // College / Institution
  const college = (form.college || "").trim();
  if (college.length < 2 || college.length > 120) {
    errors.college = "College/Institution name must be between 2 and 120 characters.";
  } else if (!COLLEGE_REGEX.test(college)) {
    errors.college = "College name contains invalid characters.";
  }

  // Skills - Each skill MUST contain alphabetic text
  const rawSkillsStr = typeof form.skills === 'string' ? form.skills : (form.skills || []).join(', ');
  const rawSkillsList = rawSkillsStr.split(",").map((s) => s.trim()).filter(Boolean);
  const validSkills = rawSkillsList.filter((s) => hasAlphabeticText(s));
  const dedupSkills = Array.from(new Set(validSkills.map((s) => s.toLowerCase())));

  if (rawSkillsList.length !== validSkills.length || dedupSkills.length < 1 || dedupSkills.length > 15) {
    errors.skills = "Each skill must contain valid alphabetic text (e.g. Python, React.js, C++). 1–15 skills required.";
  }

  // Interests - Each interest MUST contain alphabetic text
  const rawInterestsStr = typeof form.interests === 'string' ? form.interests : (form.interests || []).join(', ');
  const rawInterestsList = rawInterestsStr.split(",").map((i) => i.trim()).filter(Boolean);
  const validInterests = rawInterestsList.filter((i) => hasAlphabeticText(i));
  const dedupInterests = Array.from(new Set(validInterests.map((i) => i.toLowerCase())));

  if (rawInterestsList.length !== validInterests.length || dedupInterests.length < 1 || dedupInterests.length > 10) {
    errors.interests = "Each interest must contain valid alphabetic text (e.g. AI, Data Science). 1–10 interests required.";
  }

  // Preferred Domain
  const domain = form.preferredDomain || form.preferred_domain;
  if (!DOMAINS.includes(domain)) {
    errors.preferredDomain = "Please select a valid domain from the list.";
  }

  // Project Description
  const projects = (form.projects || "").trim();
  if (projects.length < 20 || projects.length > 1000) {
    errors.projects = "Project description must be between 20 and 1000 characters.";
  } else if (!hasAlphabeticText(projects)) {
    errors.projects = "Project description must contain meaningful text.";
  }

  // Resume PDF validation
  if (resumeFile) {
    const isPDF = resumeFile.type === "application/pdf" || resumeFile.name.toLowerCase().endsWith(".pdf");
    const isUnder2MB = resumeFile.size <= 2 * 1024 * 1024; // 2MB in bytes

    if (!isPDF) {
      errors.resume = "Resume must be a PDF document (.pdf).";
    } else if (!isUnder2MB) {
      errors.resume = "Resume file size must not exceed 2 MB.";
    }
  } else {
    errors.resume = "Resume (PDF, max 2 MB) is required.";
  }

  return errors;
}

export function validateOpportunityForm(oppForm) {
  const errors = {};

  // Title - Must contain alphabetic text
  const title = (oppForm.title || "").trim();
  if (title.length < 3 || title.length > 100) {
    errors.title = "Title must be between 3 and 100 characters.";
  } else if (!hasAlphabeticText(title)) {
    errors.title = "Title must contain meaningful alphabetic text.";
  }

  // Organization - Must contain alphabetic text
  const org = (oppForm.org || "").trim();
  if (org.length < 2 || org.length > 120) {
    errors.org = "Organization name must be between 2 and 120 characters.";
  } else if (!hasAlphabeticText(org)) {
    errors.org = "Organization name must contain valid text.";
  }

  // Domain
  if (!DOMAINS.includes(oppForm.domain)) {
    errors.domain = "Please select a valid domain from the list.";
  }

  // Location - Must contain alphabetic text
  const location = (oppForm.location || "").trim();
  if (location.length < 2 || location.length > 120) {
    errors.location = "Location must be between 2 and 120 characters.";
  } else if (!hasAlphabeticText(location)) {
    errors.location = "Location must contain valid text (e.g. Remote, Delhi).";
  }

  // Stipend - strictly numeric float/int >= 0 (Reject text like "abc", "15k", "₹15000")
  const stipendVal = (oppForm.stipend || "").toString().trim();
  if (!stipendVal && stipendVal !== "0") {
    errors.stipend = "Stipend amount is required.";
  } else if (!/^\d+(\.\d+)?$/.test(stipendVal)) {
    errors.stipend = "Stipend must be a non-negative numeric amount (e.g. 10000 or 0).";
  } else if (parseFloat(stipendVal) < 0) {
    errors.stipend = "Stipend cannot be negative.";
  }

  // Seats - integer >= 1
  const seatsVal = (oppForm.seatsTotal || "").toString().trim();
  if (!seatsVal) {
    errors.seatsTotal = "Seats total is required.";
  } else if (!/^\d+$/.test(seatsVal) || parseInt(seatsVal, 10) < 1) {
    errors.seatsTotal = "Seats must be an integer of at least 1.";
  }

  // Required Skills - Must contain alphabetic text
  const rawSkillsStr = typeof oppForm.requiredSkills === 'string' ? oppForm.requiredSkills : (oppForm.requiredSkills || []).join(', ');
  const rawSkillsList = rawSkillsStr.split(",").map((s) => s.trim()).filter(Boolean);
  const validSkills = rawSkillsList.filter((s) => hasAlphabeticText(s));
  const dedupSkills = Array.from(new Set(validSkills.map((s) => s.toLowerCase())));

  if (rawSkillsList.length !== validSkills.length || dedupSkills.length < 1 || dedupSkills.length > 15) {
    errors.requiredSkills = "Required skills must contain between 1 and 15 valid skills with letters (e.g. Python, SQL).";
  }

  // Description
  const description = (oppForm.description || "").trim();
  if (description.length < 20 || description.length > 2000) {
    errors.description = "Description must be between 20 and 2000 characters.";
  } else if (!hasAlphabeticText(description)) {
    errors.description = "Description must contain meaningful text.";
  }

  return errors;
}
