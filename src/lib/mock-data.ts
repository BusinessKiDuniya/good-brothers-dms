export type DonationStatus = "SUCCESS" | "PENDING" | "FAILED";

export type DonationType = "ONE_TIME" | "MONTHLY";

export const ngo = {
  name: "Good Brothers Trust",

  tagline: "Together, we can create a better future.",

  description:
    "We work with communities to improve education, healthcare and basic living conditions.",

  stats: [
    {
      value: "10,000+",
      label: "Meals Served",
    },
    {
      value: "700+",
      label: "Cloths Donated",
    },
    {
      value: "200+",
      label: "Trees Planted",
    },
    {
      value: "11,000",
      label: "Lives Impacted",
    },
  ],
};

export const currentUser = {
  id: "USR-1001",

  name: "Dipish Bisht",

  email: "dipish@example.com",

  mobile: "+91 98765 43210",

  avatar: "",

  provider: "google" as const,
};

export const donations = [
  {
    id: "DON-000123",
    date: "05 Sep 2026",
    amount: 2000,
    type: "ONE_TIME" as DonationType,
    status: "SUCCESS" as DonationStatus,
    project: "Education for Every Child",
    payment: "Razorpay",
  },

  {
    id: "DON-000110",
    date: "12 Aug 2026",
    amount: 500,
    type: "MONTHLY" as DonationType,
    status: "SUCCESS" as DonationStatus,
    project: "Community Education",
    payment: "Razorpay",
  },

  {
    id: "DON-000095",
    date: "12 Jul 2026",
    amount: 500,
    type: "MONTHLY" as DonationType,
    status: "SUCCESS" as DonationStatus,
    project: "Community Education",
    payment: "Razorpay",
  },

  {
    id: "DON-000081",
    date: "12 Jun 2026",
    amount: 500,
    type: "MONTHLY" as DonationType,
    status: "SUCCESS" as DonationStatus,
    project: "Community Education",
    payment: "Razorpay",
  },

  {
    id: "DON-000067",
    date: "18 May 2026",
    amount: 1000,
    type: "ONE_TIME" as DonationType,
    status: "SUCCESS" as DonationStatus,
    project: "Medical Camp",
    payment: "Razorpay",
  },

  {
    id: "DON-000044",
    date: "10 Apr 2026",
    amount: 1500,
    type: "ONE_TIME" as DonationType,
    status: "SUCCESS" as DonationStatus,
    project: "Food Distribution",
    payment: "Razorpay",
  },
];

export const projects = [
  {
    title: "Education for Every Child",

    description: "School supplies, learning programs and scholarships.",

    impact: "4,200+ children",

    progress: 78,
  },

  {
    title: "Community Healthcare",

    description: "Free health camps and essential medicines.",

    impact: "6,800+ people",

    progress: 62,
  },

  {
    title: "Food & Nutrition",

    description: "Monthly food support for vulnerable families.",

    impact: "2,100+ families",

    progress: 84,
  },
];

export const adminStats = {
  totalDonations: 2568400,

  totalDonors: 1842,

  monthlyRecurring: 347500,

  successfulPayments: 96.4,
};
