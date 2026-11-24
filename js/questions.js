// All 70 exam-pool questions from the three study guides.
// page = the page in the PDF where the question starts.
const CHAPTERS = [
  { ch: 4, name: 'Electrostatics', file: 'guides/EM_C4_Study_Guide.pdf' },
  { ch: 5, name: 'Magnetostatics', file: 'guides/EM_C5_Study_Guide.pdf' },
  { ch: 6, name: 'Time-varying fields', file: 'guides/EM_C6_Study_Guide.pdf' }
];

const QUESTIONS = [
  {"id": "4.01", "ch": 4, "src": "Example 4-1", "title": "Line charge distribution", "page": 9},
  {"id": "4.02", "ch": 4, "src": "Example 4-2", "title": "Surface charge distribution", "page": 9},
  {"id": "4.03", "ch": 4, "src": "Example 4-3", "title": "Field of two point charges", "page": 10},
  {"id": "4.04", "ch": 4, "src": "HW4 Q1", "title": "Charges with no x or no y component", "page": 11},
  {"id": "4.05", "ch": 4, "src": "Recitation 4, Problem 4.18", "title": "Charges in equilibrium", "page": 12},
  {"id": "4.06", "ch": 4, "src": "Example 4-4", "title": "Field of a ring of charge", "page": 13},
  {"id": "4.07", "ch": 4, "src": "Example 4-5", "title": "Field of a circular disk", "page": 14},
  {"id": "4.08", "ch": 4, "src": "Example 4-6", "title": "Infinite line charge (Gauss)", "page": 15},
  {"id": "4.09", "ch": 4, "src": "Example 4-7", "title": "Two infinite lines of charge", "page": 16},
  {"id": "4.10", "ch": 4, "src": "HW4 Q2", "title": "Two coaxial charged cylinders", "page": 17},
  {"id": "4.11", "ch": 4, "src": "HW4 Q4 (Problem 4.26)", "title": "Thick cylindrical shell", "page": 18},
  {"id": "4.12", "ch": 4, "src": "HW5 Q1 (Problem 4.29)", "title": "Spherical shell", "page": 18},
  {"id": "4.13", "ch": 4, "src": "Example 4-8", "title": "Computing V along two paths", "page": 19},
  {"id": "4.14", "ch": 4, "src": "Recitation 4, Problem 4.38", "title": "Potential difference on the z-axis", "page": 20},
  {"id": "4.15", "ch": 4, "src": "Recitations 3 & 4, Problem 4.39", "title": "Two charged sheets", "page": 21},
  {"id": "4.16", "ch": 4, "src": "HW5 Q2 (Problem 4.33)", "title": "Potential of a ring", "page": 22},
  {"id": "4.17", "ch": 4, "src": "Recitation 3", "title": "Two uniformly charged wires", "page": 23},
  {"id": "4.18", "ch": 4, "src": "Example 4-9", "title": "Electric dipole", "page": 24},
  {"id": "4.19", "ch": 4, "src": "Recitation 3", "title": "Divergence, curl and potentials", "page": 25},
  {"id": "4.20", "ch": 4, "src": "HW4 Q5", "title": "Wedge-shaped conducting planes", "page": 26},
  {"id": "4.21", "ch": 4, "src": "Example 4-10", "title": "Conduction current in a copper wire", "page": 27},
  {"id": "4.22", "ch": 4, "src": "Example 4-11", "title": "Conductance of a coaxial cable", "page": 28},
  {"id": "4.23", "ch": 4, "src": "HW5 Q3 (Problem 4.41)", "title": "Silicon bar", "page": 28},
  {"id": "4.24", "ch": 4, "src": "Recitation 4, Problem 4.47", "title": "Aluminum sheet", "page": 29},
  {"id": "4.25", "ch": 4, "src": "Example 4-12", "title": "Dielectric breakdown", "page": 30},
  {"id": "4.26", "ch": 4, "src": "Example 4-13", "title": "Boundary between two dielectrics", "page": 31},
  {"id": "4.27", "ch": 4, "src": "HW4 Q3", "title": "Dielectric lens", "page": 32},
  {"id": "4.28", "ch": 4, "src": "Example 4-14", "title": "Parallel-plate capacitor", "page": 33},
  {"id": "4.29", "ch": 4, "src": "Example 4-15", "title": "Coaxial capacitance", "page": 34},
  {"id": "4.30", "ch": 4, "src": "Recitation 4, Problem 4.60", "title": "Coax with two half-dielectrics", "page": 35},
  {"id": "4.31", "ch": 4, "src": "Example 4-16", "title": "Force on a sliding dielectric", "page": 36},
  {"id": "4.32", "ch": 4, "src": "HW4 Q6 / HW5 Q4 (Problem 4.54)", "title": "Electron between plates", "page": 37},
  {"id": "4.33", "ch": 4, "src": "Example 4-17", "title": "Image method", "page": 38},
  {"id": "5.01", "ch": 5, "src": "Example 5-1", "title": "Force on a semicircular conductor", "page": 8},
  {"id": "5.02", "ch": 5, "src": "Recitation 4, Problem 5.5", "title": "Force on a straight wire", "page": 9},
  {"id": "5.03", "ch": 5, "src": "Example 5-2", "title": "Magnetic field of a linear conductor", "page": 10},
  {"id": "5.04", "ch": 5, "src": "HW5 Q5 (Problem 5.10)", "title": "Rectangular loop", "page": 11},
  {"id": "5.05", "ch": 5, "src": "Example 5-3", "title": "Magnetic field of a circular loop", "page": 12},
  {"id": "5.06", "ch": 5, "src": "Recitation 4, Problem 5.13", "title": "Two parallel circular loops", "page": 13},
  {"id": "5.07", "ch": 5, "src": "HW4 Q8", "title": "Field of a thin current strip", "page": 14},
  {"id": "5.08", "ch": 5, "src": "Recitation 4, Problem 5.19", "title": "Three parallel wires", "page": 15},
  {"id": "5.09", "ch": 5, "src": "HW5 Q6 (Problem 5.16)", "title": "Force on a loop next to a wire", "page": 16},
  {"id": "5.10", "ch": 5, "src": "Example 5-4", "title": "Magnetic field of a long wire (Ampère)", "page": 17},
  {"id": "5.11", "ch": 5, "src": "HW5 Q7 (Problem 5.23)", "title": "Coaxial cable", "page": 18},
  {"id": "5.12", "ch": 5, "src": "HW4 Q9", "title": "Off-center cylindrical cavity", "page": 20},
  {"id": "5.13", "ch": 5, "src": "Example 5-5", "title": "Toroidal coil", "page": 21},
  {"id": "5.14", "ch": 5, "src": "Example 5-6", "title": "Infinite current sheet", "page": 22},
  {"id": "5.15", "ch": 5, "src": "Recitation 4, Problem 5.27", "title": "Vector magnetic potential", "page": 23},
  {"id": "5.16", "ch": 5, "src": "Example 5-7", "title": "Tilted-plane boundary", "page": 24},
  {"id": "5.17", "ch": 5, "src": "HW5 Q8 (Problem 5.32)", "title": "Two magnetic media", "page": 25},
  {"id": "5.18", "ch": 5, "src": "Recitation 3, Problem 5.40", "title": "Flux through a loop next to a wire", "page": 26},
  {"id": "5.19", "ch": 5, "src": "Example 5-8", "title": "Inductance of a coaxial line", "page": 27},
  {"id": "5.20", "ch": 5, "src": "Example 5-9", "title": "Mutual inductance", "page": 28},
  {"id": "5.21", "ch": 5, "src": "Example 5-10", "title": "Magnetic energy in a coaxial cable", "page": 29},
  {"id": "6.01", "ch": 6, "src": "Example 6-1", "title": "Inductor in a changing magnetic field", "page": 8},
  {"id": "6.02", "ch": 6, "src": "Example 6-2", "title": "Lenz’s law", "page": 9},
  {"id": "6.03", "ch": 6, "src": "Recitation 4, Problem 6.6", "title": "Loop next to an AC wire", "page": 10},
  {"id": "6.04", "ch": 6, "src": "Example 6-3", "title": "Sliding bar", "page": 11},
  {"id": "6.05", "ch": 6, "src": "Example 6-4", "title": "Moving loop in a non-uniform field", "page": 13},
  {"id": "6.06", "ch": 6, "src": "Example 6-5", "title": "Moving rod next to a wire", "page": 14},
  {"id": "6.07", "ch": 6, "src": "HW5 Q9 (Problem 6.7)", "title": "Rotating loop", "page": 15},
  {"id": "6.08", "ch": 6, "src": "Example 6-6", "title": "Generator in a time-varying field", "page": 16},
  {"id": "6.09", "ch": 6, "src": "Example 6-7", "title": "Displacement current in a wire", "page": 17},
  {"id": "6.10", "ch": 6, "src": "Recitation 4, Problem 6.16", "title": "Lossy capacitor", "page": 18},
  {"id": "6.11", "ch": 6, "src": "HW4 Q7", "title": "Lightning strikes a lossy sphere", "page": 19},
  {"id": "6.12", "ch": 6, "src": "Example 6-8", "title": "Given E, find H and k", "page": 20},
  {"id": "6.13", "ch": 6, "src": "Recitation 4, Problem 6.24", "title": "Given H, find k and E", "page": 21},
  {"id": "6.14", "ch": 6, "src": "HW5 Q10 (Problem 6.26)", "title": "Short dipole antenna", "page": 22},
  {"id": "6.15", "ch": 6, "src": "HW5 Q11 (Problem 6.28)", "title": "Field in free space, cylindrical", "page": 23},
  {"id": "6.16", "ch": 6, "src": "Recitation 4, Problem 6.27", "title": "H → E, Jd, ρv", "page": 24},
];

// Question types, read from where each question comes from.
const TYPES = [
  { id: 'all', name: 'All types', short: 'All types' },
  { id: 'ex', name: 'Examples', short: 'Examples' },
  { id: 'hw', name: 'Homework', short: 'Homework' },
  { id: 'rec', name: 'Recitation', short: 'Recitation' }
];
QUESTIONS.forEach((q) => {
  q.type = /^Example/.test(q.src) ? 'ex' : /^HW/.test(q.src) ? 'hw' : 'rec';
  // A short source for the list: "Ex 4-1", "HW5 Q1", "Rec 4 · P4.18".
  q.short = q.src
    .replace(/^Example /, 'Ex ')
    .replace(/^Recitations? ([\d &]+), Problem (.+)$/, 'Rec $1 · P$2')
    .replace(/^Recitation (\d+)$/, 'Rec $1')
    .replace(/ \(Problem [^)]+\)$/, '');
});
