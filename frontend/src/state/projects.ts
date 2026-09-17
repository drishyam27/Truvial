import { create } from 'zustand';

export interface Milestone {
  id: number;
  title: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Paid';
}

export interface Project {
  id: number;
  title: string;
  description: string;
  beneficiary: string;
  totalBudget: number;
  allocated: number;
  milestones: Milestone[];
}

export interface Donation {
  id: string;
  donor: string;
  amount: number;
  timestamp: number;
}

export interface Activity {
  id: string;
  type: 'donation' | 'project_created' | 'milestone_approved' | 'milestone_released' | 'beneficiary_added';
  details: string;
  amount?: number;
  projectTitle?: string;
  timestamp: number;
  hash?: string;
}

interface ProjectsState {
  projects: Project[];
  donations: Donation[];
  activities: Activity[];
  totalTreasuryBalance: number;
  
  // Actions
  addDonation: (donor: string, amount: number, isMock: boolean) => void;
  createProject: (title: string, description: string, beneficiary: string, totalBudget: number) => void;
  addMilestone: (projectId: number, title: string, amount: number) => void;
  approveMilestone: (projectId: number, milestoneId: number) => void;
  releaseMilestoneFunds: (projectId: number, milestoneId: number) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
}

const INITIAL_PROJECTS: Project[] = [
  {
    id: 1,
    title: 'Clean Water Initiative',
    description: 'Drilling solar-powered community boreholes to provide clean drinking water to over 5,000 residents in arid districts.',
    beneficiary: '0x71C...49A2',
    totalBudget: 15000,
    allocated: 15000,
    milestones: [
      { id: 1, title: 'Geological Surveys & Site Prep', amount: 3000, status: 'Paid' },
      { id: 2, title: 'Equipment Purchase & Transport', amount: 7000, status: 'Approved' },
      { id: 3, title: 'Borehole Drilling & Pump Setup', amount: 5000, status: 'Pending' }
    ]
  },
  {
    id: 2,
    title: 'Solar Power for Classrooms',
    description: 'Equipping rural primary schools with off-grid solar panels, storage batteries, and energy-efficient LED light fixtures.',
    beneficiary: '0xB4C...9F10',
    totalBudget: 8000,
    allocated: 8000,
    milestones: [
      { id: 1, title: 'Site Inspection & Permits', amount: 2000, status: 'Paid' },
      { id: 2, title: 'Solar Panels procurement', amount: 6000, status: 'Pending' }
    ]
  }
];

const INITIAL_DONATIONS: Donation[] = [
  { id: '1', donor: '0x254...8E21 (Alice)', amount: 5000, timestamp: Date.now() - 3600000 * 24 * 3 },
  { id: '2', donor: '0x9E1...3C57 (Bob)', amount: 3000, timestamp: Date.now() - 3600000 * 12 },
  { id: '3', donor: '0x48D...A194 (Charlie)', amount: 4500, timestamp: Date.now() - 3600000 * 4 }
];

