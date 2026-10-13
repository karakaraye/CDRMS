/**
 * Uniport Department of Management Course Catalogue
 * Extracted from original CDRMS database.py
 */

export const DEFAULT_COURSES = [
  // 100 LEVEL - FIRST SEMESTER (16 Units)
  { course_code: "GES 111.1", course_title: "Communication in English", credit_units: 2, level: "100", semester: "First", status: "Compulsory", program: "Full-Time" },
  { course_code: "AMS 101.1", course_title: "Principles of Management", credit_units: 2, level: "100", semester: "First", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 101.1", course_title: "Introduction to Business I", credit_units: 2, level: "100", semester: "First", status: "Compulsory", program: "Full-Time" },
  { course_code: "AMS 103.1", course_title: "Introduction to Computers for Management Sciences", credit_units: 2, level: "100", semester: "First", status: "Compulsory", program: "Full-Time" },
  { course_code: "MKT 111.1", course_title: "Elements of Marketing", credit_units: 2, level: "100", semester: "First", status: "Required", program: "Full-Time" },
  { course_code: "MGT 117.1", course_title: "Business, Government and Society", credit_units: 3, level: "100", semester: "First", status: "Required", program: "Full-Time" },
  { course_code: "ACC 101.1", course_title: "Introduction to Financial Accounting I", credit_units: 3, level: "100", semester: "First", status: "Required", program: "Full-Time" },

  // 100 LEVEL - SECOND SEMESTER (20 Units)
  { course_code: "GES 112.2", course_title: "Nigerian Peoples and Culture", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time" },
  { course_code: "AMS 102.2", course_title: "Basic Mathematics for Management Sciences", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time" },
  { course_code: "AMS 104.2", course_title: "Principles of Project Management", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 102.2", course_title: "Introduction to Business II", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time" },
  { course_code: "FIN 101.2", course_title: "Introduction to Finance", credit_units: 3, level: "100", semester: "Second", status: "Required", program: "Full-Time" },
  { course_code: "MGT 118.2", course_title: "Business Communication", credit_units: 3, level: "100", semester: "Second", status: "Required", program: "Full-Time" },
  { course_code: "MGT 106.2", course_title: "Elements of Administration", credit_units: 2, level: "100", semester: "Second", status: "Required", program: "Full-Time" },
  { course_code: "MGT 114.2", course_title: "Introduction to Business Economics", credit_units: 2, level: "100", semester: "Second", status: "Required", program: "Full-Time" },
  { course_code: "MGT 116.2", course_title: "Introduction to Procurement Management", credit_units: 2, level: "100", semester: "Second", status: "Required", program: "Full-Time" },

  // 200 LEVEL - FIRST SEMESTER (17 Units)
  { course_code: "GES 211.1", course_title: "Entrepreneurship and Business Innovation", credit_units: 2, level: "200", semester: "First", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 201.1", course_title: "Principles of Business Administration I", credit_units: 3, level: "200", semester: "First", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 203.1", course_title: "Business Statistics", credit_units: 3, level: "200", semester: "First", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 205.1", course_title: "Leadership and Governance (Corporate Governance)", credit_units: 2, level: "200", semester: "First", status: "Compulsory", program: "Full-Time" },
  { course_code: "HMT 203.1", course_title: "Introduction to Hospitality and Tourism Management", credit_units: 2, level: "200", semester: "First", status: "Required", program: "Full-Time" },
  { course_code: "MGT 215.1", course_title: "Non-Profit Management", credit_units: 3, level: "200", semester: "First", status: "Required", program: "Full-Time" },
  { course_code: "MGT 213.1", course_title: "Family Business Management & Succession Planning", credit_units: 2, level: "200", semester: "First", status: "Required", program: "Full-Time" },

  // 200 LEVEL - SECOND SEMESTER (16 Units)
  { course_code: "GES 212.2", course_title: "Philosophy, Logic, and Human Existence", credit_units: 2, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 202.2", course_title: "Principles of Business Administration II", credit_units: 3, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 204.2", course_title: "Quantitative Analysis in Management", credit_units: 3, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 216.2", course_title: "Introduction to Financial Management", credit_units: 3, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 218.2", course_title: "Green Management", credit_units: 2, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time" },
  { course_code: "FMS 201.1", course_title: "Community Service", credit_units: 1, level: "200", semester: "Second", status: "Required", program: "Full-Time" },
  { course_code: "MGT 214.2", course_title: "Employment Relations and Conflict Management", credit_units: 2, level: "200", semester: "Second", status: "Required", program: "Full-Time" },

  // 300 LEVEL - FIRST SEMESTER (18 Units)
  { course_code: "GES 312.1", course_title: "Peace and Conflict Resolution", credit_units: 2, level: "300", semester: "First", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 303.1", course_title: "Management Theory", credit_units: 3, level: "300", semester: "First", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 305.1", course_title: "Financial Management", credit_units: 3, level: "300", semester: "First", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 313.1", course_title: "Innovation Management", credit_units: 2, level: "300", semester: "First", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 319.1", course_title: "E-Commerce (E-Business)", credit_units: 2, level: "300", semester: "First", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 321.1", course_title: "Business Start-up", credit_units: 2, level: "300", semester: "First", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 323.1", course_title: "Supply Chain Management", credit_units: 2, level: "300", semester: "First", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 315.1", course_title: "Business Research Methods", credit_units: 2, level: "300", semester: "First", status: "Required", program: "Full-Time" },

  // 300 LEVEL - SECOND SEMESTER (15 Units)
  { course_code: "GES 300.2", course_title: "Venture Creation", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 310.2", course_title: "Production and Operation Management", credit_units: 3, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 302.2", course_title: "Human Behaviour in Organisations", credit_units: 3, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 304.2", course_title: "Human Resource Management", credit_units: 3, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 312.2", course_title: "Small Business Management", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 320.2", course_title: "Fundamentals of Business Data Analytics", credit_units: 2, level: "300", semester: "Second", status: "Required", program: "Full-Time" },
  { course_code: "MGT 355.2", course_title: "Business Law", credit_units: 2, level: "300", semester: "Second", status: "Required", program: "Full-Time" },

  // 400 LEVEL - FIRST SEMESTER (19 Units)
  { course_code: "MGT 401.1", course_title: "Business Policy and Strategic Management", credit_units: 3, level: "400", semester: "First", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 409.1", course_title: "Management Information System", credit_units: 2, level: "400", semester: "First", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 411.1", course_title: "Analysis for Business Decision", credit_units: 3, level: "400", semester: "First", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 420.1", course_title: "Internship (Industrial Exposure Programme)", credit_units: 3, level: "400", semester: "First", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 415.1", course_title: "Service Sector Management", credit_units: 2, level: "400", semester: "First", status: "Required", program: "Full-Time" },
  { course_code: "MGT 417.1", course_title: "Feasibilities and Business Planning", credit_units: 2, level: "400", semester: "First", status: "Required", program: "Full-Time" },
  { course_code: "MGT 405.1", course_title: "Public Sector Management", credit_units: 2, level: "400", semester: "First", status: "Required", program: "Full-Time" },
  { course_code: "MGT 403.1", course_title: "Labour Economics", credit_units: 2, level: "400", semester: "First", status: "Required", program: "Full-Time" },

  // 400 LEVEL - SECOND SEMESTER (19 Units)
  { course_code: "MGT 402.2", course_title: "Strategic Thinking and Problem Solving", credit_units: 3, level: "400", semester: "Second", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 406.2", course_title: "International Business", credit_units: 3, level: "400", semester: "Second", status: "Compulsory", program: "Full-Time" },
  { course_code: "MGT 418.2", course_title: "Public Project Analysis and Management", credit_units: 3, level: "400", semester: "Second", status: "Required", program: "Full-Time" },
  { course_code: "MGT 414.2", course_title: "Comparative Management", credit_units: 2, level: "400", semester: "Second", status: "Required", program: "Full-Time" },
  { course_code: "MGT 400.2", course_title: "Entrepreneurial Project", credit_units: 2, level: "400", semester: "Second", status: "Required", program: "Full-Time" },
  { course_code: "MGT 498.2", course_title: "Research Project", credit_units: 6, level: "400", semester: "Second", status: "Required", program: "Full-Time" },
];

export const DEFAULT_COURSES_PART_TIME = [
  // 100 LEVEL - First Term (13 Credits)
  { course_code: "GES 111.1", course_title: "Communication in English", credit_units: 2, level: "100", semester: "First", status: "Compulsory", program: "Part-Time" },
  { course_code: "AMS 101.1", course_title: "Principles of Management", credit_units: 2, level: "100", semester: "First", status: "Compulsory", program: "Part-Time" },
  { course_code: "MGT 101.1", course_title: "Introduction to Business I", credit_units: 2, level: "100", semester: "First", status: "Compulsory", program: "Part-Time" },
  { course_code: "AMS 103.1", course_title: "Introduction to Computers for Management Sciences", credit_units: 2, level: "100", semester: "First", status: "Compulsory", program: "Part-Time" },
  { course_code: "FIN 101.1", course_title: "Introduction to Finance", credit_units: 3, level: "100", semester: "First", status: "Required", program: "Part-Time" },
  { course_code: "MKT 111.1", course_title: "Elements of Marketing", credit_units: 2, level: "100", semester: "First", status: "Required", program: "Part-Time" },

  // 100 LEVEL - Second Term (12 Credits)
  { course_code: "MGT 117.2", course_title: "Business, Government and Society", credit_units: 3, level: "100", semester: "Second", status: "Required", program: "Part-Time" },
  { course_code: "ACC 101.2", course_title: "Introduction to Financial Accounting I", credit_units: 3, level: "100", semester: "Second", status: "Required", program: "Part-Time" },
  { course_code: "GES 112.2", course_title: "Nigerian Peoples and Culture", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Part-Time" },
  { course_code: "AMS 102.2", course_title: "Basic Mathematics for Management Sciences", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Part-Time" },
  { course_code: "AMS 104.2", course_title: "Principles of Project Management", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Part-Time" },

  // 100 LEVEL - Third Term (11 Credits)
  { course_code: "MGT 102.3", course_title: "Introduction to Business II", credit_units: 2, level: "100", semester: "Third", status: "Compulsory", program: "Part-Time" },
  { course_code: "MGT 118.3", course_title: "Business Communication", credit_units: 3, level: "100", semester: "Third", status: "Required", program: "Part-Time" },
  { course_code: "MGT 106.3", course_title: "Elements of Administration", credit_units: 2, level: "100", semester: "Third", status: "Required", program: "Part-Time" },
  { course_code: "MGT 114.3", course_title: "Introduction to Business Economics", credit_units: 2, level: "100", semester: "Third", status: "Required", program: "Part-Time" },
  { course_code: "MGT 116.3", course_title: "Introduction to Procurement Management", credit_units: 2, level: "100", semester: "Third", status: "Required", program: "Part-Time" },

  // 200 LEVEL - First Term (10 Credits)
  { course_code: "HMT 203.1", course_title: "Introduction to Hospitality and Tourism Management", credit_units: 2, level: "200", semester: "First", status: "Required", program: "Part-Time" },
  { course_code: "GES 211.1", course_title: "Entrepreneurship and Business Innovation", credit_units: 2, level: "200", semester: "First", status: "Compulsory", program: "Part-Time" },
  { course_code: "MGT 201.1", course_title: "Principles of Business Administration I", credit_units: 3, level: "200", semester: "First", status: "Compulsory", program: "Part-Time" },
  { course_code: "MGT 203.1", course_title: "Business Statistics", credit_units: 3, level: "200", semester: "First", status: "Compulsory", program: "Part-Time" },

  // 200 LEVEL - Second Term (12 Credits)
  { course_code: "MGT 215.2", course_title: "Non-Profit Management", credit_units: 3, level: "200", semester: "Second", status: "Required", program: "Part-Time" },
  { course_code: "MGT 213.2", course_title: "Family Business Management & Succession Planning", credit_units: 2, level: "200", semester: "Second", status: "Required", program: "Part-Time" },
  { course_code: "MGT 205.2", course_title: "Leadership and Governance (Corporate Governance)", credit_units: 2, level: "200", semester: "Second", status: "Compulsory", program: "Part-Time" },
  { course_code: "GES 212.2", course_title: "Philosophy, Logic, and Human Existence", credit_units: 2, level: "200", semester: "Second", status: "Compulsory", program: "Part-Time" },
  { course_code: "MGT 202.2", course_title: "Principles of Business Administration II", credit_units: 3, level: "200", semester: "Second", status: "Compulsory", program: "Part-Time" },

  // 200 LEVEL - Third Term (11 Credits)
  { course_code: "MGT 204.3", course_title: "Quantitative Analysis in Management", credit_units: 3, level: "200", semester: "Third", status: "Compulsory", program: "Part-Time" },
  { course_code: "MGT 216.3", course_title: "Introduction to Financial Management", credit_units: 3, level: "200", semester: "Third", status: "Compulsory", program: "Part-Time" },
  { course_code: "MGT 218.3", course_title: "Green Management", credit_units: 2, level: "200", semester: "Third", status: "Compulsory", program: "Part-Time" },
  { course_code: "MGT 214.3", course_title: "Employment Relations and Conflict Management", credit_units: 2, level: "200", semester: "Third", status: "Required", program: "Part-Time" },
  { course_code: "FMS 201.3", course_title: "Community Service", credit_units: 1, level: "200", semester: "Third", status: "Required", program: "Part-Time" },

  // 300 LEVEL - First Term (12 Credits)
  { course_code: "GES 312.1", course_title: "Peace and Conflict Resolution", credit_units: 2, level: "300", semester: "First", status: "Compulsory", program: "Part-Time" },
  { course_code: "MGT 303.1", course_title: "Management Theory", credit_units: 3, level: "300", semester: "First", status: "Compulsory", program: "Part-Time" },
  { course_code: "MGT 305.1", course_title: "Financial Management", credit_units: 3, level: "300", semester: "First", status: "Compulsory", program: "Part-Time" },
  { course_code: "MGT 313.1", course_title: "Innovation Management", credit_units: 2, level: "300", semester: "First", status: "Compulsory", program: "Part-Time" },
  { course_code: "MGT 355.1", course_title: "Business Law", credit_units: 2, level: "300", semester: "Required", program: "Part-Time" },

  // 300 LEVEL - Second Term (10 Credits)
  { course_code: "MGT 319.2", course_title: "E-Commerce (E-Business)", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Part-Time" },
  { course_code: "MGT 321.2", course_title: "Business Start-up", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Part-Time" },
  { course_code: "MGT 323.2", course_title: "Supply Chain Management", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Part-Time" },
  { course_code: "MGT 315.2", course_title: "Business Research Methods", credit_units: 2, level: "300", semester: "Second", status: "Required", program: "Part-Time" },
  { course_code: "GES 300.2", course_title: "Venture Creation", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Part-Time" },

  // 300 LEVEL - Third Term (13 Credits)
  { course_code: "MGT 310.3", course_title: "Production and Operation Management", credit_units: 3, level: "300", semester: "Third", status: "Compulsory", program: "Part-Time" },
  { course_code: "MGT 302.3", course_title: "Human Behaviour in Organisations", credit_units: 3, level: "300", semester: "Third", status: "Compulsory", program: "Part-Time" },
  { course_code: "MGT 304.3", course_title: "Human Resource Management", credit_units: 3, level: "300", semester: "Third", status: "Compulsory", program: "Part-Time" },
  { course_code: "MGT 320.3", course_title: "Fundamentals of Business Data Analytics", credit_units: 2, level: "300", semester: "Third", status: "Required", program: "Part-Time" },
  { course_code: "MGT 312.3", course_title: "Small Business Management", credit_units: 2, level: "300", semester: "Third", status: "Compulsory", program: "Part-Time" },

  // 400 LEVEL - First Term (15 Credits)
  { course_code: "MGT 401.1", course_title: "Business Policy and Strategic Management", credit_units: 3, level: "400", semester: "First", status: "Compulsory", program: "Part-Time" },
  { course_code: "MGT 409.1", course_title: "Management Information System", credit_units: 2, level: "400", semester: "First", status: "Compulsory", program: "Part-Time" },
  { course_code: "MGT 411.1", course_title: "Analysis for Business Decision", credit_units: 3, level: "400", semester: "First", status: "Compulsory", program: "Part-Time" },
  { course_code: "MGT 415.1", course_title: "Service Sector Management", credit_units: 2, level: "400", semester: "First", status: "Required", program: "Part-Time" },
  { course_code: "MGT 405.1", course_title: "Public Sector Management", credit_units: 2, level: "400", semester: "First", status: "Required", program: "Part-Time" },
  { course_code: "MGT 420.1", course_title: "Internship (Industrial Exposure Programme)", credit_units: 3, level: "400", semester: "First", status: "Compulsory", program: "Part-Time" },

  // 400 LEVEL - Second Term (12 Credits)
  { course_code: "MGT 417.2", course_title: "Feasibilities and Business Planning", credit_units: 2, level: "400", semester: "Second", status: "Required", program: "Part-Time" },
  { course_code: "MGT 400.2", course_title: "Entrepreneurship Project", credit_units: 2, level: "400", semester: "Second", status: "Required", program: "Part-Time" },
  { course_code: "MGT 403.2", course_title: "Labour Economics", credit_units: 2, level: "400", semester: "Second", status: "Required", program: "Part-Time" },
  { course_code: "MGT 402.2", course_title: "Strategic Thinking and Problem Solving", credit_units: 3, level: "400", semester: "Second", status: "Compulsory", program: "Part-Time" },
  { course_code: "MGT 406.2", course_title: "International Business", credit_units: 3, level: "400", semester: "Second", status: "Compulsory", program: "Part-Time" },

  // 400 LEVEL - Third Term (11 Credits)
  { course_code: "MGT 418.3", course_title: "Public Project Analysis and Management", credit_units: 3, level: "400", semester: "Third", status: "Required", program: "Part-Time", department: "Department of Management" },
  { course_code: "MGT 414.3", course_title: "Comparative Management", credit_units: 2, level: "400", semester: "Third", status: "Required", program: "Part-Time", department: "Department of Management" },
  { course_code: "MGT 498.3", course_title: "Research Project", credit_units: 6, level: "400", semester: "Third", status: "Required", program: "Part-Time", department: "Department of Management" },
];

/**
 * Department of Project Management Official Curriculum
 * Faculty of Management Sciences, University of Port Harcourt
 */
export const PROJECT_MANAGEMENT_COURSES = [
  // 100 LEVEL - FIRST SEMESTER (16 Units)
  // Compulsory: 8 units (4 courses), Required: 8 units (4 courses)
  { course_code: "GES 111.1", course_title: "Communication in English", credit_units: 2, level: "100", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "MGT 101.1", course_title: "Introduction to Business I", credit_units: 2, level: "100", semester: "First", status: "Required", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "AMS 101.1", course_title: "Principles of Management", credit_units: 2, level: "100", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "PMG 111.1", course_title: "Business Analysis", credit_units: 2, level: "100", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "AMS 103.2", course_title: "Introduction to Computing and Applications of Computer in Business", credit_units: 2, level: "100", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "HMT 111.1", course_title: "Introduction to Hospitality and Tourism", credit_units: 2, level: "100", semester: "First", status: "Required", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "ACT 111.1", course_title: "Introduction to Financial Accounting I", credit_units: 2, level: "100", semester: "First", status: "Required", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "FIN 111.1", course_title: "Introduction to Finance", credit_units: 2, level: "100", semester: "First", status: "Required", program: "Full-Time", department: "Department of Project Management" },

  // 100 LEVEL - SECOND SEMESTER (17 Units)
  // Compulsory: 15 units (7 courses), Required: 2 units (1 course)
  { course_code: "GES 112.2", course_title: "Nigerian People and Culture", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "AMS 102.1", course_title: "Basic Mathematics for Management Sciences", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "AMS 104.2", course_title: "Principles of Project Management", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "MGT 113.2", course_title: "Business and Office Communication", credit_units: 3, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "MKT 111.2", course_title: "Elements of Marketing", credit_units: 2, level: "100", semester: "Second", status: "Required", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "PMG 112.2", course_title: "Project Brief", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "PMG 121.2", course_title: "Introduction to Project Methodologies", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "PMG 122.2", course_title: "Introduction to Requirement Engineering", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },

  // 200 LEVEL - FIRST SEMESTER (15 Units)
  // Compulsory: 15 units (7 courses), Required: 0 units
  { course_code: "GES 211.1", course_title: "Entrepreneurship and Innovation", credit_units: 2, level: "200", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "PMG 211.1", course_title: "Stakeholder Management", credit_units: 2, level: "200", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "PMG 212.1", course_title: "Effective Project Leadership", credit_units: 2, level: "200", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "PMG 213.1", course_title: "Project Finance and Resources Management", credit_units: 2, level: "200", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "PMG 221.1", course_title: "Project Scheduling and Cost Management", credit_units: 2, level: "200", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "MGT 201.1", course_title: "Principles of Business Administration I", credit_units: 3, level: "200", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "GSC 201.1", course_title: "Community Service", credit_units: 2, level: "200", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },

  // 200 LEVEL - SECOND SEMESTER (17 Units)
  // Compulsory: 17 units (7 courses), Required: 0 units
  { course_code: "PMG 222.2", course_title: "Project Performance and Quality Assurance", credit_units: 2, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "PMG 223.2", course_title: "Project Planning and Work Based Learning", credit_units: 2, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "MGT 212.2", course_title: "Business Statistics", credit_units: 3, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "MGT 214.2", course_title: "Quantitative Analysis in Management", credit_units: 3, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "MGT 215.2", course_title: "Green Management", credit_units: 2, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "MGT 218.2", course_title: "Principles of Business Administration II", credit_units: 3, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "GES 212.2", course_title: "Philosophy, Logic, and Human Existence", credit_units: 2, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },

  // 300 LEVEL - FIRST SEMESTER (21 Units)
  // Compulsory: 18 units (7 courses), Required: 3 units (1 course)
  { course_code: "GES 312.1", course_title: "Peace and Conflict Resolution", credit_units: 2, level: "300", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "MGT 303.1", course_title: "Management Theory", credit_units: 3, level: "300", semester: "First", status: "Required", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "PMG 311.1", course_title: "Agile Methodologies for Project Management", credit_units: 3, level: "300", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "PMG 313.1", course_title: "Project Scope Management", credit_units: 2, level: "300", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "PMG 321.1", course_title: "Procurement and Contract Management", credit_units: 2, level: "300", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "PMG 323.1", course_title: "Internship Work Experience", credit_units: 4, level: "300", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "MGT 315.1", course_title: "Business Research Methods", credit_units: 3, level: "300", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "MGT 314.2", course_title: "Innovation Management", credit_units: 2, level: "300", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },

  // 300 LEVEL - SECOND SEMESTER (19 Units)
  // Compulsory: 19 units (8 courses), Required: 0 units
  { course_code: "GES 300.2", course_title: "Venture Creation", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "PMG 312.2", course_title: "Project Risk & Change Management", credit_units: 3, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "PMG 322.2", course_title: "Project Professional Ethics and Conducts", credit_units: 3, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "MGT 306.2", course_title: "Small Business Management", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "MGT 312.2", course_title: "Fundamentals of Business Data Analytics", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "MGT 318.2", course_title: "Supply Chain Management", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "MGT 355.2", course_title: "Business Law", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "MGT 311.1", course_title: "Production and Operation Management", credit_units: 3, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },

  // 400 LEVEL - FIRST SEMESTER (16 Units)
  // Compulsory: 13 units (5 courses), Required: 3 units (1 course)
  { course_code: "PMG 411.1", course_title: "DUCAP Project Management Methodology", credit_units: 3, level: "400", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "PMG 412.1", course_title: "Managing Outcome Realisation", credit_units: 3, level: "400", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "PMG 413.1", course_title: "International Projects Management", credit_units: 3, level: "400", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "MGT 417.2", course_title: "Feasibilities and Business Planning", credit_units: 2, level: "400", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "MGT 404.2", course_title: "Management Information System", credit_units: 2, level: "400", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "MGT 411.1", course_title: "Analysis for Business Decision", credit_units: 3, level: "400", semester: "First", status: "Required", program: "Full-Time", department: "Department of Project Management" },

  // 400 LEVEL - SECOND SEMESTER (20 Units)
  // Compulsory: 18 units (5 courses), Required: 2 units (1 course)
  { course_code: "PMG 414.1", course_title: "Non-Profit Project Management", credit_units: 3, level: "400", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "PMG 422.2", course_title: "Environmental Impact Assessments and Sustainability Planning", credit_units: 3, level: "400", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "PMG 421.2", course_title: "Programmes & Portfolios Management", credit_units: 3, level: "400", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "PMG 426.2", course_title: "Project Appraisal and Closure", credit_units: 3, level: "400", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "MGT 400.2", course_title: "Entrepreneurial Project", credit_units: 2, level: "400", semester: "Second", status: "Required", program: "Full-Time", department: "Department of Project Management" },
  { course_code: "PMG 424.2", course_title: "Research Project", credit_units: 6, level: "400", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Project Management" },
];

export const ERHRM_COURSES = [
  // 100 LEVEL - FIRST SEMESTER (16 Units)
  // Compulsory: 8 units (4 courses), Required: 8 units (4 courses)
  { course_code: "GES 111.1", course_title: "Communication in English", credit_units: 2, level: "100", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "MGT 101.1", course_title: "Introduction to Business I", credit_units: 2, level: "100", semester: "First", status: "Required", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "AMS 101.1", course_title: "Principles of Management", credit_units: 2, level: "100", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 101.1", course_title: "Introduction to Human Resource Management", credit_units: 2, level: "100", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "FIN 111.1", course_title: "Introduction to Finance", credit_units: 2, level: "100", semester: "First", status: "Required", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "HMT 111.1", course_title: "Introduction to Hospitality and Tourism (HTM)", credit_units: 2, level: "100", semester: "First", status: "Required", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "ACT 111.1", course_title: "Introduction to Financial Accounting I", credit_units: 2, level: "100", semester: "First", status: "Required", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "AMS 103.2", course_title: "Introduction to Computing", credit_units: 2, level: "100", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },

  // 100 LEVEL - SECOND SEMESTER (15 Units)
  // Compulsory: 13 units (6 courses), Required: 2 units (1 course)
  { course_code: "GES 112.2", course_title: "Nigerian People and Culture", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "AMS 104.2", course_title: "Principles of Project Management", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "MGT 113.2", course_title: "Business and Office Communication", credit_units: 3, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "AMS 102.1", course_title: "Basic Mathematics for Management Sciences", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 102.2", course_title: "Introduction to Employment Relations", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "MKT 111.2", course_title: "Elements of Marketing", credit_units: 2, level: "100", semester: "Second", status: "Required", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "IEM 122.2", course_title: "The Nigerian Entrepreneurial Environment", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },

  // 200 LEVEL - FIRST SEMESTER (16 Units)
  // Compulsory: 12 units (6 courses), Required: 4 units (2 courses)
  { course_code: "GES 211.1", course_title: "Entrepreneurship and Innovation", credit_units: 2, level: "200", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 201.1", course_title: "Human Resource Planning and Administration", credit_units: 2, level: "200", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 202.1", course_title: "Recruitment, Selection and Placement", credit_units: 2, level: "200", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 203.1", course_title: "Trade Unions and Employers Associations", credit_units: 2, level: "200", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 204.1", course_title: "Communication in HRM and Employment Relations", credit_units: 2, level: "200", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "MGT 203.1", course_title: "Non-Profit Management", credit_units: 2, level: "200", semester: "First", status: "Required", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 205.2", course_title: "Industrial and Organizational Behaviors", credit_units: 2, level: "200", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "GCS 201.1", course_title: "Community Service", credit_units: 2, level: "200", semester: "First", status: "Required", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },

  // 200 LEVEL - SECOND SEMESTER (18 Units)
  // Compulsory: 8 units (4 courses), Required: 10 units (4 courses)
  { course_code: "EHR 206.2", course_title: "Occupational Safety and Health", credit_units: 2, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 207.2", course_title: "Public Sector Human Resource Management", credit_units: 2, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 208.2", course_title: "Human Resource Metrics and Analytics", credit_units: 2, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "MGT 212.2", course_title: "Business Statistics", credit_units: 3, level: "200", semester: "Second", status: "Required", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "MGT 213.2", course_title: "Family Business Management", credit_units: 2, level: "200", semester: "Second", status: "Required", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "MGT 215.2", course_title: "Green Management", credit_units: 2, level: "200", semester: "Second", status: "Required", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "MGT 214.2", course_title: "Quantitative Analysis in Management", credit_units: 3, level: "200", semester: "Second", status: "Required", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "GES 212.2", course_title: "Philosophy, Logic, and Human Existence", credit_units: 2, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },

  // 300 LEVEL - FIRST SEMESTER (21 Units)
  // Compulsory: 18 units (8 courses), Required: 3 units (1 course)
  { course_code: "GES 312.1", course_title: "Peace and Conflict Resolution", credit_units: 2, level: "300", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "MGT 303.1", course_title: "Management Theory", credit_units: 3, level: "300", semester: "First", status: "Required", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "ENT 312.1", course_title: "Venture Creation", credit_units: 2, level: "300", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 301.1", course_title: "Collective Bargaining and Negotiation Skills", credit_units: 2, level: "300", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 302.1", course_title: "Human Resource Development", credit_units: 2, level: "300", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 303.1", course_title: "Conflict Management in the Workplace", credit_units: 2, level: "300", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 305.1", course_title: "Compensation and Benefit Management", credit_units: 2, level: "300", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "MGT 315.1", course_title: "Business Research Methods", credit_units: 3, level: "300", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "MGT 319.1", course_title: "Labour Law", credit_units: 3, level: "300", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },

  // 300 LEVEL - SECOND SEMESTER (19 Units)
  // Compulsory: 17 units (8 courses), Required: 2 units (1 course)
  { course_code: "GES 300.2", course_title: "Venture Creation", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 307.2", course_title: "Comparative HRM and Employment Relations", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 308.2", course_title: "Industrial Visit on HRM and Employment Relations Practices", credit_units: 3, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 309.2", course_title: "Labour Market Analysis", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 310.2", course_title: "Decent Work and Quality of Work Life", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 311.2", course_title: "Human Resource Information Systems", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 312.2", course_title: "Entrepreneurship in Employee Relations and HRM", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "MGT 355.2", course_title: "Business Law", credit_units: 2, level: "300", semester: "Second", status: "Required", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 304.1", course_title: "Performance Appraisal and Management", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },

  // 400 LEVEL - FIRST SEMESTER (17 Units)
  // Compulsory: 8 units (4 courses), Required: 9 units (3 courses)
  { course_code: "EHR 401.1", course_title: "Strategic Human Resource Management", credit_units: 2, level: "400", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 402.1", course_title: "Multinational HRM and Employment Relations", credit_units: 2, level: "400", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 403.1", course_title: "HRM and Employment Relations Theories", credit_units: 2, level: "400", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "MGT 401.1", course_title: "Business Policy and Strategic Management", credit_units: 3, level: "400", semester: "First", status: "Required", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "MGT 403.1", course_title: "International Business", credit_units: 3, level: "400", semester: "First", status: "Required", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "MGT 411.1", course_title: "Analysis for Business Decision", credit_units: 3, level: "400", semester: "First", status: "Required", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "MGT 453.1", course_title: "Management Information System", credit_units: 2, level: "400", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },

  // 400 LEVEL - SECOND SEMESTER (20 Units)
  // Compulsory: 14 units (5 courses), Required: 6 units (3 courses)
  { course_code: "EHR 404.2", course_title: "Talent/Skills Acquisition and Management", credit_units: 2, level: "400", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 405.2", course_title: "Diversity and Inclusion Management", credit_units: 2, level: "400", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 406.2", course_title: "Severance Management", credit_units: 2, level: "400", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 407.2", course_title: "Gender Issues in HRM and Employment Relations", credit_units: 2, level: "400", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "EHR 499.2", course_title: "Research Project", credit_units: 6, level: "400", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "MGT 414.2", course_title: "Comparative Management", credit_units: 2, level: "400", semester: "Second", status: "Required", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "MGT 415.2", course_title: "Service Sector Management", credit_units: 2, level: "400", semester: "Second", status: "Required", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
  { course_code: "MGT 400.2", course_title: "Entrepreneurial Project", credit_units: 2, level: "400", semester: "Second", status: "Required", program: "Full-Time", department: "Department of Employee Relations and Human Resource Management" },
];

export const IEM_COURSES = [
  // 100 LEVEL - FIRST SEMESTER (17 Units)
  // Compulsory: 11 units (5 courses), Required: 6 units (3 courses)
  { course_code: "GES 111.1", course_title: "Communication in English", credit_units: 2, level: "100", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "ECO 101.1", course_title: "Principles of Economics", credit_units: 2, level: "100", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "AMS 101.1", course_title: "Principles of Management", credit_units: 2, level: "100", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 102.1", course_title: "Elements of Book Keeping", credit_units: 3, level: "100", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "AMS 103.2", course_title: "Introduction to Computing and Applications of Computer in Business", credit_units: 2, level: "100", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "HMT 111.1", course_title: "Introduction to Hospitality and Tourism (HTM)", credit_units: 2, level: "100", semester: "First", status: "Required", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "ACT 111.1", course_title: "Introduction to Financial Accounting 1", credit_units: 2, level: "100", semester: "First", status: "Required", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "FIN 111.1", course_title: "Introduction to Finance", credit_units: 2, level: "100", semester: "First", status: "Required", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },

  // 100 LEVEL - SECOND SEMESTER (18 Units)
  // Compulsory: 16 units (7 courses), Required: 2 units (1 course)
  { course_code: "GES 112.2", course_title: "Nigerian People and Culture", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "AMS 102.1", course_title: "Basic Mathematics for Management Sciences", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "AMS 104.2", course_title: "Principles of Project Management", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 121.2", course_title: "Introduction to Entrepreneurship & Venture Creation", credit_units: 3, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 122.2", course_title: "The Nigerian Entrepreneurial Environment", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 124.2", course_title: "Basic Financial Literacy", credit_units: 3, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 125.2", course_title: "Business Statistics 1", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "MKT 111.2", course_title: "Elements of Marketing", credit_units: 2, level: "100", semester: "Second", status: "Required", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },

  // 200 LEVEL - FIRST SEMESTER (16 Units)
  // Compulsory: 10 units (5 courses), Required: 6 units (2 courses)
  { course_code: "GES 211.1", course_title: "Entrepreneurship and Innovation", credit_units: 2, level: "200", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "MGT 201.1", course_title: "Principles of Business Administration I", credit_units: 3, level: "200", semester: "First", status: "Required", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 211.1", course_title: "Technology and Innovation Management", credit_units: 2, level: "200", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "MGT 212.1", course_title: "Business Statistics II", credit_units: 3, level: "200", semester: "First", status: "Required", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 214.1", course_title: "Business Information Legal Framework and Cyber Security", credit_units: 2, level: "200", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "MGT 222.1", course_title: "Management Information System", credit_units: 2, level: "200", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "ETM 223.1", course_title: "Introduction to Entrepreneurial Financing", credit_units: 2, level: "200", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },

  // 200 LEVEL - SECOND SEMESTER (18 Units)
  // Compulsory: 16 units (7 courses), Required: 2 units (1 course)
  { course_code: "IEM 224.2", course_title: "Entrepreneurship and Change Management", credit_units: 2, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 225.2", course_title: "Entrepreneurial Marketing", credit_units: 2, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 226.2", course_title: "Web Evolution and Technologies", credit_units: 2, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 227.2", course_title: "Theories of Entrepreneurship", credit_units: 2, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 228.2", course_title: "Fundamentals of Mobile Computing", credit_units: 2, level: "200", semester: "Second", status: "Required", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 232.2", course_title: "Industrial Learning and Tours 1", credit_units: 3, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 234.2", course_title: "Biographical Studies of Entrepreneurial Thinkers and Giants", credit_units: 3, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "GES 212.2", course_title: "Philosophy, Logic, and Human Existence", credit_units: 2, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },

  // 300 LEVEL - FIRST SEMESTER (19 Units)
  // Compulsory: 11 units (5 courses), Required: 8 units (3 courses)
  { course_code: "GES 312.1", course_title: "Peace and Conflict Resolution", credit_units: 2, level: "300", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "MGT 303.1", course_title: "Management Theory", credit_units: 3, level: "300", semester: "First", status: "Required", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "MGT 304.1", course_title: "Human Resource Management", credit_units: 2, level: "300", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 313.1", course_title: "Database Systems and Business Intelligence", credit_units: 3, level: "300", semester: "First", status: "Required", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 315.1", course_title: "Business Opportunity Scouting and Evaluation", credit_units: 2, level: "300", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 321.1", course_title: "Ethical and Professional Context of Technology", credit_units: 2, level: "300", semester: "First", status: "Required", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 323.1", course_title: "Sociology of Entrepreneurship", credit_units: 2, level: "300", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 334.2", course_title: "Business Research Methods", credit_units: 3, level: "300", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },

  // 300 LEVEL - SECOND SEMESTER (17 Units)
  // Compulsory: 17 units (7 courses), Required: 0 units
  { course_code: "GES 300.2", course_title: "Venture Creation", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "MGT 312.2", course_title: "Digital Business Strategy", credit_units: 3, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 325.1", course_title: "Small Scale Business Management", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 328.2", course_title: "Family Business and Succession Plan", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 332.2", course_title: "Feasibilities and Business Planning", credit_units: 3, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "MGT 355.2", course_title: "Business Law", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 336.2", course_title: "Industrial Learning and Tours 2", credit_units: 3, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },

  // 400 LEVEL - FIRST SEMESTER (18 Units)
  // Compulsory: 11 units (5 courses), Required: 7 units (3 courses)
  { course_code: "MGT 401.1", course_title: "Business Policy and Strategic Management", credit_units: 3, level: "400", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "MGT 411.1", course_title: "Analysis for Business Decision", credit_units: 3, level: "400", semester: "First", status: "Required", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 416.1", course_title: "Social Entrepreneurship and Community Development", credit_units: 2, level: "400", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 417.1", course_title: "Technology Entrepreneurship and Intellectual Property Rights", credit_units: 2, level: "400", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "MGT 409.1", course_title: "Management Information System", credit_units: 2, level: "400", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "MGT 423.1", course_title: "Smart Systems and Business", credit_units: 2, level: "400", semester: "First", status: "Required", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 424.1", course_title: "Management of Creativity and Innovation", credit_units: 2, level: "400", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "MGT 418.2", course_title: "Comparative Management", credit_units: 2, level: "400", semester: "First", status: "Required", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },

  // 400 LEVEL - SECOND SEMESTER (19 Units)
  // Compulsory: 19 units (6 courses), Required: 0 units
  { course_code: "MGT 427.2", course_title: "E-Business", credit_units: 2, level: "400", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 428.2", course_title: "Entrepreneurship and Gender Issues", credit_units: 2, level: "400", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 429.2", course_title: "Strategic Thinking, Problem Solving and Negotiation Skills", credit_units: 2, level: "400", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 432.2", course_title: "Risk Management and Insurance", credit_units: 3, level: "400", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "IEM 442.2", course_title: "Research for Enterprise", credit_units: 4, level: "400", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
  { course_code: "MGT 498.2", course_title: "Research Project", credit_units: 6, level: "400", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Innovation and Entrepreneurship Management" },
];

export const PRM_COURSES = [
  // 100 LEVEL - FIRST SEMESTER (17 Units)
  // Compulsory: 9 units (4 courses), Required: 8 units (4 courses)
  { course_code: "GES 111.1", course_title: "Communication in English", credit_units: 2, level: "100", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "MGT 101.1", course_title: "Introduction to Business I", credit_units: 2, level: "100", semester: "First", status: "Required", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "AMS 101.1", course_title: "Principles of Management", credit_units: 2, level: "100", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "AMS 103.2", course_title: "Introduction to Computing and Applications of Computer in Business", credit_units: 2, level: "100", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "HMT 111.1", course_title: "Introduction to Hospitality and Tourism (HTM)", credit_units: 2, level: "100", semester: "First", status: "Required", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "ACT 111.1", course_title: "Introduction to Financial Accounting I", credit_units: 2, level: "100", semester: "First", status: "Required", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "FIN 111.1", course_title: "Introduction to Finance", credit_units: 2, level: "100", semester: "First", status: "Required", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "PRM 101.1", course_title: "Introduction to Procurement I", credit_units: 3, level: "100", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },

  // 100 LEVEL - SECOND SEMESTER (18 Units)
  // Compulsory: 16 units (7 courses), Required: 2 units (1 course)
  { course_code: "GES 112.2", course_title: "Nigerian People and Culture", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "AMS 102.1", course_title: "Basic Mathematics for Management Sciences", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "AMS 104.2", course_title: "Principles of Project Management", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "MGT 113.2", course_title: "Business and Office Communication", credit_units: 3, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "MKT 111.2", course_title: "Elements of Marketing", credit_units: 2, level: "100", semester: "Second", status: "Required", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "PRM 102.2", course_title: "Introduction to Procurement II", credit_units: 3, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "PRM 104.2", course_title: "Introduction to Procurement and Supply Environments", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "MGT 112.2", course_title: "Introduction to Business II", credit_units: 2, level: "100", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },

  // 200 LEVEL - FIRST SEMESTER (18 Units)
  // Compulsory: 16 units (7 courses), Required: 2 units (1 course)
  { course_code: "GES 211.1", course_title: "Entrepreneurship and Innovation", credit_units: 2, level: "200", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "PRM 201.1", course_title: "Procurement Planning and Budgeting", credit_units: 2, level: "200", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "PRM 203.1", course_title: "Project and Quality Management in Procurement", credit_units: 2, level: "200", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "PRM 202.1", course_title: "Global Procurement Practices", credit_units: 2, level: "200", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "PRM 204.1", course_title: "Sustainable Procurement", credit_units: 3, level: "200", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "PRM 205.1", credit_units: 3, course_title: "Essentials of Supply Chain Management", level: "200", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "MGT 253.1", course_title: "Business Communication I", credit_units: 2, level: "200", semester: "First", status: "Required", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "GSC 201.1", course_title: "Community Service", credit_units: 2, level: "200", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },

  // 200 LEVEL - SECOND SEMESTER (19 Units)
  // Compulsory: 12 units (5 courses), Required: 7 units (3 courses)
  { course_code: "PRM 207.2", course_title: "Operations Management", credit_units: 2, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "MGT 212.2", course_title: "Business Statistics for Procurement Management", credit_units: 3, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "MGT 214.2", course_title: "Quantitative Analysis in Management", credit_units: 3, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "MGT 202.2", course_title: "Business Psychology", credit_units: 3, level: "200", semester: "Second", status: "Required", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "MGT 254.2", course_title: "Business Communication II", credit_units: 2, level: "200", semester: "Second", status: "Required", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "MGT 206.2", course_title: "Small Business Management", credit_units: 2, level: "200", semester: "Second", status: "Required", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "GES 212.2", course_title: "Philosophy, Logic, and Human Existence", credit_units: 2, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "PRM 206", course_title: "Principles of Logistics Management", credit_units: 2, level: "200", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },

  // 300 LEVEL - FIRST SEMESTER (19 Units)
  // Compulsory: 8 units (4 courses), Required: 11 units (4 courses)
  { course_code: "GES 312.1", course_title: "Peace and Conflict Resolution", credit_units: 2, level: "300", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "MGT 303.1", course_title: "Management Theory", credit_units: 3, level: "300", semester: "First", status: "Required", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "MGT 315.1", course_title: "Business Research Methods", credit_units: 3, level: "300", semester: "First", status: "Required", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "PRM 303.1", course_title: "Governance and Ethics in Procurement", credit_units: 2, level: "300", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "PRM 305.1", course_title: "Nigerian Procurement Laws", credit_units: 2, level: "300", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "PRM 307.1", course_title: "Alternative Dispute Resolution", credit_units: 2, level: "300", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "MGT 311.1", course_title: "Production and Operations Management", credit_units: 3, level: "300", semester: "First", status: "Required", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "MGT 317.1", course_title: "Organisational Behaviour", credit_units: 2, level: "300", semester: "First", status: "Required", program: "Full-Time", department: "Department of Procurement Management" },

  // 300 LEVEL - SECOND SEMESTER (19 Units)
  // Compulsory: 19 units (9 courses), Required: 0 units
  { course_code: "GES 300.2", course_title: "Venture Creation", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "PRM 308.2", course_title: "Entrepreneurship in Procurement and Supply Management", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "PRM 302.2", course_title: "Contract Law", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "PRM 304.2", course_title: "Electronic Procurement and Digitalization", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "PRM 306.2", course_title: "Supply Chain Risk Management and Resilience", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "MGT 318.2", course_title: "Supply Chain Management", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "PRM 310.2", course_title: "Research Methods in Procurement", credit_units: 3, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "MGT 355.2", course_title: "Business Law", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "PRM 301", course_title: "Procurement and Contract Management", credit_units: 2, level: "300", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },

  // 400 LEVEL - FIRST SEMESTER (15 Units)
  // Compulsory: 10 units (3 courses), Required: 5 units (2 courses)
  { course_code: "PRM 401.1", course_title: "SIWES", credit_units: 6, level: "400", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "MGT 411.1", course_title: "Analysis for Business Decision", credit_units: 3, level: "400", semester: "First", status: "Required", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "MGT 417.1", course_title: "Feasibilities and Business Planning", credit_units: 2, level: "400", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "MGT 453.1", course_title: "Management Information System", credit_units: 2, level: "400", semester: "First", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "MGT 459.1", course_title: "Corporate Social Responsibilities", credit_units: 2, level: "400", semester: "First", status: "Required", program: "Full-Time", department: "Department of Procurement Management" },

  // 400 LEVEL - SECOND SEMESTER (22 Units)
  // Compulsory: 14 units (5 courses), Required: 8 units (3 courses)
  { course_code: "PRM 402.2", course_title: "Procurement Audit and Investigation", credit_units: 2, level: "400", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "PRM 404.2", course_title: "Contemporary Issues in Procurement Management", credit_units: 2, level: "400", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "PRM 406.2", course_title: "Lean and Six Sigma", credit_units: 2, level: "400", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "PRM 408.2", course_title: "Case Studies in Procurement Management", credit_units: 2, level: "400", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "MGT 402.2", course_title: "Strategic Thinking and Problem Solving", credit_units: 3, level: "400", semester: "Second", status: "Required", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "MGT 460.2", course_title: "International Business", credit_units: 3, level: "400", semester: "Second", status: "Required", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "MGT 400.2", course_title: "Entrepreneurial Project", credit_units: 2, level: "400", semester: "Second", status: "Required", program: "Full-Time", department: "Department of Procurement Management" },
  { course_code: "PRM 424.2", course_title: "Research Project", credit_units: 6, level: "400", semester: "Second", status: "Compulsory", program: "Full-Time", department: "Department of Procurement Management" },
];

export const ALL_INITIAL_COURSES = [
  ...DEFAULT_COURSES.map(c => ({ department: "Department of Management", ...c })),
  ...DEFAULT_COURSES_PART_TIME.map(c => ({ department: "Department of Management", ...c })),
  ...PROJECT_MANAGEMENT_COURSES,
  ...ERHRM_COURSES,
  ...IEM_COURSES,
  ...PRM_COURSES
];
