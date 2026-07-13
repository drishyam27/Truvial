import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectsStore } from '../state/projects';

describe('useProjectsStore unit tests', () => {
  beforeEach(() => {
    // Reset to initial settings
    useProjectsStore.setState({
      projects: [
        {
          id: 1,
          title: 'Clean Water Initiative',
          description: 'Drilling solar community boreholes.',
          beneficiary: 'GDW2O2...CleanWaterNGO',
          totalBudget: 15000,
          allocated: 0,
          milestones: []
        }
      ],
      donations: [],
      activities: [],
      totalTreasuryBalance: 0
    });
  });

  it('should list projects and handle donation pool updates', () => {
    const donor = 'GBDONOR888...ALICE';
    useProjectsStore.getState().addDonation(donor, 500, true);

    const state = useProjectsStore.getState();
    expect(state.donations.length).toBe(1);
    expect(state.donations[0].amount).toBe(500);
    expect(state.totalTreasuryBalance).toBe(500);
    expect(state.activities.length).toBe(1);
    expect(state.activities[0].type).toBe('donation');
  });

  it('should launch new initiatives successfully', () => {
    useProjectsStore.getState().createProject(
      'Solar Classrooms',
      'Equipping classrooms with solar panels.',
      'GBC2H4...EduSolarGroup',
      8000
    );

    const state = useProjectsStore.getState();
    expect(state.projects.length).toBe(2);
    expect(state.projects[1].title).toBe('Solar Classrooms');
    expect(state.projects[1].totalBudget).toBe(8000);
    expect(state.activities[0].type).toBe('project_created');
  });

  it('should add milestones to projects and update allocation levels', () => {
    useProjectsStore.getState().addMilestone(1, 'Purchase Hardware', 3000);

    const state = useProjectsStore.getState();
    const proj = state.projects.find(p => p.id === 1);
    expect(proj?.milestones.length).toBe(1);
    expect(proj?.milestones[0].title).toBe('Purchase Hardware');
    expect(proj?.milestones[0].amount).toBe(3000);
    expect(proj?.allocated).toBe(3000);
  });

  it('should transition milestone states from Pending to Approved to Paid', () => {
    // Set up project milestone
    useProjectsStore.getState().addMilestone(1, 'Survey', 1000);
    
    // 1. Pending -> Approved
    useProjectsStore.getState().approveMilestone(1, 1);
    let state = useProjectsStore.getState();
    let milestone = state.projects[0].milestones[0];
    expect(milestone.status).toBe('Approved');
    expect(state.activities[0].type).toBe('milestone_approved');

    // 2. Approved -> Paid
    useProjectsStore.setState({ totalTreasuryBalance: 2000 }); // Inject some balance
    useProjectsStore.getState().releaseMilestoneFunds(1, 1);
    state = useProjectsStore.getState();
    milestone = state.projects[0].milestones[0];
    expect(milestone.status).toBe('Paid');
    expect(state.totalTreasuryBalance).toBe(1000); // Deduced by milestone amount
    expect(state.activities[0].type).toBe('milestone_released');
  });
});