const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'act_1',
    type: 'project_created',
    details: 'Project "Clean Water Initiative" created by Admin with a budget of 15,000 USDC on Arbitrum Sepolia.',
    timestamp: Date.now() - 3600000 * 24 * 4,
    hash: '0x1a8f3b9d2e7c4f1a8e9d2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e'
  },
  {
    id: 'act_2',
    type: 'donation',
    details: 'Donor 0x254...8E21 contributed 5,000 USDC to the Stylus escrow treasury.',
    amount: 5000,
    timestamp: Date.now() - 3600000 * 24 * 3,
    hash: '0xb3f1a2c4e9c2d1b8f7e6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4'
  },
  {
    id: 'act_3',
    type: 'milestone_released',
    details: 'Milestone "Geological Surveys & Site Prep" funds released on Arbitrum.',
    amount: 3000,
    projectTitle: 'Clean Water Initiative',
    timestamp: Date.now() - 3600000 * 24,
    hash: '0xf4a9e2d18e0d3b4c5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f'
  }
];

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: INITIAL_PROJECTS,
  donations: INITIAL_DONATIONS,
  activities: INITIAL_ACTIVITIES,
  totalTreasuryBalance: 9500, // 12500 total donated minus 3000 paid

  addDonation: (donor, amount, isMock) => {
    const newDonation: Donation = {
      id: Math.random().toString(36).substring(7),
      donor,
      amount,
      timestamp: Date.now()
    };

    const newActivity: Activity = {
      id: 'act_' + Math.random().toString(36).substring(7),
      type: 'donation',
      details: `Donor ${donor.slice(0, 6)}...${donor.slice(-4)} contributed ${amount.toLocaleString()} USDC to the treasury.`,
      amount,
      timestamp: Date.now(),
      hash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
    };


    set((state) => ({
      donations: [newDonation, ...state.donations],
      activities: [newActivity, ...state.activities],
      totalTreasuryBalance: state.totalTreasuryBalance + amount
    }));
  },

  createProject: (title, description, beneficiary, totalBudget) => {
    set((state) => {
      const newProject: Project = {
        id: state.projects.length + 1,
        title,
        description,
        beneficiary,
        totalBudget,
        allocated: 0,
        milestones: []
      };

      const newActivity: Activity = {
        id: 'act_' + Math.random().toString(36).substring(7),
        type: 'project_created',
        details: `Project "${title}" created by Admin with a budget of ${totalBudget.toLocaleString()} USDC.`,
        amount: totalBudget,
        timestamp: Date.now(),
        hash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
      };

      return {
        projects: [...state.projects, newProject],
        activities: [newActivity, ...state.activities]
      };
    });
  },

  addMilestone: (projectId, title, amount) => {
    set((state) => {
      const projects = state.projects.map((proj) => {
        if (proj.id === projectId) {
          const newMilestone: Milestone = {
            id: proj.milestones.length + 1,
            title,
            amount,
            status: 'Pending'
          };
          return {
            ...proj,
            allocated: proj.allocated + amount,
            milestones: [...proj.milestones, newMilestone]
          };
        }
        return proj;
      });

      return { projects };
    });
  },

  approveMilestone: (projectId, milestoneId) => {
    set((state) => {
      let milestoneTitle = '';
      let projTitle = '';
      let amount = 0;

      const projects = state.projects.map((proj) => {
        if (proj.id === projectId) {
          projTitle = proj.title;
          const milestones = proj.milestones.map((m) => {
            if (m.id === milestoneId) {
              milestoneTitle = m.title;
              amount = m.amount;
              return { ...m, status: 'Approved' as const };
            }
            return m;
          });
          return { ...proj, milestones };
        }
        return proj;
      });

      const newActivity: Activity = {
        id: 'act_' + Math.random().toString(36).substring(7),
        type: 'milestone_approved',
        details: `Milestone "${milestoneTitle}" approved for project "${projTitle}".`,
        amount,
        projectTitle: projTitle,
        timestamp: Date.now(),
        hash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
      };

      return {
        projects,
        activities: [newActivity, ...state.activities]
      };
    });
  },

  releaseMilestoneFunds: (projectId, milestoneId) => {
    set((state) => {
      let milestoneTitle = '';
      let projTitle = '';
      let amount = 0;

      const projects = state.projects.map((proj) => {
        if (proj.id === projectId) {
          projTitle = proj.title;
          const milestones = proj.milestones.map((m) => {
            if (m.id === milestoneId) {
              milestoneTitle = m.title;
              amount = m.amount;
              return { ...m, status: 'Paid' as const };
            }
            return m;
          });
          return { ...proj, milestones };
        }
        return proj;
      });

      const newActivity: Activity = {
        id: 'act_' + Math.random().toString(36).substring(7),
        type: 'milestone_released',
        details: `Funds (${amount.toLocaleString()} USDC) released to beneficiary for milestone "${milestoneTitle}".`,
        amount,
        projectTitle: projTitle,
        timestamp: Date.now(),
        hash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
      };

      return {
        projects,
        activities: [newActivity, ...state.activities],
        totalTreasuryBalance: Math.max(0, state.totalTreasuryBalance - amount)
      };
    });
  },

  addActivity: (activity) => {
    set((state) => ({
      activities: [
        {
          ...activity,
          id: 'act_' + Math.random().toString(36).substring(7),
          timestamp: Date.now()
        },
        ...state.activities
      ]
    }));
  }
}));
